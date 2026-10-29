import { useState, useMemo, useEffect, Fragment, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import {
  formatDateTime,
  formatDurationSeconds,
  getSessionGameDuration,
  deduplicateProvocations,
} from "../../utils/time";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { KPIStatsCards } from "./KPIStatsCards";
import { TalkAudioPlayer } from "./TalkAudioPlayer";
import { SlideDurationChart } from "./SlideDurationChart";
import { SessionDurationChart } from "./SessionDurationChart";
import { ProvocationsChart } from "./ProvocationsChart";
import { TalkDistributionChart } from "./TalkDistributionChart";
import { MultiSessionChart } from "./MultiSessionChart";
import { SessionEditorModal } from "./SessionEditorModal";
import { ProvocationEditorModal } from "./ProvocationEditorModal";
import { JsonImportModal } from "./JsonImportModal";
import { AudioImportModal } from "./AudioImportModal";
import { SessionTimeline } from "./SessionTimeline";
import {
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  EditIcon,
  CopyIcon,
  PlayIcon,
  CheckIcon,
  MicIcon,
  TranscriptIcon,
} from "../../components/icons";
import { TranscriptionModal } from "./TranscriptionModal";
import type { TalkSessionRecord, ProvocationStat } from "../../types";
import {
  getTranscription,
  type StoredTranscription,
} from "../../utils/transcriptionStorage";
import {
  getAudioRecording,
  saveAudioRecording,
  deleteAudioRecording,
  downloadAudioFile,
  inferAudioMimeType,
  type StoredAudioRecording,
} from "../../utils/audioStorage";
import {
  exportSingleSessionWithAudio,
  exportAllSessionsWithAudio,
} from "../../utils/talkExportImport";
import styles from "./AnalyticsView.module.scss";

export const AnalyticsView: FC = () => {
  const navigate = useNavigate();
  const {
    sessions,
    currentSessionId,
    config,
    updateSessionRecord,
    deleteSessionRecord,
    clearAllSessionsRecords,
    importSessionsRecords,
    loadSampleSessions,
    session: liveSessionState,
    isSessionActive,
    isRecordingAudio,
    isRecordingVideo,
    isTranscribing,
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
  const [isAudioImportOpen, setIsAudioImportOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingTableProv, setEditingTableProv] = useState<{
    prov: ProvocationStat;
    index: number;
  } | null>(null);

  // Tab for tables / charts / timeline view
  const [viewTab, setViewTab] = useState<"charts" | "tables" | "timeline">(
    "charts",
  );

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

  // Exporting & audio refresh state
  const [isExporting, setIsExporting] = useState(false);
  const [audioRefreshKey, setAudioRefreshKey] = useState(0);

  // Audio recording states
  const [audioRecording, setAudioRecording] =
    useState<StoredAudioRecording | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [confirmDeleteAudio, setConfirmDeleteAudio] = useState(false);

  // Transcription modal state
  const [transcription, setTranscription] =
    useState<StoredTranscription | null>(null);
  const [isTranscriptionModalOpen, setIsTranscriptionModalOpen] =
    useState(false);

  useEffect(() => {
    let isCurrent = true;
    if (currentViewSession?.id) {
      getTranscription(currentViewSession.id)
        .then((tx) => {
          if (isCurrent) setTranscription(tx);
        })
        .catch(() => {
          if (isCurrent) setTranscription(null);
        });
    } else {
      setTranscription(null);
    }
    return () => {
      isCurrent = false;
    };
  }, [currentViewSession?.id, audioRefreshKey]);

  useEffect(() => {
    let isCurrent = true;
    let objectUrl: string | null = null;

    if (currentViewSession?.id) {
      getAudioRecording(
        currentViewSession.id,
        currentViewSession.totalDurationSeconds,
      ).then((rec) => {
        if (!isCurrent) return;
        setAudioRecording(rec);
        if (rec) {
          objectUrl = URL.createObjectURL(rec.blob);
          setAudioUrl(objectUrl);
        } else {
          setAudioUrl(null);
        }
      });
    } else {
      setAudioRecording(null);
      setAudioUrl(null);
    }

    return () => {
      isCurrent = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [currentViewSession?.id, currentViewSession?.hasAudio, audioRefreshKey]);

  const handleDownloadAudio = () => {
    if (!audioRecording || !currentViewSession) return;
    const cleanName = `talk_audio_${currentViewSession.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date(currentViewSession.startedAt).toISOString().slice(0, 10)}`;
    downloadAudioFile(audioRecording.blob, cleanName, audioRecording.mimeType);
    showToast("Download file audio avviato!");
  };

  const handleDeleteAudio = async () => {
    if (!currentViewSession) return;
    await deleteAudioRecording(currentViewSession.id);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioRecording(null);
    setAudioUrl(null);
    setConfirmDeleteAudio(false);
    updateSessionRecord({
      ...currentViewSession,
      hasAudio: false,
    });
    showToast("Registrazione audio eliminata.");
  };

  const handleImportAudio = async (
    targetSessionId: string,
    file: File,
    durationSeconds?: number,
  ) => {
    const target = sessions.find((s) => s.id === targetSessionId);
    if (!target) return;

    const mime = inferAudioMimeType(file.name, file.type);
    const effectiveDuration =
      durationSeconds && durationSeconds > 0
        ? durationSeconds
        : target.totalDurationSeconds > 0
          ? target.totalDurationSeconds
          : undefined;

    await saveAudioRecording({
      sessionId: targetSessionId,
      blob: file,
      mimeType: mime,
      durationSeconds: effectiveDuration,
      createdAt: Date.now(),
    });

    const updatedSession: TalkSessionRecord = {
      ...target,
      hasAudio: true,
      audioMimeType: mime,
      audioDurationSeconds: effectiveDuration,
    };

    updateSessionRecord(updatedSession);

    if (targetSessionId === selectedSessionId) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const rec = await getAudioRecording(targetSessionId, effectiveDuration);
      setAudioRecording(rec);
      if (rec) {
        setAudioUrl(URL.createObjectURL(rec.blob));
      }
    } else {
      setSelectedSessionId(targetSessionId);
    }

    showToast(`Audio associato con successo al talk "${target.name}"!`);
  };

  // Determine the effective intro end slide for the selected session
  const effectiveIntroEndSlide = useMemo(() => {
    if (!currentViewSession) return 10;
    const rawVal =
      currentViewSession.id === currentSessionId
        ? (config.introEndSlide ?? currentViewSession.introEndSlide ?? 10)
        : (currentViewSession.introEndSlide ?? config.introEndSlide ?? 10);
    const maxSlides = currentViewSession.slides.length || 14;
    return Math.min(Math.max(1, rawVal), maxSlides);
  }, [currentViewSession, currentSessionId, config.introEndSlide]);

  const handleUpdateProvocation = (updatedProv: ProvocationStat) => {
    if (!currentViewSession) return;
    const updatedProvocations = currentViewSession.provocations.map((p) =>
      p.id === updatedProv.id ? updatedProv : p,
    );
    const updatedSession: TalkSessionRecord = {
      ...currentViewSession,
      provocations: updatedProvocations,
    };
    updateSessionRecord(updatedSession);
    showToast("Provocazione aggiornata con successo!");
  };

  const handleDeleteProvocation = (id: string) => {
    if (!currentViewSession) return;
    const updatedProvocations = currentViewSession.provocations.filter(
      (p) => p.id !== id,
    );
    const updatedSession: TalkSessionRecord = {
      ...currentViewSession,
      provocations: updatedProvocations,
      provocationsCount: updatedProvocations.length,
    };
    updateSessionRecord(updatedSession);
    showToast("Provocazione eliminata.");
  };

  // Export a single session (con audio se presente in archivio .zip, altrimenti .json)
  const handleExportSingle = async (sessionRecord: TalkSessionRecord) => {
    try {
      setIsExporting(true);
      const result = await exportSingleSessionWithAudio(sessionRecord);
      if (result.type === "zip") {
        showToast("Talk e registrazione audio esportati con successo (.zip)!");
      } else {
        showToast("Talk esportato in JSON con successo!");
      }
    } catch (err) {
      console.error("Errore esportazione talk:", err);
      showToast("Errore durante l'esportazione del talk.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export all sessions (con audio in archivio .zip se presenti tracce, altrimenti .json)
  const handleExportAll = async () => {
    if (sessions.length === 0) return;
    try {
      setIsExporting(true);
      const result = await exportAllSessionsWithAudio(sessions);
      if (result.type === "zip") {
        showToast(
          `Esportate ${sessions.length} sessioni e ${result.audioCount} tracce audio (.zip)!`,
        );
      } else {
        showToast(`Esportate ${sessions.length} sessioni con successo!`);
      }
    } catch (err) {
      console.error("Errore esportazione sessioni:", err);
      showToast("Errore durante l'esportazione delle sessioni.");
    } finally {
      setIsExporting(false);
    }
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
  const handleImport = (importedList: TalkSessionRecord[], audioCount = 0) => {
    importSessionsRecords(importedList);
    if (importedList.length > 0 && importedList[0]) {
      setSelectedSessionId(importedList[0].id);
    }
    setAudioRefreshKey((k) => k + 1);
    if (audioCount > 0) {
      showToast(
        `Importate ${importedList.length} sessioni e ${audioCount} tracce audio!`,
      );
    } else {
      showToast(`Importate ${importedList.length} sessioni con successo!`);
    }
  };

  const isTalkRunning = isSessionActive;

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.topActions}>
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

      {/* If No Sessions */}
      {sessions.length === 0 ? (
        <div
          className={styles.emptyProvocations}
          style={{ padding: "var(--space-12) var(--space-6)" }}
        >
          <div className={styles.emptyIcon}>📊</div>
          <h3>Nessuna sessione registrata ancora</h3>
          <p style={{ marginBottom: "var(--space-6)" }}>
            Ogni volta che avvii un talk con il pulsante &quot;Inizia
            Talk&quot;, viene registrata automaticamente una nuova sessione con
            tutti i tempi delle slide e delle provocazioni.
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
              Importa (JSON o ZIP)
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
                {sessions.map((s) => {
                  const hasAudio = Boolean(
                    s.hasAudio ||
                    (s.id === currentSessionId && isRecordingAudio),
                  );
                  const hasVideo = Boolean(
                    s.hasVideo ||
                    s.videoFileName ||
                    (s.id === currentSessionId && isRecordingVideo),
                  );
                  const hasTranscription = Boolean(
                    s.hasTranscription ||
                    (s.id === currentSessionId && isTranscribing),
                  );

                  return (
                    <option key={s.id} value={s.id}>
                      {hasAudio ? "🎙️ " : ""}
                      {hasVideo ? "📹 " : ""}
                      {hasTranscription ? "📝 " : ""}
                      {s.name} ({formatDateTime(s.startedAt)})
                      {s.id === currentSessionId ? " [IN CORSO]" : ""}
                    </option>
                  );
                })}
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
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/replay/${currentViewSession.id}`)}
                    leftIcon={<PlayIcon size={16} />}
                    title="Rivedi la presentazione di questa sessione passo passo"
                  >
                    Replay Talk
                  </Button>
                  {(transcription || currentViewSession.hasTranscription) && (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setIsTranscriptionModalOpen(true)}
                      leftIcon={<TranscriptIcon size={16} />}
                      title="Visualizza trascrizione del talk, ricerca e esporta testo"
                    >
                      Trascrizione
                    </Button>
                  )}
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
                    disabled={isExporting}
                    title={
                      currentViewSession.hasAudio
                        ? "Esporta talk e traccia audio associata (.zip)"
                        : "Esporta questa sessione in JSON"
                    }
                  >
                    {isExporting ? "Esportazione..." : "Esporta"}
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
                  {sessions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => setConfirmClearAllOpen(true)}
                      className={styles.clearAllBtn}
                    >
                      Elimina tutte le sessioni
                    </Button>
                  )}
                </>
              )}

              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsAudioImportOpen(true)}
                leftIcon={<MicIcon size={16} />}
                title="Importa file audio precedentemente esportato e associalo al talk"
              >
                Importa Audio
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsImportOpen(true)}
                leftIcon={<UploadIcon size={16} />}
                title="Importa file JSON o archivio ZIP con audio"
              >
                Importa
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={handleExportAll}
                leftIcon={<DownloadIcon size={16} />}
                disabled={isExporting}
                title="Esporta tutte le sessioni e gli audio associati (.zip)"
              >
                {isExporting
                  ? "Esportazione..."
                  : `Esporta tutte (${sessions.length})`}
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

          {/* Audio Recording Player Card or Prompt to Import Audio */}
          {currentViewSession && audioUrl && audioRecording ? (
            <TalkAudioPlayer
              audioUrl={audioUrl}
              audioRecording={audioRecording}
              session={currentViewSession}
              onDownload={handleDownloadAudio}
              onDelete={() => setConfirmDeleteAudio(true)}
              onLaunchReplay={(startAtSec) => {
                const targetMs = Math.round(
                  currentViewSession.startedAt + (startAtSec ?? 0) * 1000,
                );
                navigate(
                  `/replay/${currentViewSession.id}?startAt=${targetMs}`,
                );
              }}
            />
          ) : currentViewSession ? (
            <div className={styles.noAudioBanner}>
              <div className={styles.noAudioLeft}>
                <MicIcon
                  size={20}
                  style={{ color: "var(--color-text-muted)" }}
                />
                <span>
                  Nessuna traccia audio registrata per questa sessione.
                </span>
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsAudioImportOpen(true)}
                leftIcon={<UploadIcon size={14} />}
                title="Importa e associa un file audio esportato a questa sessione"
              >
                Importa Audio
              </Button>
            </div>
          ) : null}

          {/* High-Level KPI Cards */}
          {currentViewSession && <KPIStatsCards session={currentViewSession} />}

          {/* View toggle (Charts vs Tabular Details) */}
          <div className={styles.viewTabsRow}>
            <div className={styles.viewTabsList}>
              <Button
                variant={viewTab === "charts" ? "primary" : "ghost"}
                size="md"
                onClick={() => setViewTab("charts")}
              >
                📊 Grafici &amp; Visualizzazioni
              </Button>
              <Button
                variant={viewTab === "tables" ? "primary" : "ghost"}
                size="md"
                onClick={() => setViewTab("tables")}
              >
                📑 Tabelle Dati
              </Button>
              <Button
                variant={viewTab === "timeline" ? "primary" : "ghost"}
                size="md"
                onClick={() => setViewTab("timeline")}
              >
                ⏱️ Storico Eventi ({currentViewSession?.events?.length ?? 0})
              </Button>
            </div>
          </div>

          {currentViewSession && viewTab === "charts" && (
            <>
              {/* 1. Slide Duration Chart (senza barra del gioco) */}
              <SlideDurationChart slides={currentViewSession.slides} />

              {/* 2. Nuovo grafico: Durata delle sessioni (Intro, Gioco, Conclusione) */}
              <SessionDurationChart
                session={currentViewSession}
                introEndSlide={effectiveIntroEndSlide}
              />

              {/* 3. Provocations Acceptance & Discussion Chart */}
              <ProvocationsChart
                provocations={currentViewSession.provocations}
                onUpdateProvocation={handleUpdateProvocation}
                onDeleteProvocation={handleDeleteProvocation}
              />

              {/* 4. Time Distribution (Donut) */}
              <TalkDistributionChart session={currentViewSession} />

              {/* 5. Multi-Session Comparison Chart (if >= 2 sessions) */}
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
                      const isIntroEnd = idx === effectiveIntroEndSlide - 1;
                      const gameDuration =
                        getSessionGameDuration(currentViewSession);
                      const gamePct =
                        currentViewSession.totalDurationSeconds > 0
                          ? Math.round(
                              (gameDuration /
                                currentViewSession.totalDurationSeconds) *
                                100,
                            )
                          : 0;

                      return (
                        <Fragment key={s.slideId}>
                          <tr>
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
                          {isIntroEnd && (
                            <tr
                              key="game-session-row"
                              className={styles.gameTableRow}
                            >
                              <td>
                                <span className={styles.gameTableBadge}>
                                  🎮 GIOCO
                                </span>
                              </td>
                              <td>
                                <strong
                                  style={{ color: "var(--color-brand-blue)" }}
                                >
                                  Fase di Gioco (Provocazioni)
                                </strong>
                                <div className={styles.gameTableSub}>
                                  {effectiveIntroEndSlide <
                                  currentViewSession.slides.length
                                    ? `Sessione interattiva tra Slide ${effectiveIntroEndSlide} e Slide ${effectiveIntroEndSlide + 1}`
                                    : `Sessione interattiva dopo Slide ${effectiveIntroEndSlide}`}
                                </div>
                              </td>
                              <td>
                                <strong
                                  style={{ color: "var(--color-brand-blue)" }}
                                >
                                  {formatDurationSeconds(gameDuration)}
                                </strong>
                              </td>
                              <td>
                                {currentViewSession.provocationsCount} prov.
                              </td>
                              <td>{gamePct}%</td>
                            </tr>
                          )}
                        </Fragment>
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
              {deduplicateProvocations(currentViewSession.provocations)
                .length === 0 ? (
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
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deduplicateProvocations(
                        currentViewSession.provocations,
                      ).map((p, idx) => (
                        <tr key={p.id}>
                          <td>
                            <strong>#{idx + 1}</strong>
                          </td>
                          <td>
                            <strong>
                              {p.provocationTitle || "(Senza titolo)"}
                            </strong>
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
                          <td>
                            <Button
                              variant="ghost"
                              size="md"
                              onClick={() =>
                                setEditingTableProv({ prov: p, index: idx })
                              }
                              leftIcon={<EditIcon size={14} />}
                              title="Modifica o assegna titolo alla provocazione"
                            >
                              Modifica
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {currentViewSession && viewTab === "timeline" && (
            <SessionTimeline session={currentViewSession} onToast={showToast} />
          )}
        </>
      )}

      {/* Audio Import Modal */}
      <AudioImportModal
        isOpen={isAudioImportOpen}
        onClose={() => setIsAudioImportOpen(false)}
        sessions={sessions}
        initialSessionId={currentViewSession?.id ?? ""}
        onImportAudio={handleImportAudio}
      />

      {/* Confirm Delete Audio Modal */}
      <Modal
        isOpen={confirmDeleteAudio}
        onClose={() => setConfirmDeleteAudio(false)}
        ariaLabel="Conferma eliminazione file audio"
      >
        <h2
          style={{
            fontSize: "1.6rem",
            color: "var(--color-danger)",
            marginBottom: "var(--space-3)",
          }}
        >
          Eliminare la registrazione audio?
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-6)",
          }}
        >
          Sei sicuro di voler eliminare la traccia audio registrata di questa
          sessione dalla memoria del browser? L&apos;operazione è definitiva e
          il file non potrà essere recuperato.
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
            onClick={() => setConfirmDeleteAudio(false)}
          >
            Annulla
          </Button>
          <Button variant="danger" size="md" onClick={handleDeleteAudio}>
            Elimina Audio
          </Button>
        </div>
      </Modal>

      {/* Provocation Editor Modal for Table view */}
      <ProvocationEditorModal
        provocation={editingTableProv?.prov ?? null}
        provocationIndex={editingTableProv?.index ?? 0}
        isOpen={editingTableProv !== null}
        onClose={() => setEditingTableProv(null)}
        onSave={handleUpdateProvocation}
        onDelete={handleDeleteProvocation}
      />

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

      {/* Full Transcription Viewer & Search Modal */}
      {currentViewSession && (
        <TranscriptionModal
          isOpen={isTranscriptionModalOpen}
          onClose={() => setIsTranscriptionModalOpen(false)}
          session={currentViewSession}
          transcription={transcription}
          onSeekAudio={(sec) => {
            const audioEl = document.querySelector("audio");
            if (audioEl) {
              audioEl.currentTime = sec;
              audioEl.play().catch(() => {});
            }
          }}
          onLaunchReplay={(sec) => {
            const targetMs = Math.round(
              currentViewSession.startedAt + sec * 1000,
            );
            navigate(`/replay/${currentViewSession.id}?startAt=${targetMs}`);
          }}
          onUpdateTranscription={(updated) => {
            setTranscription(updated);
            showToast("Trascrizione aggiornata e salvata con successo!");
          }}
        />
      )}

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
