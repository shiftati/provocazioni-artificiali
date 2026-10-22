import JSZip from "jszip";
import type { TalkSessionRecord } from "../types";
import {
  getAudioRecording,
  saveAudioRecording,
  getAudioFileExtension,
  inferAudioMimeType,
  detectAudioDuration,
  type StoredAudioRecording,
} from "./audioStorage";

const SUPPORTED_AUDIO_EXTENSIONS = [".webm", ".mp3", ".wav", ".m4a", ".mp4", ".ogg", ".aac"];

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function isZipFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    file.type === "application/x-zip"
  );
}

/**
 * Esporta un singolo talk.
 * Se è presente una registrazione audio in IndexedDB, genera un file .zip contenente:
 * - session.json (con metadati e riferimento audio)
 * - audio_<nome>.<ext> (il file audio effettivo)
 * Se non c'è audio, esporta direttamente il file .json.
 */
export async function exportSingleSessionWithAudio(
  session: TalkSessionRecord
): Promise<{ type: "zip" | "json"; filename: string; hasAudio: boolean }> {
  const cleanName = session.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const dateStr = new Date(session.startedAt || session.createdAt || Date.now())
    .toISOString()
    .slice(0, 10);

  // Verifica presenza traccia audio in IndexedDB
  const recording = await getAudioRecording(session.id, session.totalDurationSeconds);

  if (recording && recording.blob && recording.blob.size > 0) {
    const zip = new JSZip();
    const mime = recording.mimeType || recording.blob.type || "audio/webm";
    const ext = getAudioFileExtension(mime);
    const audioFilename = `audio_${cleanName}.${ext}`;

    const sessionWithAudioRef: TalkSessionRecord = {
      ...session,
      hasAudio: true,
      audioMimeType: mime,
      audioDurationSeconds:
        recording.durationSeconds ||
        session.audioDurationSeconds ||
        session.totalDurationSeconds,
      audioFile: audioFilename,
    };

    zip.file("session.json", JSON.stringify(sessionWithAudioRef, null, 2));
    zip.file(audioFilename, recording.blob);

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const filename = `talk_session_${cleanName}_${dateStr}.zip`;
    triggerDownload(zipBlob, filename);

    return { type: "zip", filename, hasAudio: true };
  } else {
    // Nessun audio associato: esporta come .json
    const filename = `talk_session_${cleanName}_${dateStr}.json`;
    const jsonStr = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    triggerDownload(blob, filename);

    return { type: "json", filename, hasAudio: false };
  }
}

/**
 * Esporta tutte le sessioni.
 * Se almeno un talk ha una registrazione audio in IndexedDB, genera un archivio .zip contenente:
 * - sessions.json
 * - cartella audio/ con i file audio di ciascun talk (nominati <sessionId>.<ext>)
 * Se nessun talk ha audio, esporta direttamente il file .json con l'array delle sessioni.
 */
export async function exportAllSessionsWithAudio(
  sessions: TalkSessionRecord[]
): Promise<{ type: "zip" | "json"; filename: string; audioCount: number }> {
  const dateStr = new Date().toISOString().slice(0, 10);

  // Recupera audio per ciascuna sessione
  const recordingsMap = new Map<string, StoredAudioRecording>();
  for (const session of sessions) {
    const rec = await getAudioRecording(session.id, session.totalDurationSeconds);
    if (rec && rec.blob && rec.blob.size > 0) {
      recordingsMap.set(session.id, rec);
    }
  }

  if (recordingsMap.size > 0) {
    const zip = new JSZip();
    const audioFolder = zip.folder("audio");

    const sessionsWithAudioRef = sessions.map((session) => {
      const rec = recordingsMap.get(session.id);
      if (rec) {
        const mime = rec.mimeType || rec.blob.type || "audio/webm";
        const ext = getAudioFileExtension(mime);
        const audioRelPath = `audio/${session.id}.${ext}`;
        audioFolder?.file(`${session.id}.${ext}`, rec.blob);
        return {
          ...session,
          hasAudio: true,
          audioMimeType: mime,
          audioDurationSeconds:
            rec.durationSeconds ||
            session.audioDurationSeconds ||
            session.totalDurationSeconds,
          audioFile: audioRelPath,
        };
      }
      return session;
    });

    zip.file("sessions.json", JSON.stringify(sessionsWithAudioRef, null, 2));

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const filename = `all_talk_sessions_${dateStr}.zip`;
    triggerDownload(zipBlob, filename);

    return { type: "zip", filename, audioCount: recordingsMap.size };
  } else {
    // Nessun talk ha audio: esporta .json
    const filename = `all_talk_sessions_${dateStr}.json`;
    const jsonStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    triggerDownload(blob, filename);

    return { type: "json", filename, audioCount: 0 };
  }
}

