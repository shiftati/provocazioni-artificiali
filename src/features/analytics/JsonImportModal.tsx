import { useState, useRef, type ChangeEvent, type FC } from "react";
import type { TalkSessionRecord } from "../../types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { UploadIcon } from "../../components/icons";
import styles from "./AnalyticsView.module.scss";

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sessions: TalkSessionRecord[]) => void;
}

export const JsonImportModal: FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonText, setJsonText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonText(content);
      } catch {
        setErrorMsg("Impossibile leggere il file selezionato.");
      }
    };
    reader.onerror = () => setErrorMsg("Errore durante la lettura del file.");
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    setErrorMsg(null);
    if (!jsonText.trim()) {
      setErrorMsg("Inserisci o carica un file JSON valido prima di importare.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      let sessionArray: TalkSessionRecord[] = [];

      if (Array.isArray(parsed)) {
        sessionArray = parsed;
      } else if (parsed && typeof parsed === "object" && "id" in parsed && "slides" in parsed) {
        sessionArray = [parsed as TalkSessionRecord];
      } else if (parsed && typeof parsed === "object" && "sessions" in parsed && Array.isArray(parsed.sessions)) {
        sessionArray = parsed.sessions;
      } else {
        throw new Error("Formato JSON non riconosciuto come sessione talk valida.");
      }

      // Basic sanity check
      const validSessions = sessionArray.filter(
        (s) => s && typeof s.id === "string" && Array.isArray(s.slides)
      );

      if (validSessions.length === 0) {
        throw new Error("Nessuna sessione valida trovata nel JSON fornito.");
      }

      onImport(validSessions);
      setJsonText("");
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "JSON non valido o non conforme allo schema."
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Importa sessioni talk da JSON"
    >
      <h2 className={styles.modalTitle}>Importa Sessioni da JSON</h2>
      <p className={styles.modalSubtitle}>
        Carica un file esportato in precedenza oppure incolla direttamente il JSON delle sessioni da aggiungere allo storico.
      </p>

      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

      <div className={styles.importUploadArea}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <Button
          variant="secondary"
          size="md"
          onClick={() => fileInputRef.current?.click()}
          leftIcon={<UploadIcon size={18} />}
        >
          Carica file .json da computer
        </Button>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="json-paste-area">
          Oppure incolla il JSON qui:
        </label>
        <textarea
          id="json-paste-area"
          className={styles.formTextareaMono}
          rows={7}
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setErrorMsg(null);
          }}
          placeholder='[ { "id": "session_...", "name": "...", "slides": [...] } ]'
        />
      </div>

      <div className={styles.modalActions}>
        <Button variant="ghost" size="md" onClick={onClose}>
          Annulla
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleProcessImport}
          leftIcon={<UploadIcon size={18} />}
        >
          Importa Sessioni
        </Button>
      </div>
    </Modal>
  );
};
