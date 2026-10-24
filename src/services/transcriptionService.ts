import type { TranscriptionChunk, StoredTranscription } from "../types";
import { saveTranscription } from "../utils/transcriptionStorage";

export interface ProgressCallback {
  (progress: { status: string; progress?: number; file?: string; message?: string }): void;
}

export interface LiveTranscriptionListener {
  (chunk: TranscriptionChunk, allChunks: TranscriptionChunk[]): void;
}

/**
 * Resamples a mono or multi-channel Float32Array to 16,000 Hz mono PCM.
 */
export function resampleTo16kHz(
  inputData: Float32Array,
  inputSampleRate: number
): Float32Array {
  if (inputSampleRate === 16000) {
    return inputData;
  }

  const ratio = inputSampleRate / 16000;
  const newLength = Math.max(1, Math.round(inputData.length / ratio));
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const originalPos = i * ratio;
    const leftIndex = Math.floor(originalPos);
    const rightIndex = Math.min(inputData.length - 1, Math.ceil(originalPos));
    const factor = originalPos - leftIndex;
    const left = inputData[leftIndex] ?? 0;
    const right = inputData[rightIndex] ?? left;
    result[i] = left * (1 - factor) + right * factor;
  }

  return result;
}

/**
 * Decodes an Audio Blob into a 16kHz mono Float32Array.
 */
export async function decodeAudioBlobTo16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  const audioCtx = new AudioContextClass();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    return resampleTo16kHz(channelData, audioBuffer.sampleRate);
  } finally {
    audioCtx.close().catch(() => {});
  }
}

class TranscriptionWorkerManager {
  private worker: Worker | null = null;
  private isInitializing = false;
  private isReady = false;
  private pendingRequests = new Map<
    string,
    {
      resolve: (val: { text: string; chunks: TranscriptionChunk[] }) => void;
      reject: (err: Error) => void;
    }
  >();
  private progressListeners = new Set<ProgressCallback>();

  public getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL("../workers/transcription.worker.ts", import.meta.url),
        { type: "module" }
      );

      this.worker.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data !== "object") return;

        if (data.type === "status") {
          this.notifyProgress({
            status: data.status,
            message: data.message,
          });
        } else if (data.type === "progress") {
          const raw = data.progress;
          const pct =
            typeof raw?.progress === "number"
              ? Math.round(raw.progress)
              : typeof raw?.loaded === "number" && typeof raw?.total === "number"
              ? Math.round((raw.loaded / raw.total) * 100)
              : undefined;

          this.notifyProgress({
            status: raw?.status || "downloading",
            progress: pct,
            file: raw?.file,
          });
        } else if (data.type === "ready") {
          this.isReady = true;
          this.isInitializing = false;
          this.notifyProgress({ status: "ready", message: "Modello pronto", progress: 100 });
        } else if (data.type === "transcribed") {
          const pending = this.pendingRequests.get(data.id);
          if (pending) {
            this.pendingRequests.delete(data.id);
            pending.resolve({
              text: data.text || "",
              chunks: data.chunks || [],
            });
          }
        } else if (data.type === "error") {
          if (data.id && this.pendingRequests.has(data.id)) {
            const pending = this.pendingRequests.get(data.id)!;
            this.pendingRequests.delete(data.id);
            pending.reject(new Error(data.error || "Errore sconosciuto di trascrizione"));
          } else {
            console.error("Errore Transcription Worker:", data.error);
            this.isInitializing = false;
            this.notifyProgress({ status: "error", message: data.error });
          }
        }
      };

      this.worker.onerror = (e) => {
        console.error("Worker error:", e);
      };
    }
    return this.worker;
  }

  public addProgressListener(cb: ProgressCallback): () => void {
    this.progressListeners.add(cb);
    return () => this.progressListeners.delete(cb);
  }

  private notifyProgress(info: { status: string; progress?: number; file?: string; message?: string }) {
    for (const listener of this.progressListeners) {
      try {
        listener(info);
      } catch (e) {
        console.warn("Error in progress listener:", e);
      }
    }
  }

  public async preloadModel(onProgress?: ProgressCallback): Promise<void> {
    if (this.isReady) {
      if (onProgress) onProgress({ status: "ready", progress: 100, message: "Modello già caricato" });
      return;
    }

    let unsubscribe: (() => void) | null = null;
    if (onProgress) {
      unsubscribe = this.addProgressListener(onProgress);
    }

    try {
      const worker = this.getWorker();
      this.isInitializing = true;
      worker.postMessage({ type: "init" });

      await new Promise<void>((resolve, reject) => {
        const checkReady = (info: { status: string; message?: string }) => {
          if (info.status === "ready") {
            resolve();
          } else if (info.status === "error") {
            reject(new Error(info.message || "Errore inizializzazione modello"));
          }
        };
        const remove = this.addProgressListener(checkReady);
        if (this.isReady) {
          remove();
          resolve();
        }
      });
    } finally {
      if (unsubscribe) unsubscribe();
    }
  }

  public isModelReady(): boolean {
    return this.isReady;
  }

  public isModelInitializing(): boolean {
    return this.isInitializing;
  }

  public async transcribe(
    audio: Float32Array,
    language: "it" | "en" = "it",
    timeOffsetSeconds = 0
  ): Promise<{ text: string; chunks: TranscriptionChunk[] }> {
    const worker = this.getWorker();
    const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      worker.postMessage(
        {
          type: "transcribe",
          id,
          audio,
          language,
          timeOffsetSeconds,
        },
        [audio.buffer]
      );
    });
  }

  public destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
    this.isInitializing = false;
    this.pendingRequests.clear();
  }
}