/**
 * Importa da archivio ZIP.
 * Estrae le sessioni (da session.json o sessions.json o qualsiasi .json)
 * e associa automaticamente i file audio salvandoli in IndexedDB.
 */
export async function importTalkZipFile(
  file: File
): Promise<{ sessions: TalkSessionRecord[]; audioCount: number }> {
  const zip = await JSZip.loadAsync(file);

  // 1. Cerca il file JSON delle sessioni
  let jsonFile: JSZip.JSZipObject | null =
    zip.file("session.json") ||
    zip.file("sessions.json") ||
    null;

  if (!jsonFile) {
    // Cerca il primo file che termina con .json
    for (const [path, entry] of Object.entries(zip.files)) {
      if (!entry.dir && path.toLowerCase().endsWith(".json")) {
        jsonFile = entry;
        break;
      }
    }
  }

  if (!jsonFile) {
    throw new Error(
      "Nessun file JSON di sessione trovato nell'archivio ZIP (es. session.json o sessions.json)."
    );
  }

  const jsonText = await jsonFile.async("text");
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Il file JSON contenuto nell'archivio ZIP non è valido.");
  }

  let sessionArray: TalkSessionRecord[] = [];
  if (Array.isArray(parsed)) {
    sessionArray = parsed;
  } else if (parsed && typeof parsed === "object" && "id" in parsed && "slides" in parsed) {
    sessionArray = [parsed as TalkSessionRecord];
  } else if (
    parsed &&
    typeof parsed === "object" &&
    "sessions" in parsed &&
    Array.isArray((parsed as { sessions: unknown[] }).sessions)
  ) {
    sessionArray = (parsed as { sessions: TalkSessionRecord[] }).sessions;
  } else {
    throw new Error("Formato JSON non riconosciuto come sessione talk valida.");
  }

  const validSessions = sessionArray.filter(
    (s) => s && typeof s.id === "string" && Array.isArray(s.slides)
  );

  if (validSessions.length === 0) {
    throw new Error("Nessuna sessione talk valida trovata nel JSON dell'archivio ZIP.");
  }

  let audioCount = 0;
  const processedSessions: TalkSessionRecord[] = [];

  for (const session of validSessions) {
    let matchedAudioEntry: JSZip.JSZipObject | null = null;

    // Strategia 1: Percorso esplicito audioFile
    if (session.audioFile) {
      const cleanPath = session.audioFile.replace(/^\.?\//, "");
      matchedAudioEntry = zip.file(cleanPath) || zip.file(session.audioFile) || null;
      if (!matchedAudioEntry) {
        const base = cleanPath.split("/").pop();
        if (base) {
          matchedAudioEntry = zip.file(base) || null;
        }
      }
    }

    // Strategia 2: Corrispondenza per session.id nel nome o percorso del file
    if (!matchedAudioEntry) {
      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const lower = path.toLowerCase();
        const isAudio = SUPPORTED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
        if (isAudio && (path.includes(session.id) || lower.includes(session.id.toLowerCase()))) {
          matchedAudioEntry = entry;
          break;
        }
      }
    }

    // Strategia 3: Se è un singolo talk e c'è esattamente un file audio nel zip
    if (!matchedAudioEntry && validSessions.length === 1) {
      const allAudioEntries = Object.values(zip.files).filter((entry) => {
        if (entry.dir) return false;
        const lower = entry.name.toLowerCase();
        return SUPPORTED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
      });
      if (allAudioEntries.length === 1 && allAudioEntries[0]) {
        matchedAudioEntry = allAudioEntries[0];
      }
    }

    let updatedSession = { ...session };

    if (matchedAudioEntry) {
      try {
        const audioBlob = await matchedAudioEntry.async("blob");
        const inferredMime = inferAudioMimeType(
          matchedAudioEntry.name,
          session.audioMimeType || audioBlob.type
        );
        let durationSec = session.audioDurationSeconds;
        if (!durationSec || durationSec <= 0) {
          durationSec = await detectAudioDuration(audioBlob);
        }
        if (!durationSec || durationSec <= 0) {
          durationSec =
            session.totalDurationSeconds > 0
              ? session.totalDurationSeconds
              : undefined;
        }

        await saveAudioRecording({
          sessionId: session.id,
          blob: audioBlob,
          mimeType: inferredMime,
          durationSeconds: durationSec,
          createdAt: Date.now(),
        });

        updatedSession = {
          ...updatedSession,
          hasAudio: true,
          audioMimeType: inferredMime,
          audioDurationSeconds: durationSec,
        };
        audioCount++;
      } catch (err) {
        console.warn(`Impossibile importare audio per sessione ${session.id}:`, err);
      }
    }

    processedSessions.push(updatedSession);
  }

  return { sessions: processedSessions, audioCount };
}
