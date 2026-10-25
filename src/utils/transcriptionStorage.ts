// Storage for Talk Audio Transcriptions (IndexedDB + Cache Storage API)

export interface TranscriptionChunk {
  id?: string;
  text: string;
  timestamp: [number, number | null]; // [startSeconds, endSeconds]
}

export interface StoredTranscription {
  sessionId: string;
  text: string;
  chunks: TranscriptionChunk[];
  language: "it" | "en";
  model: string;
  createdAt: number;
  durationSeconds?: number;
}

const DB_NAME = "codemotion_transcription_db";
const DB_VERSION = 1;
const STORE_NAME = "transcriptions";
const CACHE_NAME = "codemotion-transcriptions-cache";

let dbInstance: IDBDatabase | null = null;

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

function getCacheUrl(sessionId: string): string {
  const base = typeof window !== "undefined" && window.location ? window.location.origin : "";
  return `${base}/api/transcriptions/${sessionId}.json`;
}

/**
 * Salva la trascrizione sia in IndexedDB che nella Cache Storage del browser.
 */
export async function saveTranscription(
  data: StoredTranscription
): Promise<void> {
  // 1. Salva in IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Impossibile salvare la trascrizione in IndexedDB:", err);
  }

  // 2. Salva in Cache Storage
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const url = getCacheUrl(data.sessionId);
      const jsonResponse = new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "X-Transcription-Session": data.sessionId,
          "X-Transcription-Model": data.model,
          "X-Transcription-Language": data.language,
          "X-Saved-At": String(data.createdAt),
        },
      });
      await cache.put(url, jsonResponse);
    } catch (err) {
      console.warn("Impossibile salvare la trascrizione nella Cache Storage:", err);
    }
  }
}

/**
 * Recupera la trascrizione associata a una sessione da IndexedDB o Cache Storage.
 */
export async function getTranscription(
  sessionId: string
): Promise<StoredTranscription | null> {
  // Prova prima da IndexedDB
  try {
    const db = await openDB();
    const idbResult = await new Promise<StoredTranscription | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(sessionId);
      req.onsuccess = () => resolve((req.result as StoredTranscription) || null);
      req.onerror = () => reject(req.error);
    });

    if (idbResult) {
      return idbResult;
    }
  } catch (err) {
    console.warn("Errore lettura trascrizione da IndexedDB, fallback a Cache Storage:", err);
  }

  // Fallback: recupera da Cache Storage
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const url = getCacheUrl(sessionId);
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        const parsed = (await cachedResponse.json()) as StoredTranscription;
        // Ripopola IndexedDB se mancava
        saveTranscription(parsed).catch(() => {});
        return parsed;
      }
    } catch (err) {
      console.warn("Errore lettura trascrizione da Cache Storage:", err);
    }
  }

  return null;
}

/**
 * Elimina la trascrizione associata a una sessione sia da IndexedDB che da Cache Storage.
 */
export async function deleteTranscription(sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(sessionId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Impossibile eliminare trascrizione da IndexedDB:", err);
  }

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const url = getCacheUrl(sessionId);
      await cache.delete(url);
    } catch (err) {
      console.warn("Impossibile eliminare trascrizione da Cache Storage:", err);
    }
  }
}

/**
 * Controlla se è presente una trascrizione per la sessione specificata.
 */
export async function hasTranscription(sessionId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(IDBKeyRange.only(sessionId));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (count > 0) return true;
  } catch {
    // fallback to cache check
  }

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const match = await cache.match(getCacheUrl(sessionId));
      return Boolean(match);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Svuota tutte le trascrizioni sia da IndexedDB che da Cache Storage.
 */
export async function clearAllTranscriptions(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Impossibile svuotare trascrizioni da IndexedDB:", err);
  }

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      await window.caches.delete(CACHE_NAME);
    } catch (err) {
      console.warn("Impossibile cancellare cache trascrizioni:", err);
    }
  }
}

/**
 * Download file di trascrizione in formato testo (.txt) o JSON.
 */
export function downloadTranscriptionFile(
  transcription: StoredTranscription,
  filename: string,
  format: "txt" | "json" = "txt"
): void {
  let content = "";
  let mimeType = "text/plain";
  let ext = "txt";

  if (format === "json") {
    content = JSON.stringify(transcription, null, 2);
    mimeType = "application/json";
    ext = "json";
  } else {
    // Formato testo leggibile con timestamp
    const lines = [
      `--- Trascrizione Talk (${transcription.language.toUpperCase()}) ---`,
      `Modello: ${transcription.model}`,
      `Data: ${new Date(transcription.createdAt).toLocaleString()}`,
      `-----------------------------------------------------\n`,
    ];

    if (transcription.chunks && transcription.chunks.length > 0) {
      for (const chunk of transcription.chunks) {
        const start = formatTimestamp(chunk.timestamp[0]);
        const end = chunk.timestamp[1] !== null ? formatTimestamp(chunk.timestamp[1]) : "";
        const timeBadge = end ? `[${start} -> ${end}]` : `[${start}]`;
        lines.push(`${timeBadge} ${chunk.text.trim()}`);
      }
    } else {
      lines.push(transcription.text);
    }

    content = lines.join("\n");
  }

  const fullName = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fullName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