export const transcriptionManager = new TranscriptionWorkerManager();

/**
 * Live audio stream processor that captures incoming mic stream,
 * chunks it, and dispatches to the transcription worker in real-time.
 */
export class LiveAudioStreamTranscriber {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private totalSampleCount = 0;
  private stream: MediaStream;
  private sessionId: string;
  private language: "it" | "en";
  private isProcessing = false;
  private transcribedChunks: TranscriptionChunk[] = [];
  private chunkDurationSeconds = 8; // Slice speech every 8 seconds for real-time transcription
  private samplesPerChunk: number;
  private currentChunkStartIndex = 0;
  private liveListeners = new Set<LiveTranscriptionListener>();
  private activeQueue: Promise<void> = Promise.resolve();

  constructor(stream: MediaStream, sessionId: string, language: "it" | "en" = "it") {
    this.stream = stream;
    this.sessionId = sessionId;
    this.language = language;
    this.samplesPerChunk = 16000 * this.chunkDurationSeconds;
  }

  public addLiveListener(listener: LiveTranscriptionListener): () => void {
    this.liveListeners.add(listener);
    return () => this.liveListeners.delete(listener);
  }

  public start(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    this.audioCtx = new AudioContextClass();
    this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);

    // Buffer size 4096 gives ~85ms latency per callback
    this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);

    const inputRate = this.audioCtx.sampleRate;

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isProcessing) return;
      const input = e.inputBuffer.getChannelData(0);
      const resampled = resampleTo16kHz(input, inputRate);
      this.pcmChunks.push(new Float32Array(resampled));
      this.totalSampleCount += resampled.length;

      // Check if we accumulated enough samples for a chunk
      if (this.totalSampleCount - this.currentChunkStartIndex >= this.samplesPerChunk) {
        this.dispatchPendingChunk();
      }
    };

    this.sourceNode.connect(this.processorNode);
    // Connect to destination via silent gain to keep scriptProcessor ticking in all browsers
    const silentGain = this.audioCtx.createGain();
    silentGain.gain.value = 0;
    this.processorNode.connect(silentGain);
    silentGain.connect(this.audioCtx.destination);
  }

  private dispatchPendingChunk(): void {
    const startSample = this.currentChunkStartIndex;
    const endSample = this.totalSampleCount;
    this.currentChunkStartIndex = endSample;

    const sliceLength = endSample - startSample;
    if (sliceLength < 16000) return; // Ignore slices < 1s

    // Flatten collected chunks corresponding to this window
    const sliceBuffer = new Float32Array(sliceLength);
    let offset = 0;
    let accumulated = 0;

    for (const chunk of this.pcmChunks) {
      const chunkEnd = accumulated + chunk.length;
      if (chunkEnd > startSample && accumulated < endSample) {
        const fromInChunk = Math.max(0, startSample - accumulated);
        const toInChunk = Math.min(chunk.length, endSample - accumulated);
        const toCopy = chunk.subarray(fromInChunk, toInChunk);
        sliceBuffer.set(toCopy, offset);
        offset += toCopy.length;
      }
      accumulated = chunkEnd;
      if (offset >= sliceLength) break;
    }

    const timeOffsetSec = startSample / 16000;

    // Enqueue transcription asynchronously
    this.activeQueue = this.activeQueue.then(async () => {
      try {
        const res = await transcriptionManager.transcribe(
          sliceBuffer,
          this.language,
          timeOffsetSec
        );

        if (res.chunks && res.chunks.length > 0) {
          for (const chk of res.chunks) {
            this.transcribedChunks.push(chk);
            for (const l of this.liveListeners) {
              try {
                l(chk, this.transcribedChunks);
              } catch (err) {
                console.warn("Live transcription listener error:", err);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Errore trascrizione chunk live:", err);
      }
    });
  }

  public async stop(): Promise<StoredTranscription> {
    this.isProcessing = false;

    // Dispatch any remaining samples
    if (this.totalSampleCount > this.currentChunkStartIndex) {
      this.dispatchPendingChunk();
    }

    // Wait for worker queue to complete
    await this.activeQueue;

    // Cleanup Web Audio
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    const fullText = this.transcribedChunks
      .map((c) => c.text)
      .join(" ")
      .trim();

    const result: StoredTranscription = {
      sessionId: this.sessionId,
      text: fullText,
      chunks: this.transcribedChunks,
      language: this.language,
      model: "Xenova/whisper-base",
      createdAt: Date.now(),
      durationSeconds: Math.round(this.totalSampleCount / 16000),
    };

    // Save to Cache Storage and IndexedDB
    await saveTranscription(result);

    return result;
  }
}
