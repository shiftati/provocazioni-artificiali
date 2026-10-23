interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}

interface OpenFilePickerOptions {
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  multiple?: boolean;
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
  }
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";
}

export function isVideoRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined"
  );
}

export function getSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=avc1,mp4a",
    "video/mp4",
  ];

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return "";
}

export function getVideoFileExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

/**
 * Prompts the user to pick where to save the video file using File System Access API.
 * Must be triggered from a direct user interaction (click/touch event).
 */
export async function promptVideoSaveFilePicker(
  suggestedName?: string
): Promise<FileSystemFileHandle> {
  if (!isFileSystemAccessSupported()) {
    throw new Error(
      "La File System Access API non è supportata in questo browser. Usa Chrome, Edge o un browser Chromium desktop."
    );
  }

  const mimeType = getSupportedVideoMimeType();
  const ext = getVideoFileExtension(mimeType);
  const formattedDate = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const defaultName = suggestedName || `talk-video-${formattedDate}.${ext}`;

  const acceptRecord: Record<string, string[]> =
    ext === "mp4"
      ? { "video/mp4": [".mp4"] }
      : { "video/webm": [".webm"] };

  return await window.showSaveFilePicker!({
    suggestedName: defaultName,
    types: [
      {
        description: ext === "mp4" ? "Video MP4" : "Video WebM",
        accept: acceptRecord,
      },
    ],
  });
}

/**
 * Sequential asynchronous chunk writer to ensure streaming chunks are written in order
 * without concurrency issues.
 */
export class DiskChunkWriter {
  private writable: FileSystemWritableFileStream;
  private queue: Promise<void> = Promise.resolve();
  private writeError: Error | null = null;
  private bytesWritten: number = 0;

  constructor(writable: FileSystemWritableFileStream) {
    this.writable = writable;
  }

  public write(chunk: Blob): void {
    this.bytesWritten += chunk.size;
    this.queue = this.queue.then(async () => {
      try {
        await this.writable.write(chunk);
      } catch (err) {
        this.writeError = err as Error;
        console.error("Errore di scrittura chunk video su disco:", err);
      }
    });
  }

  public async close(): Promise<{ totalBytes: number }> {
    await this.queue;
    await this.writable.close();
    if (this.writeError) {
      throw this.writeError;
    }
    return { totalBytes: this.bytesWritten };
  }

  public getBytesWritten(): number {
    return this.bytesWritten;
  }
}

/* ==========================================================================
   IndexedDB Storage for FileSystemFileHandle
   Allows re-opening the recorded video directly in Replay without prompting
   ========================================================================== */

const VIDEO_DB_NAME = "codemotion_video_db";
const VIDEO_DB_VERSION = 1;
const VIDEO_HANDLES_STORE = "video_handles";

let videoDbInstance: IDBDatabase | null = null;

function openVideoDB(): Promise<IDBDatabase> {
  if (videoDbInstance) {
    return Promise.resolve(videoDbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB non è supportato in questo browser"));
      return;
    }

    const request = indexedDB.open(VIDEO_DB_NAME, VIDEO_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(VIDEO_HANDLES_STORE)) {
        db.createObjectStore(VIDEO_HANDLES_STORE, { keyPath: "sessionId" });
      }
    };

    request.onsuccess = (event) => {
      videoDbInstance = (event.target as IDBOpenDBRequest).result;
      videoDbInstance.onversionchange = () => {
        videoDbInstance?.close();
        videoDbInstance = null;
      };
      resolve(videoDbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function saveVideoFileHandle(
  sessionId: string,
  handle: FileSystemFileHandle
): Promise<void> {
  try {
    const db = await openVideoDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(VIDEO_HANDLES_STORE, "readwrite");
      const store = tx.objectStore(VIDEO_HANDLES_STORE);
      const req = store.put({
        sessionId,
        handle,
        fileName: handle.name,
        createdAt: Date.now(),
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Impossibile salvare il video handle in IndexedDB:", err);
  }
}

export async function getVideoFileHandle(
  sessionId: string
): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openVideoDB();
    return await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
      const tx = db.transaction(VIDEO_HANDLES_STORE, "readonly");
      const store = tx.objectStore(VIDEO_HANDLES_STORE);
      const req = store.get(sessionId);
      req.onsuccess = () => {
        const result = req.result as { handle?: FileSystemFileHandle } | undefined;
        resolve(result?.handle ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Impossibile recuperare il video handle da IndexedDB:", err);
    return null;
  }
}

/**
 * Resolves a File from a FileSystemFileHandle, verifying permissions if needed.
 */
export async function resolveVideoFile(
  handle: FileSystemFileHandle,
  requestPermissionIfNeeded = false
): Promise<File | null> {
  try {
    // If the browser implements queryPermission
    if ("queryPermission" in handle) {
      // Type assertion for permissions query
      const handleWithPerm = handle as unknown as {
        queryPermission: (desc: { mode: string }) => Promise<PermissionState>;
        requestPermission?: (desc: { mode: string }) => Promise<PermissionState>;
      };

      let state = await handleWithPerm.queryPermission({ mode: "read" });
      if (state !== "granted" && requestPermissionIfNeeded && handleWithPerm.requestPermission) {
        state = await handleWithPerm.requestPermission({ mode: "read" });
      }

      if (state !== "granted") {
        return null;
      }
    }

    return await handle.getFile();
  } catch (err) {
    console.warn("Errore durante l'accesso al file video dal FileSystemHandle:", err);
    return null;
  }
}

/**
 * Opens a file picker for user to select an existing video file (.webm / .mp4).
 */
export async function promptVideoOpenFilePicker(): Promise<{
  file: File;
  handle?: FileSystemFileHandle;
}> {
  if (typeof window !== "undefined" && typeof window.showOpenFilePicker === "function") {
    const [handle] = await window.showOpenFilePicker!({
      types: [
        {
          description: "Video Talk (WebM, MP4)",
          accept: {
            "video/*": [".webm", ".mp4", ".mkv", ".mov"],
          },
        },
      ],
      multiple: false,
    });
    if (!handle) {
      throw new Error("Nessun file selezionato");
    }
    const file = await handle.getFile();
    return { file, handle };
  }

  // Fallback via standard HTML input
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/webm,video/mp4,video/*";
    input.style.display = "none";

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        resolve({ file });
      } else {
        reject(new Error("Nessun file selezionato"));
      }
      document.body.removeChild(input);
    };

    input.oncancel = () => {
      reject(new Error("Selezione annullata"));
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}
