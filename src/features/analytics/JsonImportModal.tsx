import {
  useState,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type FC,
} from "react";
import type { TalkSessionRecord } from "../../types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { UploadIcon, CloseIcon, CheckIcon, MicIcon } from "../../components/icons";
import { isZipFile, importTalkZipFile } from "../../utils/talkExportImport";
import styles from "./JsonImportModal.module.scss";

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sessions: TalkSessionRecord[], audioCount?: number) => void;
}

export const JsonImportModal: FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [showJsonTextarea, setShowJsonTextarea] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessSelectedFile = (file: File) => {
    setErrorMsg(null);
    setSelectedFile(file);

    if (!isZipFile(file)) {
      // Per file JSON, precarica il testo
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = (event.target?.result as string) || "";
          setJsonText(content);
        } catch {
          setErrorMsg("Impossibile leggere il file JSON selezionato.");
        }
      };
      reader.onerror = () => setErrorMsg("Errore durante la lettura del file.");
      reader.readAsText(file);
    } else {
      setJsonText("");
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessSelectedFile(file);
    }
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
      handleProcessSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setJsonText("");
    setErrorMsg(null);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setJsonText("");
    setShowJsonTextarea(false);
    setIsProcessing(false);
    setErrorMsg(null);
    onClose();
  };

  const handleProcessImport = async () => {
    setErrorMsg(null);

    // 1. Caso archivio ZIP (contiene talk e audio associati)
    if (selectedFile && isZipFile(selectedFile)) {
      setIsProcessing(true);
      try {
        const { sessions, audioCount } = await importTalkZipFile(selectedFile);
        onImport(sessions, audioCount);
        handleClose();
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Errore durante l'estrazione e l'importazione del file ZIP."
        );
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // 2. Caso file o testo JSON
    if (!jsonText.trim()) {
      setErrorMsg("Seleziona un file ZIP/JSON o incolla del testo JSON valido prima di importare.");
      return;
    }

    setIsProcessing(true);
    try {
      const parsed = JSON.parse(jsonText);
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
        throw new Error("Nessuna sessione valida trovata nel JSON fornito.");
      }

      onImport(validSessions, 0);
      handleClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "JSON non valido o non conforme allo schema delle sessioni talk."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const isSelectedZip = selectedFile ? isZipFile(selectedFile) : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel="Importa sessioni talk (JSON o ZIP con audio)"
    >
      <h2 className={styles.modalTitle}>
        <UploadIcon size={26} style={{ color: "var(--color-accent)" }} />
        Importa Talk e Audio
      </h2>
      <p className={styles.modalSubtitle}>
        Carica un pacchetto <strong>.zip</strong> (esportato in precedenza con talk e audio associati),
        un file <strong>.json</strong> oppure incolla direttamente i dati delle sessioni.
      </p>

      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

      {isProcessing && (
        <div className={styles.loadingInfo}>
          <span>⏳</span> Elaborazione e salvataggio tracce audio in corso...
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.zip,application/json,application/zip,application/x-zip-compressed"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* File Dropzone or Preview */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>File Talk / Archivio ZIP:</label>

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
              Trascina qui il file ZIP o JSON, oppure clicca per sfogliare
            </p>
            <span className={styles.dropzoneSub}>
              Supporta archivi ZIP con audio integrato e file JSON di talk
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
              Scegli file dal computer (.zip, .json)
            </Button>
          </div>
        ) : (
          <div className={styles.filePreviewCard}>
            <div className={styles.filePreviewHeader}>
              <div className={styles.filePreviewInfo}>
                {isSelectedZip ? (
                  <span style={{ fontSize: "1.6rem" }}>📦</span>
                ) : (
                  <span style={{ fontSize: "1.6rem" }}>📄</span>
                )}
                <div>
                  <div className={styles.fileName} title={selectedFile.name}>
                    {selectedFile.name}
                  </div>
                  <div className={styles.fileMetaRow}>
                    <span className={styles.fileBadge}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    {isSelectedZip ? (
                      <span className={styles.zipBadge}>
                        Archivio ZIP con audio
                      </span>
                    ) : (
                      <span className={styles.fileBadge}>File JSON</span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="md"
                onClick={handleRemoveFile}
                leftIcon={<CloseIcon size={16} />}
                title="Rimuovi file selezionato"
                disabled={isProcessing}
              >
                Rimuovi
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Alternative: Paste JSON directly */}
      {!isSelectedZip && (
        <div className={styles.formGroup}>
          <div className={styles.pasteToggleRow}>
            <label className={styles.formLabel} htmlFor="json-paste-area">
              Dati JSON sessione:
            </label>
            <button
              type="button"
              className={styles.pasteToggleBtn}
              onClick={() => setShowJsonTextarea(!showJsonTextarea)}
            >
              {showJsonTextarea
                ? "Nascondi editor di testo"
                : "Mostra/Modifica testo JSON manuale"}
            </button>
          </div>

          {(showJsonTextarea || !selectedFile) && (
            <textarea
              id="json-paste-area"
              className={styles.formTextareaMono}
              rows={5}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setErrorMsg(null);
              }}
              placeholder='[ { "id": "session_...", "name": "...", "slides": [...] } ]'
              disabled={isProcessing}
            />
          )}
        </div>
      )}

      {/* Modal Actions */}
      <div className={styles.modalActions}>
        <Button
          variant="ghost"
          size="md"
          onClick={handleClose}
          disabled={isProcessing}
        >
          Annulla
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleProcessImport}
          disabled={(!selectedFile && !jsonText.trim()) || isProcessing}
          leftIcon={
            isProcessing ? undefined : isSelectedZip ? (
              <MicIcon size={18} />
            ) : (
              <CheckIcon size={18} />
            )
          }
        >
          {isProcessing
            ? "Importazione in corso..."
            : isSelectedZip
            ? "Importa Talk e Audio (.zip)"
            : "Importa Sessioni"}
        </Button>
      </div>
    </Modal>
  );
};
