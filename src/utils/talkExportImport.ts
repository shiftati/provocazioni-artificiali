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
import {
  getTranscription,
  saveTranscription,
  type StoredTranscription,
} from "./transcriptionStorage";

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
 * Se è presente una registrazione audio o una trascrizione in IndexedDB, genera un file .zip contenente:
 * - session.json (con metadati e riferimenti)
 * - audio_<nome>.<ext> (se presente)
 * - transcription.json e transcription.txt (se presente)
 * Se non c'è né audio né trascrizione, esporta direttamente il file .json.
 */
export async function exportSingleSessionWithAudio(
  session: TalkSessionRecord
): Promise<{ type: "zip" | "json"; filename: string; hasAudio: boolean }> {
  const cleanName = session.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const dateStr = new Date(session.startedAt || session.createdAt || Date.now())
    .toISOString()
    .slice(0, 10);

  // Verifica presenza traccia audio e trascrizione in IndexedDB
  const recording = await getAudioRecording(session.id, session.totalDurationSeconds);
  const transcription = await getTranscription(session.id);

  if ((recording && recording.blob && recording.blob.size > 0) || transcription) {
    const zip = new JSZip();
    let audioFilename: string | undefined;

    if (recording && recording.blob && recording.blob.size > 0) {
      const mime = recording.mimeType || recording.blob.type || "audio/webm";
      const ext = getAudioFileExtension(mime);
      audioFilename = `audio_${cleanName}.${ext}`;
      zip.file(audioFilename, recording.blob);
    }

    if (transcription) {
      zip.file("transcription.json", JSON.stringify(transcription, null, 2));

      const txtLines = [
        `--- Trascrizione Talk: ${session.name} (${(transcription.language || "it").toUpperCase()}) ---`,
        `Modello: ${transcription.model}`,
        `Data: ${new Date(transcription.createdAt).toLocaleString()}`,
        `-----------------------------------------------------\n`,
      ];
      if (transcription.chunks && transcription.chunks.length > 0) {
        for (const chunk of transcription.chunks) {
          const m = Math.floor(chunk.timestamp[0] / 60);
          const s = Math.floor(chunk.timestamp[0] % 60);
          const start = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
          txtLines.push(`[${start}] ${chunk.text.trim()}`);
        }
      } else {
        txtLines.push(transcription.text);
      }
      zip.file("transcription.txt", txtLines.join("\n"));
    }

    const sessionExportRef: TalkSessionRecord = {
      ...session,
      hasAudio: Boolean(recording && recording.blob && recording.blob.size > 0),
      ...(audioFilename
        ? {
            audioMimeType: recording?.mimeType || recording?.blob.type || "audio/webm",
            audioDurationSeconds:
              recording?.durationSeconds ||
              session.audioDurationSeconds ||
              session.totalDurationSeconds,
            audioFile: audioFilename,
          }
        : {}),
      hasTranscription: Boolean(transcription),
      transcriptionLanguage: transcription?.language || session.transcriptionLanguage,
    };

    zip.file("session.json", JSON.stringify(sessionExportRef, null, 2));

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const filename = `talk_session_${cleanName}_${dateStr}.zip`;
    triggerDownload(zipBlob, filename);

    return { type: "zip", filename, hasAudio: Boolean(recording) };
  } else {
    // Nessun audio né trascrizione: esporta come .json
    const filename = `talk_session_${cleanName}_${dateStr}.json`;
    const jsonStr = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    triggerDownload(blob, filename);

    return { type: "json", filename, hasAudio: false };
  }
}

/**
 * Esporta tutte le sessioni.
 * Se almeno un talk ha una registrazione audio o trascrizione, genera un archivio .zip contenente:
 * - sessions.json
 * - cartella audio/ con i file audio (nominati <sessionId>.<ext>)
 * - cartella transcriptions/ con le trascrizioni JSON (nominate <sessionId>.json)
 * Se nessun talk ha audio o trascrizioni, esporta direttamente il file .json.
 */
export async function exportAllSessionsWithAudio(
  sessions: TalkSessionRecord[]
): Promise<{ type: "zip" | "json"; filename: string; audioCount: number }> {
  const dateStr = new Date().toISOString().slice(0, 10);

  // Recupera audio e trascrizioni per ciascuna sessione
  const recordingsMap = new Map<string, StoredAudioRecording>();
  const transcriptionsMap = new Map<string, StoredTranscription>();

  for (const session of sessions) {
    const rec = await getAudioRecording(session.id, session.totalDurationSeconds);
    if (rec && rec.blob && rec.blob.size > 0) {
      recordingsMap.set(session.id, rec);
    }
    const tx = await getTranscription(session.id);
    if (tx) {
      transcriptionsMap.set(session.id, tx);
    }
  }

  if (recordingsMap.size > 0 || transcriptionsMap.size > 0) {
    const zip = new JSZip();
    const audioFolder = recordingsMap.size > 0 ? zip.folder("audio") : null;
    const txFolder = transcriptionsMap.size > 0 ? zip.folder("transcriptions") : null;

    const sessionsWithAudioRef = sessions.map((session) => {
      const rec = recordingsMap.get(session.id);
      const tx = transcriptionsMap.get(session.id);

      if (tx) {
        txFolder?.file(`${session.id}.json`, JSON.stringify(tx, null, 2));
      }

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
          hasTranscription: Boolean(tx),
          transcriptionLanguage: tx?.language || session.transcriptionLanguage,
        };
      }

      return {
        ...session,
        hasTranscription: Boolean(tx),
        transcriptionLanguage: tx?.language || session.transcriptionLanguage,
      };
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
    // Nessun talk ha audio né trascrizione: esporta .json
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

    // Trascrizione audio associata
    const matchedTxEntry: JSZip.JSZipObject | null =
      zip.file(`transcriptions/${session.id}.json`) ||
      zip.file(`transcription_${session.id}.json`) ||
      zip.file(`${session.id}_transcription.json`) ||
      (validSessions.length === 1 ? zip.file("transcription.json") : null);

    if (matchedTxEntry) {
      try {
        const txText = await matchedTxEntry.async("text");
        const parsedTx = JSON.parse(txText) as StoredTranscription;
        if (parsedTx && typeof parsedTx === "object" && (parsedTx.text || parsedTx.chunks)) {
          parsedTx.sessionId = session.id;
          await saveTranscription(parsedTx);
          updatedSession = {
            ...updatedSession,
            hasTranscription: true,
            transcriptionLanguage: parsedTx.language || "it",
          };
        }
      } catch (err) {
        console.warn(`Impossibile importare trascrizione per ${session.id}:`, err);
      }
    }

    processedSessions.push(updatedSession);
  }

  return { sessions: processedSessions, audioCount };
}
