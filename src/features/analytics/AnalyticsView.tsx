import { useState, useMemo, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import { formatDateTime, formatDurationSeconds } from "../../utils/time";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { KPIStatsCards } from "./KPIStatsCards";
import { SlideDurationChart } from "./SlideDurationChart";
import { ProvocationsChart } from "./ProvocationsChart";
import { TalkDistributionChart } from "./TalkDistributionChart";
import { MultiSessionChart } from "./MultiSessionChart";
import { SessionEditorModal } from "./SessionEditorModal";
import { JsonImportModal } from "./JsonImportModal";
import {
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  EditIcon,
  CopyIcon,
  ArrowLeftIcon,
  PlayIcon,
  CheckIcon,
} from "../../components/icons";
import type { TalkSessionRecord } from "../../types";
import styles from "./AnalyticsView.module.scss";

export const AnalyticsView: FC = () => {
  const navigate = useNavigate();
  const {
    sessions,
    currentSessionId,
    activeSessionRecord,
    updateSessionRecord,
    deleteSessionRecord,
    clearAllSessionsRecords,
    importSessionsRecords,
    loadSampleSessions,
    session: liveSessionState,
  } = useAppState();

  // Selected session ID to display in detail
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    if (currentSessionId) return currentSessionId;
    if (sessions.length > 0 && sessions[0]) return sessions[0].id;
    return "";
  });

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab for tables / charts view
  const [viewTab, setViewTab] = useState<"charts" | "tables">("charts");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Determine which session is currently viewed
  const currentViewSession = useMemo(() => {
    if (!sessions.length) return null;
    const found = sessions.find((s) => s.id === selectedSessionId);
    return found ?? sessions[0] ?? null;
  }, [sessions, selectedSessionId]);

  // Export a single session to JSON file
  const handleExportSingle = (sessionRecord: TalkSessionRecord) => {
    const filename = `talk_session_${sessionRecord.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date(sessionRecord.startedAt).toISOString().slice(0, 10)}.json`;
    const jsonStr = JSON.stringify(sessionRecord, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Sessione esportata con successo!");
  };

  // Export all sessions to JSON file
  const handleExportAll = () => {
    if (sessions.length === 0) return;
    const filename = `all_talk_sessions_${new Date().toISOString().slice(0, 10)}.json`;
    const jsonStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Esportate ${sessions.length} sessioni con successo!`);
  };

  // Copy single session JSON to clipboard
  const handleCopyJson = async (sessionRecord: TalkSessionRecord) => {
    try {
      const jsonStr = JSON.stringify(sessionRecord, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      showToast("JSON copiato negli appunti!");
    } catch {
      showToast("Errore durante la copia negli appunti.");
    }
  };

  // Confirm delete single
  const handleDeleteConfirm = () => {
    if (!confirmDeleteId) return;
    deleteSessionRecord(confirmDeleteId);
    setConfirmDeleteId(null);
    showToast("Sessione eliminata.");
  };

  // Confirm clear all
  const handleClearAllConfirm = () => {
    clearAllSessionsRecords();
    setConfirmClearAllOpen(false);
    showToast("Tutte le sessioni sono state rimosse.");
  };

  // Import handler
  const handleImport = (importedList: TalkSessionRecord[]) => {
    importSessionsRecords(importedList);
    if (importedList.length > 0 && importedList[0]) {
      setSelectedSessionId(importedList[0].id);
    }
    showToast(`Importate ${importedList.length} sessioni con successo!`);
  };

  const isTalkRunning =
    liveSessionState.startedAt !== null || activeSessionRecord !== null;

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.topBarRow}>
        <div className={styles.topActions}>
          <Button
            variant="ghost"
            size="md"
            onClick={() => navigate("/")}
            leftIcon={<ArrowLeftIcon size={18} />}
          >
            Pannello Configurazione
          </Button>

          {isTalkRunning && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (liveSessionState.mode === "game") {
                  navigate("/game");
                } else {
                  navigate("/presentation");
                }
              }}
              rightIcon={<PlayIcon size={18} />}
            >
              Riprendi Talk dal Vivo
            </Button>
          )}
        </div>
      </header>

      {/* If No Sessions */}
      {sessions.length === 0 ? (
        <div
          className={styles.emptyProvocations}
          style={{ padding: "var(--space-12) var(--space-6)" }}
        >
          <div className={styles.emptyIcon}>📊</div>
          <h3>Nessuna sessione registrata ancora</h3>
          <p style={{ marginBottom: "var(--space-6)" }}>
            Ogni volta che avvii un talk con il pulsante "Inizia Talk", viene
            registrata automaticamente una nuova sessione con tutti i tempi
            delle slide e delle provocazioni.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "var(--space-4)",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={loadSampleSessions}
              leftIcon={<CheckIcon size={20} />}
            >
              Carica dati di esempio dimostrativi
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setIsImportOpen(true)}
              leftIcon={<UploadIcon size={20} />}
            >
              Importa JSON
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Session Selector & Management Action Bar */}
          <section className={styles.sessionSelectorBar}>
            <div className={styles.sessionSelectorLeft}>
              <label htmlFor="session-select" className={styles.selectorLabel}>
                Sessione selezionata:
              </label>
              <select
                id="session-select"
                className={styles.sessionDropdown}
                value={currentViewSession?.id ?? ""}
                onChange={(e) => setSelectedSessionId(e.target.value)}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatDateTime(s.startedAt)})
                    {s.id === currentSessionId ? " [IN CORSO]" : ""}
                  </option>
                ))}
              </select>

              {currentViewSession && (
                <span
                  className={`${styles.sessionStatusPill} ${
                    currentViewSession.id === currentSessionId &&
                    !currentViewSession.endedAt
                      ? styles.statusActive
                      : styles.statusCompleted
                  }`}
                >
                  {currentViewSession.id === currentSessionId &&
                  !currentViewSession.endedAt
                    ? "● In Corso"
                    : "Completata"}
                </span>
              )}
            </div>

            <div className={styles.sessionControls}>
              {currentViewSession && (
                <>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setIsEditorOpen(true)}
                    leftIcon={<EditIcon size={16} />}
                    title="Modifica nome e note della sessione"
                  >
                    Modifica
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => handleCopyJson(currentViewSession)}
                    leftIcon={<CopyIcon size={16} />}
                    title="Copia JSON sessione"
                  >
                    Copia JSON
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleExportSingle(currentViewSession)}
                    leftIcon={<DownloadIcon size={16} />}
                    title="Esporta questa sessione in JSON"
                  >
                    Esporta
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setConfirmDeleteId(currentViewSession.id)}
                    leftIcon={<TrashIcon size={16} />}
                    title="Elimina questa sessione"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Elimina
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsImportOpen(true)}
                leftIcon={<UploadIcon size={16} />}
                title="Importa file JSON"
              >
                Importa
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={handleExportAll}
                leftIcon={<DownloadIcon size={16} />}
                title="Esporta tutte le sessioni"
              >
                Esporta tutte ({sessions.length})
              </Button>
            </div>
          </section>

          {/* Session Notes if available */}
          {currentViewSession?.notes && (
            <div className={styles.sessionNotesBanner}>
              <span className={styles.notesLabel}>Note della Sessione</span>
              <p className={styles.notesText}>{currentViewSession.notes}</p>
            </div>
          )}

          {/* High-Level KPI Cards */}
          {currentViewSession && <KPIStatsCards session={currentViewSession} />}

          {/* View toggle (Charts vs Tabular Details) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                variant={viewTab === "charts" ? "primary" : "ghost"}
                size="md"
                onClick={() => setViewTab("charts")}
              >
                📊 Grafici & Visualizzazioni
              </Button>
              <Button
                variant={viewTab === "tables" ? "primary" : "ghost"}
                size="md"
                onClick={() => setViewTab("tables")}
              >
                📑 Tabelle Dati
              </Button>
            </div>

            {sessions.length > 1 && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => setConfirmClearAllOpen(true)}
                style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}
              >
                Elimina tutte le sessioni
              </Button>
            )}
          </div>

          {currentViewSession && viewTab === "charts" && (
            <>
              {/* 1. Slide Duration Chart */}
              <SlideDurationChart slides={currentViewSession.slides} />

              {/* 2. Provocations Acceptance & Discussion Chart */}
              <ProvocationsChart
                provocations={currentViewSession.provocations}
              />

              {/* 3. Time Distribution (Donut) */}
              <TalkDistributionChart session={currentViewSession} />

              {/* 4. Multi-Session Comparison Chart (if >= 2 sessions) */}
              <MultiSessionChart
                sessions={sessions}
                selectedId={currentViewSession.id}
                onSelect={(id) => setSelectedSessionId(id)}
              />
            </>
          )}

          {currentViewSession && viewTab === "tables" && (
            <div className={styles.tablesSection}>
              <h3 className={styles.chartTitle}>Tabella Dettaglio Slide</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Titolo Slide</th>
                      <th>Durata</th>
                      <th>Visite</th>
                      <th>% sul Talk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentViewSession.slides.map((s, idx) => {
                      const pct =
                        currentViewSession.totalDurationSeconds > 0
                          ? Math.round(
                              (s.durationSeconds /
                                currentViewSession.totalDurationSeconds) *
                                100,
                            )
                          : 0;
                      return (
                        <tr key={s.slideId}>
                          <td>
                            <strong>#{idx + 1}</strong>
                          </td>
                          <td>{s.slideTitle}</td>
                          <td>
                            <strong>
                              {formatDurationSeconds(s.durationSeconds)}
                            </strong>
                          </td>
                          <td>{s.visits}</td>
                          <td>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <h3
                className={styles.chartTitle}
                style={{ marginTop: "var(--space-8)" }}
              >
                Tabella Dettaglio Provocazioni
              </h3>
              {currentViewSession.provocations.length === 0 ? (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    marginTop: "var(--space-2)",
                  }}
                >
                  Nessuna provocazione registrata.
                </p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Provocazione</th>
                        <th>Tempo Accettazione</th>
                        <th>Tempo Discussione</th>
                        <th>Completata alle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentViewSession.provocations.map((p, idx) => (
                        <tr key={p.id}>
                          <td>
                            <strong>#{idx + 1}</strong>
                          </td>
                          <td>
                            <strong>{p.provocationTitle}</strong>
                            {p.provocationSubtitle && (
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                {p.provocationSubtitle}
                              </div>
                            )}
                          </td>
                          <td>
                            <strong
                              style={{ color: "var(--color-brand-yellow)" }}
                            >
                              {p.acceptanceTimeSeconds}s
                            </strong>
                          </td>
                          <td>
                            <strong
                              style={{ color: "var(--color-brand-blue)" }}
                            >
                              {formatDurationSeconds(
                                p.discussionDurationSeconds,
                              )}
                            </strong>
                          </td>
                          <td>
                            {p.completedAt
                              ? formatDateTime(p.completedAt)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Editor Modal */}
      <SessionEditorModal
        session={currentViewSession}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={(updated) => {
          updateSessionRecord(updated);
          showToast("Sessione aggiornata con successo!");
        }}
      />

      {/* Import Modal */}
      <JsonImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />

      {/* Confirm Delete Single Modal */}
      <Modal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        ariaLabel="Conferma eliminazione sessione"
      >
        <h2
          style={{
            fontSize: "1.6rem",
            color: "var(--color-danger)",
            marginBottom: "var(--space-3)",
          }}
        >
          Eliminare questa sessione?
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-6)",
          }}
        >
          Questa azione eliminerà definitivamente la sessione selezionata e le
          relative statistiche registrate.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-3)",
          }}
        >
          <Button
            variant="ghost"
            size="md"
            onClick={() => setConfirmDeleteId(null)}
          >
            Annulla
          </Button>
          <Button variant="danger" size="md" onClick={handleDeleteConfirm}>
            Elimina Sessione
          </Button>
        </div>
      </Modal>

      {/* Confirm Clear All Modal */}
      <Modal
        isOpen={confirmClearAllOpen}
        onClose={() => setConfirmClearAllOpen(false)}
        ariaLabel="Conferma cancellazione di tutte le sessioni"
      >
        <h2
          style={{
            fontSize: "1.6rem",
            color: "var(--color-danger)",
            marginBottom: "var(--space-3)",
          }}
        >
          Eliminare tutte le sessioni?
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-6)",
          }}
        >
          Tutte le sessioni registrate nello storico ({sessions.length})
          verranno rimosse permanentemente dal localStorage.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-3)",
          }}
        >
          <Button
            variant="ghost"
            size="md"
            onClick={() => setConfirmClearAllOpen(false)}
          >
            Annulla
          </Button>
          <Button variant="danger" size="md" onClick={handleClearAllConfirm}>
            Sì, elimina tutto
          </Button>
        </div>
      </Modal>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className={styles.toastNotification} role="status">
          <CheckIcon size={20} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
