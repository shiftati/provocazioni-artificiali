// IndexedDB Storage for Talk Audio Recordings
import fixWebmDuration from "fix-webm-duration";

export interface StoredAudioRecording {
  sessionId: string;
  blob: Blob;
  mimeType: string;
  durationSeconds?: number;
  createdAt: number;
}

const DB_NAME = "codemotion_audio_db";
const DB_VERSION = 1;
const STORE_NAME = "recordings";

let dbInstance: IDBDatabase | null = null;

export function isAudioRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined"
  );
}

export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return "";
}

export function getAudioFileExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

/**
 * Injects duration metadata into a WebM Blob recorded with MediaRecorder.
 * Browser MediaRecorder creates WebM containers missing the duration header,
 * which makes duration appear as Infinity and causes erratic/non-linear seeking.
 */
export async function patchWebmBlobDuration(
  blob: Blob,
  durationSeconds: number
): Promise<Blob> {
  if (!blob || !durationSeconds || durationSeconds <= 0) return blob;
  const mime = blob.type || "";
  if (mime && !mime.includes("webm") && !mime.includes("opus") && !mime.includes("octet-stream")) {
    return blob;
  }
  try {
    const fixed = await fixWebmDuration(blob, Math.round(durationSeconds * 1000), {
      logger: false,
    });
    return fixed;
  } catch (err) {
    console.warn("Impossibile iniettare durata WebM:", err);
    return blob;
  }
}

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB non è supportato in questo browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "sessionId" });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function saveAudioRecording(
  recording: StoredAudioRecording
): Promise<void> {
  let finalBlob = recording.blob;
  if (
    recording.durationSeconds &&
    recording.durationSeconds > 0 &&
    (recording.mimeType.includes("webm") || recording.blob.type.includes("webm"))
  ) {
    finalBlob = await patchWebmBlobDuration(recording.blob, recording.durationSeconds);
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({
      ...recording,
      blob: finalBlob,
    });

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAudioRecording(
  sessionId: string,
  fallbackDurationSeconds?: number
): Promise<StoredAudioRecording | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(sessionId);

      req.onsuccess = async () => {
        const result = (req.result as StoredAudioRecording) || null;
        if (!result) {
          resolve(null);
          return;
        }

        const effectiveDuration = result.durationSeconds || fallbackDurationSeconds || 0;
        if (
          effectiveDuration > 0 &&
          (result.mimeType?.includes("webm") || result.blob?.type?.includes("webm"))
        ) {
          try {
            const fixedBlob = await patchWebmBlobDuration(result.blob, effectiveDuration);
            resolve({
              ...result,
              blob: fixedBlob,
              durationSeconds: effectiveDuration,
            });
            return;
          } catch {
            // fallback
          }
        }

        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Impossibile recuperare registrazione audio da IndexedDB:", err);
    return null;
  }
}

export async function deleteAudioRecording(sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(sessionId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Impossibile eliminare registrazione audio da IndexedDB:", err);
  }
}

export async function hasAudioRecording(sessionId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(IDBKeyRange.only(sessionId));

      req.onsuccess = () => {
        resolve(req.result > 0);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

export async function clearAllAudioRecordings(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Impossibile svuotare registrazioni audio:", err);
  }
}

export function downloadAudioFile(
  blob: Blob,
  filename: string,
  mimeType: string
): void {
  const ext = getAudioFileExtension(mimeType);
  const fullName = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fullName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
