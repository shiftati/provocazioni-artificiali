import { useState, useEffect, type FC } from "react";
import type { ProvocationStat } from "../../types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { CheckIcon, TrashIcon, ClockIcon } from "../../components/icons";
import { formatDurationSeconds, formatDateTime } from "../../utils/time";
import styles from "./AnalyticsView.module.scss";

interface ProvocationEditorModalProps {
  provocation: ProvocationStat | null;
  provocationIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ProvocationStat) => void;
  onDelete?: (id: string) => void;
}

export const ProvocationEditorModal: FC<ProvocationEditorModalProps> = ({
  provocation,
  provocationIndex,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    if (provocation) {
      setTitle(provocation.provocationTitle || "");
      setSubtitle(provocation.provocationSubtitle || "");
    }
  }, [provocation]);

  if (!provocation) return null;

  const handleSave = () => {
    const trimmedTitle = title.trim();
    onSave({
      ...provocation,
      provocationTitle: trimmedTitle || "Provocazione",
      provocationSubtitle: subtitle.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && provocation.id) {
      onDelete(provocation.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`Modifica dettagli provocazione ${provocationIndex + 1}`}
    >
      <div className={styles.modalHeaderGroup}>
        <div className={styles.modalBadgeRow}>
          <span className={styles.provocationIndexBadge}>
            #{provocationIndex + 1}
          </span>
          <span className={styles.modalCategoryLabel}>Provocazione</span>
        </div>
        <h2 className={styles.modalTitle}>Modifica Provocazione</h2>
        <p className={styles.modalSubtitle}>
          Modifica o assegna un titolo alla provocazione discussa durante la sessione di gioco.
        </p>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="prov-title-input">
          Titolo Provocazione *
        </label>
        <input
          id="prov-title-input"
          className={styles.formInput}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Es: Il SaaS è morto"
          autoFocus
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="prov-subtitle-input">
          Sottotitolo / Dettagli (opzionale)
        </label>
        <textarea
          id="prov-subtitle-input"
          className={styles.formTextarea}
          rows={2}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Es: Dibattito sull'impatto degli agenti autonomi sul software aziendale"
        />
      </div>

      {/* Session Recorded Info */}
      <div className={styles.provocationModalInfoBox}>
        <div className={styles.modalInfoRow}>
          <span className={styles.infoLabel}>
            <ClockIcon size={14} /> Tempo di Accettazione:
          </span>
          <strong>{provocation.acceptanceTimeSeconds}s</strong>
        </div>
        <div className={styles.modalInfoRow}>
          <span className={styles.infoLabel}>
            <ClockIcon size={14} /> Durata Discussione:
          </span>
          <strong>{formatDurationSeconds(provocation.discussionDurationSeconds)}</strong>
        </div>
        {provocation.completedAt ? (
          <div className={styles.modalInfoRow}>
            <span className={styles.infoLabel}>Completata il:</span>
            <span>{formatDateTime(provocation.completedAt)}</span>
          </div>
        ) : null}
      </div>

      <div className={styles.modalActionsBetween}>
        {onDelete ? (
          <Button
            variant="ghost"
            size="md"
            onClick={handleDelete}
            leftIcon={<TrashIcon size={16} />}
            style={{ color: "var(--color-danger)" }}
            title="Elimina questa card di provocazione"
          >
            Elimina
          </Button>
        ) : (
          <span />
        )}

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
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
      </div>
    </Modal>
  );
};
