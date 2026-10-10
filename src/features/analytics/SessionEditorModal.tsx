import { useState, useEffect, type FC } from "react";
import type { TalkSessionRecord } from "../../types";
import { SLIDES } from "../presentation/slides.registry";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { CheckIcon } from "../../components/icons";
import styles from "./AnalyticsView.module.scss";

interface SessionEditorModalProps {
  session: TalkSessionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TalkSessionRecord) => void;
}

export const SessionEditorModal: FC<SessionEditorModalProps> = ({
  session,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [introEndSlide, setIntroEndSlide] = useState<number>(11);

  useEffect(() => {
    if (session) {
      setName(session.name || "");
      setNotes(session.notes || "");
      setIntroEndSlide(session.introEndSlide ?? 11);
    }
  }, [session]);

  if (!session) return null;

  const handleSave = () => {
    onSave({
      ...session,
      name: name.trim() || session.name,
      notes: notes.trim(),
      introEndSlide,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Modifica dettagli sessione talk"
    >
      <h2 className={styles.modalTitle}>Modifica Sessione Talk</h2>
      <p className={styles.modalSubtitle}>
        Personalizza il titolo della sessione o aggiungi note e considerazioni post-talk.
      </p>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="session-name-input">
          Titolo / Nome Sessione
        </label>
        <input
          id="session-name-input"
          className={styles.formInput}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Es: Codemotion 2026 - Main Stage"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="session-intro-end-input">
          Slide di fine intro (Game Trigger)
        </label>
        <select
          id="session-intro-end-input"
          className={styles.formInput}
          value={introEndSlide}
          onChange={(e) => setIntroEndSlide(parseInt(e.target.value, 10) || 11)}
        >
          {SLIDES.map((s, idx) => (
            <option key={s.id} value={idx + 1}>
              #{idx + 1}: {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="session-notes-input">
          Note e Impressioni
        </label>
        <textarea
          id="session-notes-input"
          className={styles.formTextarea}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Es: Pubblico molto reattivo durante la provocazione sui microservizi..."
        />
      </div>

      <div className={styles.modalActions}>
        <Button variant="ghost" size="md" onClick={onClose}>
          Annulla
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          leftIcon={<CheckIcon size={18} />}
        >
          Salva Modifiche
        </Button>
      </div>
    </Modal>
  );
};
