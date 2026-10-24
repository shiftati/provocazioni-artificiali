import { useState, useMemo, useEffect, type FC, type ReactNode } from "react";
import type { TalkSessionRecord } from "../../types";
import type { StoredTranscription, TranscriptionChunk } from "../../utils/transcriptionStorage";
import { downloadTranscriptionFile, saveTranscription } from "../../utils/transcriptionStorage";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import {
  TranscriptIcon,
  CopyIcon,
  DownloadIcon,
  CheckIcon,
  CloseIcon,
  PlayIcon,
  EditIcon,
  TrashIcon,
} from "../../components/icons";
import { formatDurationSeconds } from "../../utils/time";
import styles from "./TranscriptionModal.module.scss";

export interface TranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TalkSessionRecord;
  transcription: StoredTranscription | null;
  onSeekAudio?: (seconds: number) => void;
  onLaunchReplay?: (seconds: number) => void;
  onUpdateTranscription?: (updated: StoredTranscription) => void;
}

export const TranscriptionModal: FC<TranscriptionModalProps> = ({
  isOpen,
  onClose,
  session,
  transcription,
  onSeekAudio,
  onLaunchReplay,
  onUpdateTranscription,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTab, setEditTab] = useState<"chunks" | "text">("chunks");
  const [editedChunks, setEditedChunks] = useState<TranscriptionChunk[]>([]);
  const [editedFullText, setEditedFullText] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transcription) {
      setEditedChunks(
        transcription.chunks
          ? transcription.chunks.map((c) => ({
              id: c.id,
              text: c.text,
              timestamp: [c.timestamp[0], c.timestamp[1]],
            }))
          : []
      );
      setEditedFullText(transcription.text || "");
    }
    setIsEditing(false);
  }, [transcription, isOpen]);

  const cleanName = session.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const filename = `trascrizione_${cleanName}`;

  // Filter chunks by search query
  const filteredChunks = useMemo(() => {
    if (!transcription?.chunks) return [];
    if (!searchQuery.trim()) return transcription.chunks;
    const q = searchQuery.toLowerCase().trim();
    return transcription.chunks.filter((chunk) =>
      chunk.text.toLowerCase().includes(q)
    );
  }, [transcription, searchQuery]);

  const wordCount = useMemo(() => {
    const textToCount = isEditing ? editedFullText : transcription?.text;
    if (!textToCount) return 0;
    return textToCount.trim().split(/\s+/).filter(Boolean).length;
  }, [isEditing, editedFullText, transcription?.text]);

  const handleCopyText = async () => {
    const textToCopy = isEditing ? editedFullText : transcription?.text;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    } catch (err) {
      console.warn("Failed to copy transcript to clipboard:", err);
    }
  };

  const handleDownloadTxt = () => {
    if (!transcription) return;
    downloadTranscriptionFile(transcription, filename, "txt");
  };

  const handleDownloadJson = () => {
    if (!transcription) return;
    downloadTranscriptionFile(transcription, filename, "json");
  };

  // Editing Handlers
  const handleStartEditing = () => {
    if (!transcription) return;
    setEditedChunks(
      transcription.chunks
        ? transcription.chunks.map((c) => ({
            id: c.id,
            text: c.text,
            timestamp: [c.timestamp[0], c.timestamp[1]],
          }))
        : []
    );
    setEditedFullText(transcription.text || "");
    setIsEditing(true);
  };

  const handleChunkTextChange = (index: number, newText: string) => {
    setEditedChunks((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], text: newText };
      }
      return next;
    });
    // Keep full text in sync
    setEditedFullText(() => {
      const updatedList = [...editedChunks];
      if (updatedList[index]) {
        updatedList[index] = { ...updatedList[index], text: newText };
      }
      return updatedList.map((c) => c.text.trim()).filter(Boolean).join(" ");
    });
  };

  const handleChunkTimeChange = (index: number, startSec: number) => {
    setEditedChunks((prev) => {
      const next = [...prev];
      if (next[index]) {
        const oldEnd = next[index].timestamp[1];
        next[index] = {
          ...next[index],
          timestamp: [startSec, oldEnd !== null ? Math.max(startSec, oldEnd) : null],
        };
      }
      return next;
    });
  };

  const handleDeleteChunk = (index: number) => {
    setEditedChunks((prev) => prev.filter((_, i) => i !== index));
    setEditedFullText(() => {
      const remaining = editedChunks.filter((_, i) => i !== index);
      return remaining.map((c) => c.text.trim()).filter(Boolean).join(" ");
    });
  };

  const handleAddChunk = () => {
    const lastChunk = editedChunks[editedChunks.length - 1];
    const newStart = lastChunk
      ? (lastChunk.timestamp[1] ?? lastChunk.timestamp[0] + 5)
      : 0;

    const newChunk: TranscriptionChunk = {
      id: `chk_manual_${Date.now()}`,
      text: "",
      timestamp: [newStart, newStart + 5],
    };

    setEditedChunks((prev) => [...prev, newChunk]);
  };

  const handleSaveEdits = async () => {
    if (!transcription) return;
    setIsSaving(true);

    try {
      let finalText = editedFullText.trim();
      let finalChunks = editedChunks;

      if (editTab === "text") {
        // If edited in full text mode, keep user's raw text
        finalText = editedFullText.trim();
      } else {
        finalText = editedChunks
          .map((c) => c.text.trim())
          .filter(Boolean)
          .join(" ");
      }

      const updatedTx: StoredTranscription = {
        ...transcription,
        text: finalText,
        chunks: finalChunks,
      };

      await saveTranscription(updatedTx);
      onUpdateTranscription?.(updatedTx);
      setIsEditing(false);
    } catch (err) {
      console.error("Errore salvataggio modifiche trascrizione:", err);
      alert("Impossibile salvare le modifiche alla trascrizione.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdits = () => {
    if (transcription) {
      setEditedChunks(transcription.chunks || []);
      setEditedFullText(transcription.text || "");
    }
    setIsEditing(false);
  };

  const highlightText = (text: string, query: string): ReactNode => {
    if (!query.trim()) return text;
    const parts = text.split(
      new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi")
    );
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className={styles.highlightMatch}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`Trascrizione Talk: ${session.name}`}
    >
      <div className={styles.modalBody}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <h2 style={{ fontSize: "1.3rem", margin: 0, fontWeight: 700, color: "var(--color-text)" }}>
            Trascrizione Talk: {session.name}
          </h2>
          {!isEditing && transcription && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleStartEditing}
              leftIcon={<EditIcon size={16} />}
              title="Modifica il testo o correggi errori di trascrizione"
            >
              Modifica Trascrizione
            </Button>
          )}
        </div>

        {/* Header Metadata Info */}
        <div className={styles.headerInfo}>
          <div className={styles.metaGroup}>
            <span className={styles.metaBadge}>
              Lingua: {(transcription?.language || session.transcriptionLanguage || "it").toUpperCase()}
            </span>
            <span className={styles.metaBadge}>
              Modello: {transcription?.model || "Xenova/whisper-base"}
            </span>
            <span className={styles.metaBadge}>
              Parole: {wordCount}
            </span>
            <span className={styles.metaBadge}>
              Segmenti: {isEditing ? editedChunks.length : (transcription?.chunks?.length || 0)}
            </span>
            {isEditing && (
              <span className={styles.metaBadge} style={{ color: "var(--color-brand-yellow, #eab308)", fontWeight: 600 }}>
                ✎ In Modifica
              </span>
            )}
          </div>
          {hasCopied && (
            <span className={styles.copiedToast}>
              <CheckIcon size={14} /> Testo copiato negli appunti!
            </span>
          )}
        </div>

        {/* Editing Mode Tab Bar */}
        {isEditing && (
          <div className={styles.editModeHeader}>
            <span>Modifica e correggi gli errori di riconoscimento vocale:</span>
            <div className={styles.editTabs}>
              <button
                type="button"
                className={`${styles.editTabBtn} ${editTab === "chunks" ? styles.activeTab : ""}`}
                onClick={() => setEditTab("chunks")}
              >
                Per segmenti temporali
              </button>
              <button
                type="button"
                className={`${styles.editTabBtn} ${editTab === "text" ? styles.activeTab : ""}`}
                onClick={() => setEditTab("text")}
              >
                Testo unico continuo
              </button>
            </div>
          </div>
        )}

        {/* Search Input Bar (only in read mode) */}
        {!isEditing && (
          <div className={styles.searchBar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Cerca parole o argomenti nella trascrizione..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery("")}
                title="Cancella ricerca"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        )}

        {/* Chunks List (Read or Edit) */}
        <div className={styles.transcriptScrollArea}>
          {isEditing ? (
            editTab === "text" ? (
              <textarea
                className={styles.fullTextarea}
                value={editedFullText}
                onChange={(e) => setEditedFullText(e.target.value)}
                placeholder="Inserisci o correggi il testo completo del talk..."
              />
            ) : (
              <>
                {editedChunks.map((chunk, idx) => (
                  <div key={chunk.id || `edit_${idx}`} className={styles.chunkEditRow}>
                    <div className={styles.chunkEditMeta}>
                      <input
                        type="text"
                        className={styles.timestampInput}
                        value={formatDurationSeconds(chunk.timestamp[0])}
                        title="Secondo di inizio (es. 01:25 o 85s)"
                        onChange={(e) => {
                          const val = e.target.value;
                          const parts = val.split(":").map((p) => parseInt(p, 10));
                          const min = parts[0];
                          const sec = parts[1];
                          if (parts.length === 2 && typeof min === "number" && typeof sec === "number" && !isNaN(min) && !isNaN(sec)) {
                            handleChunkTimeChange(idx, min * 60 + sec);
                          } else {
                            const rawSec = parseInt(val, 10);
                            if (!isNaN(rawSec)) handleChunkTimeChange(idx, rawSec);
                          }
                        }}
                      />
                    </div>
                    <textarea
                      className={styles.chunkTextarea}
                      value={chunk.text}
                      onChange={(e) => handleChunkTextChange(idx, e.target.value)}
                      placeholder="Testo del segmento..."
                    />
                    <button
                      type="button"
                      className={styles.deleteChunkBtn}
                      onClick={() => handleDeleteChunk(idx)}
                      title="Elimina questo segmento"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                ))}

                <div className={styles.addChunkBtnRow}>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleAddChunk}
                  >
                    + Aggiungi Segmento
                  </Button>
                </div>
              </>
            )
          ) : !transcription ? (
            <div className={styles.emptySearch}>
              Nessuna trascrizione disponibile per questa sessione.
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className={styles.emptySearch}>
              Nessun segmento trovato per la ricerca "{searchQuery}".
            </div>
          ) : (
            filteredChunks.map((chunk: TranscriptionChunk, idx: number) => {
              const startSec = chunk.timestamp[0];
              const timeLabel = formatDurationSeconds(startSec);

              return (
                <div key={chunk.id || `chk_${idx}`} className={styles.chunkRow}>
                  <div className={styles.chunkActions}>
                    <button
                      type="button"
                      className={styles.timeButton}
                      onClick={() => onSeekAudio?.(startSec)}
                      title={`Salta a ${timeLabel} nell'audio`}
                    >
                      {timeLabel}
                    </button>
                    {onLaunchReplay && (
                      <button
                        type="button"
                        className={styles.replayJumpButton}
                        onClick={() => onLaunchReplay(startSec)}
                        title={`Apri Replay al secondo ${timeLabel}`}
                      >
                        <PlayIcon size={12} />
                      </button>
                    )}
                  </div>
                  <div className={styles.chunkText}>
                    {highlightText(chunk.text, searchQuery)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className={styles.modalFooter}>
          {isEditing ? (
            <div className={styles.exportButtonsGroup}>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveEdits}
                leftIcon={<CheckIcon size={16} />}
                disabled={isSaving}
              >
                {isSaving ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={handleCancelEdits}
                leftIcon={<CloseIcon size={16} />}
                disabled={isSaving}
              >
                Annulla
              </Button>
            </div>
          ) : (
            <div className={styles.exportButtonsGroup}>
              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyText}
                leftIcon={<CopyIcon size={16} />}
                disabled={!transcription}
              >
                Copia Testo
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={handleDownloadTxt}
                leftIcon={<DownloadIcon size={16} />}
                disabled={!transcription}
              >
                Scarica (.txt)
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={handleDownloadJson}
                leftIcon={<TranscriptIcon size={16} />}
                disabled={!transcription}
              >
                Scarica (.json)
              </Button>
            </div>
          )}

          <Button variant="ghost" size="md" onClick={onClose} disabled={isSaving}>
            Chiudi
          </Button>
        </div>
      </div>
    </Modal>
  );
};
