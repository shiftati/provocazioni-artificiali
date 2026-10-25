import {
  pipeline,
  env,
  type AutomaticSpeechRecognitionPipeline,
} from "@huggingface/transformers";

// Configuration for in-browser client execution
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = "Xenova/whisper-base";

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

async function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      self.postMessage({ type: "status", status: "loading", message: "Inizializzazione modello Whisper..." });

      const pipe = await pipeline("automatic-speech-recognition", MODEL_ID, {
        progress_callback: (progress: unknown) => {
          self.postMessage({ type: "progress", progress });
        },
      });

      self.postMessage({ type: "status", status: "ready", message: "Modello Whisper pronto all'uso" });
      return pipe as unknown as AutomaticSpeechRecognitionPipeline;
    })();
  }
  return transcriberPromise;
}

export interface WorkerTranscribeRequest {
  type: "transcribe";
  id: string;
  audio: Float32Array;
  language: "it" | "en";
  timeOffsetSeconds?: number;
}

self.onmessage = async (event: MessageEvent) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "init") {
    try {
      await getTranscriber();
      self.postMessage({ type: "ready", model: MODEL_ID });
    } catch (err: unknown) {
      self.postMessage({
        type: "error",
        error: (err as Error)?.message || String(err),
      });
    }
    return;
  }

  if (data.type === "transcribe") {
    const { id, audio, language, timeOffsetSeconds = 0 } = data as WorkerTranscribeRequest;
    try {
      const transcriber = await getTranscriber();
      const langName = language === "en" ? "english" : "italian";

      const output = await transcriber(audio, {
        language: langName,
        task: "transcribe",
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      // Output can be a single result or array
      const rawResult = Array.isArray(output) ? output[0] : output;
      const fullText = (rawResult?.text || "").trim();

      interface RawChunk {
        text: string;
        timestamp: [number, number | null];
      }

      const rawChunks: RawChunk[] = Array.isArray(rawResult?.chunks)
        ? rawResult.chunks
        : [];

      const formattedChunks = rawChunks.map((chunk, idx) => {
        const start = (chunk.timestamp?.[0] ?? 0) + timeOffsetSeconds;
        const end =
          chunk.timestamp?.[1] !== null && chunk.timestamp?.[1] !== undefined
            ? chunk.timestamp[1] + timeOffsetSeconds
            : null;

        return {
          id: `${id}-chk-${idx}`,
          text: chunk.text.trim(),
          timestamp: [
            Math.round(start * 100) / 100,
            end !== null ? Math.round(end * 100) / 100 : null,
          ] as [number, number | null],
        };
      });

      // If no chunks were returned but there is text, create a single chunk
      if (formattedChunks.length === 0 && fullText.length > 0) {
        const estDuration = audio.length / 16000;
        formattedChunks.push({
          id: `${id}-chk-0`,
          text: fullText,
          timestamp: [
            Math.round(timeOffsetSeconds * 100) / 100,
            Math.round((timeOffsetSeconds + estDuration) * 100) / 100,
          ],
        });
      }

      self.postMessage({
        type: "transcribed",
        id,
        text: fullText,
        chunks: formattedChunks,
        language,
        model: MODEL_ID,
      });
    } catch (err: unknown) {
      self.postMessage({
        type: "error",
        id,
        error: (err as Error)?.message || String(err),
      });
    }
  }
};
