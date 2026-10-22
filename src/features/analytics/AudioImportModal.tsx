import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
  type FC,
} from "react";
import JSZip from "jszip";
import type { TalkSessionRecord } from "../../types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import {
  MicIcon,
  UploadIcon,
  CloseIcon,
  CheckIcon,
} from "../../components/icons";
import { formatDateTime, formatDurationSeconds } from "../../utils/time";
import { detectAudioDuration, inferAudioMimeType } from "../../utils/audioStorage";
import { isZipFile } from "../../utils/talkExportImport";
import styles from "./AudioImportModal.module.scss";

interface AudioImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: TalkSessionRecord[];
  initialSessionId: string;
  onImportAudio: (
    sessionId: string,
    file: File,
    durationSeconds?: number
  ) => Promise<void>;
}

const SUPPORTED_EXTENSIONS = [".webm", ".mp3", ".wav", ".m4a", ".mp4", ".ogg", ".aac"];

function isAudioOrZipFile(file: File): boolean {
  if (isZipFile(file)) return true;
  if (file.type && file.type.startsWith("audio/")) return true;
  const name = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export const AudioImportModal: FC<AudioImportModalProps> = ({
  isOpen,
  onClose,
  sessions,
  initialSessionId,
  onImportAudio,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number | undefined>(undefined);
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial session selection when modal opens
  useEffect(() => {
    if (isOpen) {
      const fallbackId = sessions[0]?.id ?? "";
      const validInitial = sessions.some((s) => s.id === initialSessionId)
        ? initialSessionId
        : fallbackId;
      setSelectedSessionId(validInitial);
      setSelectedFile(null);
      setPreviewUrl(null);
      setDetectedDuration(undefined);
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialSessionId, sessions]);

  // Clean up object URL on unmount or file reset
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const targetSession = sessions.find((s) => s.id === selectedSessionId);

  const handleProcessFile = async (rawFile: File) => {
    setErrorMessage(null);

    if (!isAudioOrZipFile(rawFile)) {
      setErrorMessage(
        "Il file selezionato non sembra un formato audio supportato (.webm, .mp3, .wav, .m4a, .ogg) o un archivio ZIP."
      );
      return;
    }

    let fileToUse = rawFile;

    // Se l'utente ha selezionato un file ZIP, estraiamo la traccia audio corrispondente
    if (isZipFile(rawFile)) {
      setIsDetectingDuration(true);
      try {
        const zip = await JSZip.loadAsync(rawFile);
        let matchedEntry: JSZip.JSZipObject | null = null;

        // Cerca file audio che corrisponde alla sessione selezionata
        if (selectedSessionId) {
          for (const [path, entry] of Object.entries(zip.files)) {
            if (entry.dir) continue;
            const lower = path.toLowerCase();
            const isAudio = SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
            if (isAudio && (path.includes(selectedSessionId) || lower.includes(selectedSessionId.toLowerCase()))) {
              matchedEntry = entry;
              break;
            }
          }
        }

        // Se non trovato per ID, prendi il primo file audio presente nel zip
        if (!matchedEntry) {
          for (const [path, entry] of Object.entries(zip.files)) {
            if (entry.dir) continue;
            const lower = path.toLowerCase();
            if (SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
              matchedEntry = entry;
              break;
            }
          }
        }

        if (!matchedEntry) {
          setErrorMessage("Nessun file audio trovato all'interno dell'archivio ZIP caricato.");
          setIsDetectingDuration(false);
          return;
        }

        const blob = await matchedEntry.async("blob");
        const cleanName = matchedEntry.name.split("/").pop() || "audio.webm";
        const inferredMime = inferAudioMimeType(cleanName, blob.type);
        fileToUse = new File([blob], cleanName, { type: inferredMime });
      } catch {
        setErrorMessage("Impossibile estrarre la traccia audio dall'archivio ZIP.");
        setIsDetectingDuration(false);
        return;
      }
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newUrl = URL.createObjectURL(fileToUse);
    setSelectedFile(fileToUse);
    setPreviewUrl(newUrl);
    setIsDetectingDuration(true);

    try {
      const dur = await detectAudioDuration(fileToUse);
      setDetectedDuration(dur);
    } catch {
      setDetectedDuration(undefined);
    } finally {
      setIsDetectingDuration(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Reset input so the same file can be re-selected if removed
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectedDuration(undefined);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!selectedSessionId) {
      setErrorMessage("Seleziona una sessione a cui associare il file audio.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Seleziona o trascina un file audio da importare.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const effectiveDuration =
        detectedDuration ??
        (targetSession && targetSession.totalDurationSeconds > 0
          ? targetSession.totalDurationSeconds
          : undefined);

      await onImportAudio(selectedSessionId, selectedFile, effectiveDuration);
      handleClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Errore durante il salvataggio della traccia audio in IndexedDB."
      );
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectedDuration(undefined);
    setErrorMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel="Importa file audio e associalo al talk"
    >
      <h2 className={styles.modalTitle}>
        <MicIcon size={26} style={{ color: "var(--color-mint)" }} />
        Importa Registrazione Audio
      </h2>
      <p className={styles.modalSubtitle}>
        Carica un file audio registrato (.webm, .mp3, .wav, .m4a, .ogg) oppure un archivio .zip
        esportato e associalo alla sessione talk selezionata.
      </p>

      {errorMessage && <div className={styles.errorAlert}>{errorMessage}</div>}

      {/* Target Session Selection */}
      <div className={styles.formGroup}>
        <label htmlFor="target-session-select" className={styles.formLabel}>
          Associa alla sessione talk:
        </label>
        <select
          id="target-session-select"
          className={styles.sessionSelect}
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          disabled={isSubmitting}
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.hasAudio ? "🎙️ " : ""}
              {s.name} ({formatDateTime(s.startedAt)})
              {s.hasAudio ? " [Audio già presente]" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Warning if selected session already has audio */}
      {targetSession?.hasAudio && (
        <div className={styles.overwriteWarning}>
          <span>⚠️</span>
          <div>
            <strong>Attenzione:</strong> La sessione selezionata ha già una traccia
            audio registrata. Importando questo file, l&apos;audio esistente verrà
            sostituito con quello nuovo.
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.webm,.mp3,.wav,.m4a,.mp4,.ogg,.aac,.zip,application/zip"
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      {/* File Dropzone or Preview */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>File Audio / Archivio ZIP:</label>

        {!selectedFile ? (
          <div
            className={`${styles.dropzone} ${
              isDragging ? styles.dropzoneActive : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click();
              }
            }}
          >
            <div className={styles.dropzoneIcon}>
              <UploadIcon size={36} />
            </div>
            <p className={styles.dropzonePrompt}>
              Trascina qui il file audio o archivio ZIP, o clicca per sfogliare
            </p>
            <span className={styles.dropzoneSub}>
              Supporta formati WebM, MP3, WAV, M4A, OGG, AAC e archivi ZIP
            </span>
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              leftIcon={<UploadIcon size={16} />}
            >
              Scegli file dal computer
            </Button>
          </div>
        ) : (
          <div className={styles.filePreviewCard}>
            <div className={styles.filePreviewHeader}>
              <div className={styles.filePreviewInfo}>
                <MicIcon size={24} style={{ color: "var(--color-mint)" }} />
                <div>
                  <div className={styles.fileName} title={selectedFile.name}>
                    {selectedFile.name}
                  </div>
                  <div className={styles.fileMetaRow}>
                    <span className={styles.fileBadge}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <span className={styles.fileBadge}>
                      {inferAudioMimeType(selectedFile.name, selectedFile.type)}
                    </span>
                    {isDetectingDuration ? (
                      <span className={styles.durationBadge}>
                        Rilevamento durata...
                      </span>
                    ) : detectedDuration && detectedDuration > 0 ? (
                      <span className={styles.durationBadge}>
                        Durata: {formatDurationSeconds(detectedDuration)}
                      </span>
                    ) : targetSession && targetSession.totalDurationSeconds > 0 ? (
                      <span className={styles.durationBadge}>
                        Durata sessione: {formatDurationSeconds(targetSession.totalDurationSeconds)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="md"
                onClick={handleRemoveFile}
                leftIcon={<CloseIcon size={16} />}
                title="Rimuovi file selezionato"
                disabled={isSubmitting}
              >
                Rimuovi
              </Button>
            </div>

            {/* Audio Preview Element */}
            {previewUrl && (
              <audio
                controls
                src={previewUrl}
                className={styles.previewAudioPlayer}
              />
            )}
          </div>
        )}
      </div>

      {/* Modal Actions */}
      <div className={styles.modalActions}>
        <Button
          variant="ghost"
          size="md"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Annulla
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={!selectedFile || !selectedSessionId || isSubmitting}
          leftIcon={
            isSubmitting ? undefined : <CheckIcon size={18} />
          }
        >
          {isSubmitting ? "Importazione in corso..." : "Importa e Associa Audio"}
        </Button>
      </div>
    </Modal>
  );
};
