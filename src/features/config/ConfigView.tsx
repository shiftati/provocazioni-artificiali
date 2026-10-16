import { useState, useMemo, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import { useFullscreen } from "../../hooks/useFullscreen";
import {
  parseEndTimeToday,
  getDurationPreview,
  getDefaultEndTime,
} from "../../utils/time";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { TimeInput } from "../../components/ui/TimeInput";
import { NumberInput } from "../../components/ui/NumberInput";
import { SelectInput } from "../../components/ui/SelectInput";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { SLIDES } from "../presentation/slides.registry";
import type { AppTheme } from "../../types";
import {
  PlayIcon,
  CheckIcon,
  RefreshIcon,
  ArrowRightIcon,
  CloseIcon,
  AnalyticsIcon,
  DownloadIcon,
  FinishIcon,
} from "../../components/icons";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import { useOfflineCache } from "../../hooks/useOfflineCache";
import styles from "./ConfigView.module.scss";

export const ConfigView: FC = () => {
  const navigate = useNavigate();
  const {
    config,
    session,
    game,
    theme,
    setTheme,
    navOnSlide,
    setNavOnSlide,
    updateConfig,
    startTalk,
    endTalk,
    resetAll,
    isSessionActive,
  } = useAppState();
  const { requestFullscreen } = useFullscreen();
  const { isInstallable, isInstalled, installApp } = usePwaInstall();
  const {
    total: cacheTotal,
    completed: cacheCompleted,
    percent: cachePercent,
    isComplete: cacheIsComplete,
    inProgress: cacheInProgress,
    recache: triggerRecache,
    isOnline,
  } = useOfflineCache();

  // Initialize selected theme
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(
    () => config.theme || theme || "dark",
  );

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  // Initialize input with stored config endTime or a default calculated time
  const [timeValue, setTimeValue] = useState<string>(() => {
    if (config.endTime) return config.endTime;
    return getDefaultEndTime();
  });

  const [conclusionMinutes, setConclusionMinutes] = useState<number>(() => {
    return typeof config.conclusionMinutes === "number"
      ? config.conclusionMinutes
      : 5;
  });

  const [introEndSlide, setIntroEndSlide] = useState<number>(() => {
    return typeof config.introEndSlide === "number" ? config.introEndSlide : 11;
  });

  const [hasSavedToast, setHasSavedToast] = useState<boolean>(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [confirmPastOpen, setConfirmPastOpen] = useState<boolean>(false);
  const [pendingPastAction, setPendingPastAction] = useState<"save" | "start">(
    "save",
  );

  const handleThemeChange = (newTheme: AppTheme) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
  };

  // Compute parsed target
  const parsedTarget = useMemo(() => {
    if (!timeValue) return null;
    return parseEndTimeToday(timeValue);
  }, [timeValue]);

  const durationPreview = useMemo(() => {
    if (!parsedTarget) return "Inserisci un orario valido";
    if (parsedTarget.isPast) {
      return "Attenzione: questo orario risulta già trascorso per oggi.";
    }

    const talkEndMs = parsedTarget.timestamp;
    const cleanConclusionMin = Math.max(0, conclusionMinutes || 0);
    const conclusionMs = cleanConclusionMin * 60 * 1000;
    const gameEndMs = talkEndMs - conclusionMs;

    const gameEndDate = new Date(gameEndMs);
    const gameEndTimeStr = `${String(gameEndDate.getHours()).padStart(2, "0")}:${String(gameEndDate.getMinutes()).padStart(2, "0")}`;

    return `Fine gioco: ${gameEndTimeStr} (Stop alle telefonate a -${cleanConclusionMin} min) • Fine intro: Slide #${introEndSlide} • Fine talk: ${timeValue} • ${getDurationPreview(talkEndMs)}`;
  }, [parsedTarget, conclusionMinutes, introEndSlide, timeValue]);

  const hasActiveSession = isSessionActive;

  const handleSave = (skipPastCheck = false) => {
    if (!parsedTarget) return;

    if (parsedTarget.isPast && !skipPastCheck) {
      setPendingPastAction("save");
      setConfirmPastOpen(true);
      return;
    }

    updateConfig({
      endTime: timeValue,
      endTimestamp: parsedTarget.timestamp,
      createdAt: Date.now(),
      theme: selectedTheme,
      conclusionMinutes: Math.max(0, conclusionMinutes || 0),
      introEndSlide,
      navOnSlide,
    });

    setHasSavedToast(true);
    setTimeout(() => setHasSavedToast(false), 2500);
  };

  const proceedStart = async () => {
    if (!parsedTarget) return;

    const newConfigData = {
      endTime: timeValue,
      endTimestamp: parsedTarget.timestamp,
      createdAt: Date.now(),
      theme: selectedTheme,
      conclusionMinutes: Math.max(0, conclusionMinutes || 0),
      introEndSlide,
      navOnSlide,
    };

    // Save configuration
    updateConfig(newConfigData);

    // Request fullscreen on stage canvas/viewport
    await requestFullscreen();

    // Start presentation session (resets previous talk session, cards and progress like "Ricomincia da capo")
    startTalk(newConfigData);
    navigate("/presentation");
  };

  const handleStart = async () => {
    if (!parsedTarget) return;

    if (parsedTarget.isPast) {
      setPendingPastAction("start");
      setConfirmPastOpen(true);
      return;
    }

    await proceedStart();
  };

  const handleResume = async () => {
    await requestFullscreen();
    if (session.mode === "game") {
      navigate("/game");
    } else {
      navigate("/presentation");
    }
  };

  const handleEndSession = () => {
    endTalk();
    navigate("/analytics");
  };

  const handleResetConfirm = () => {
    resetAll();
    setTimeValue(getDefaultEndTime());
    setConclusionMinutes(5);
    setIntroEndSlide(11);
    setConfirmResetOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <header className={styles.brandHeader}>
          <h1 className={styles.title}>
            Pannello <span className={styles.highlight}>Talk dal Vivo</span>
          </h1>
          <p className={styles.subtitle}>
            Configura l'orario di fine del tuo talk, avvia lo stage a 16:9 ed
            entra nella presentazione.
          </p>
          <div className={styles.headerLinks}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate("/analytics")}
              leftIcon={<AnalyticsIcon size={18} />}
            >
              Statistiche & Analytics Talk
            </Button>
            {isInstallable && !isInstalled && (
              <Button
                variant="secondary"
                size="md"
                onClick={installApp}
                leftIcon={<DownloadIcon size={18} />}
              >
                Installa App (PWA)
              </Button>
            )}
            {isInstalled && <Badge variant="accent">App PWA Installata</Badge>}

            {/* Offline Cache Status and Action */}
            {cacheInProgress ? (
              <Badge variant="accent">
                Download cache offline: {cachePercent}% ({cacheCompleted}/
                {cacheTotal})
              </Badge>
            ) : cacheIsComplete ? (
              <Button
                variant="secondary"
                size="md"
                onClick={triggerRecache}
                title="Tutti i file multimediali sono salvati in cache. Clicca per sincronizzare di nuovo."
                leftIcon={<CheckIcon size={18} />}
              >
                100% Offline ({cacheCompleted}/{cacheTotal} in cache)
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={triggerRecache}
                title="Scarica tutte le immagini e dati in locale per l'offline"
                leftIcon={<DownloadIcon size={18} />}
              >
                Scarica Cache Offline ({cacheCompleted}/{cacheTotal})
              </Button>
            )}

            {!isOnline && <Badge variant="danger">Dispositivo Offline</Badge>}
          </div>
        </header>

        <div className={styles.cardGrid}>
          {/* Active Session block */}
          {hasActiveSession && (
            <Card raised className={styles.sessionCard}>
              <div className={styles.cardHeading}>
                <span>Sessione in corso</span>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-2)",
                    alignItems: "center",
                  }}
                >
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => navigate("/analytics")}
                    leftIcon={<AnalyticsIcon size={16} />}
                  >
                    Analytics
                  </Button>
                  <Badge variant="accent">Attiva</Badge>
                </div>
              </div>

              <div className={styles.sessionStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>
                    {session.currentSlideIndex + 1}
                  </span>
                  <span className={styles.statLabel}>Slide attuale</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>
                    {game.discussedCount}
                  </span>
                  <span className={styles.statLabel}>Provocazioni</span>
                </div>
                <div className={styles.statItem}>
                  <span
                    className={styles.statValue}
                    style={{ textTransform: "capitalize" }}
                  >
                    {session.mode === "game" ? "Gioco" : "Slide"}
                  </span>
                  <span className={styles.statLabel}>Modalità</span>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setConfirmResetOpen(true)}
                  leftIcon={<RefreshIcon size={18} />}
                >
                  Ricomincia da capo
                </Button>
                <IconButton
                  aria-label="Concludi talk e sessione"
                  size="lg"
                  onClick={handleEndSession}
                  title="Concludi sessione talk"
                  style={{ color: "var(--color-mint)" }}
                >
                  <FinishIcon size={24} />
                </IconButton>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleResume}
                  rightIcon={<ArrowRightIcon size={20} />}
                >
                  Riprendi Talk
                </Button>
              </div>
            </Card>
          )}

          {/* Configuration block */}
          <Card className={styles.configCard}>
            <div className={styles.cardHeading}>
              <span>Configurazione Talk</span>
              {hasSavedToast && (
                <span className={styles.savedToast}>
                  <CheckIcon size={18} /> Salvato
                </span>
              )}
            </div>

            {/* Theme selector */}
            <div className={styles.themeSection}>
              <label className={styles.themeLabel} id="theme-selector-label">
                Tema interfaccia
              </label>
              <SegmentedControl<AppTheme>
                options={[
                  { value: "dark", label: "🌙 Dark" },
                  { value: "light", label: "☀️ Light" },
                ]}
                value={selectedTheme}
                onChange={handleThemeChange}
                ariaLabel="Seleziona tema dell'applicazione"
              />
              <span className={styles.themeHint}>
                {selectedTheme === "light"
                  ? "Tema Light attivo: cornice blu chiaro (#1e66fa) e accenti arancioni."
                  : "Tema Dark attivo: visual ad alto contrasto per ambienti bui e proiettori."}
              </span>
            </div>

            <TimeInput
              label="Orario previsto per la fine del talk"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              hint="Inserisci l'ora di fine (formato HH:mm). Il countdown calcolerà la durata residua esatta senza drift."
              error={
                parsedTarget?.isPast ? "Orario nel passato per oggi" : undefined
              }
            />

            <NumberInput
              id="talk-conclusion-minutes"
              label="Minuti dedicati alla conclusione"
              value={conclusionMinutes}
              onChange={(e) =>
                setConclusionMinutes(
                  Math.max(0, parseInt(e.target.value, 10) || 0),
                )
              }
              min={0}
              max={180}
              step={1}
              suffix="min"
              hint="Numero di minuti dalla fine del gioco alla fine della presentazione. Triggera lo 'Stop alle telefonate'."
            />

            <SelectInput
              id="talk-intro-end-slide"
              label="Slide di fine intro"
              value={introEndSlide}
              onChange={(e) =>
                setIntroEndSlide(parseInt(e.target.value, 10) || 11)
              }
              options={SLIDES.map((s, idx) => ({
                value: idx + 1,
                label: `${idx + 1}: ${s.title}`,
              }))}
              hint={`La slide selezionata è l'ultima slide dell'introduzione (default #11). Lo 'Stop alle telefonate' passerà alla slide successiva (#${introEndSlide + 1}${SLIDES[introEndSlide] ? `: ${SLIDES[introEndSlide].title}` : ""}).`}
            />

            <div className={styles.previewText} aria-live="polite">
              {durationPreview}
            </div>

            <div className={styles.actionsRow}>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleSave(false)}
                disabled={!timeValue}
              >
                Salva configurazione
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={handleStart}
                disabled={!timeValue}
                leftIcon={<PlayIcon size={20} />}
              >
                Inizia Talk
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal: Reset session */}
      <Modal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        ariaLabel="Conferma azzeramento sessione"
      >
        <h2
          style={{
            fontSize: "1.8rem",
            marginBottom: "var(--space-4)",
            color: "var(--color-text)",
          }}
        >
          Ricominciare da capo?
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-8)",
            fontSize: "1.1rem",
          }}
        >
          Questa operazione azzererà la configurazione del talk, riporterà la
          presentazione alla prima slide e resetterà il contatore e la
          cronologia delle provocazioni discusse nel gioco.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-4)",
          }}
        >
          <Button
            variant="ghost"
            size="md"
            onClick={() => setConfirmResetOpen(false)}
          >
            Annulla
          </Button>
          <Button variant="danger" size="md" onClick={handleResetConfirm}>
            Sì, ricomincia
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal: Past time */}
      <Modal
        isOpen={confirmPastOpen}
        onClose={() => setConfirmPastOpen(false)}
        ariaLabel="Conferma orario nel passato"
      >
        <h2
          style={{
            fontSize: "1.8rem",
            marginBottom: "var(--space-4)",
            color: "var(--color-warning)",
          }}
        >
          Orario già trascorso
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-8)",
            fontSize: "1.1rem",
          }}
        >
          L'orario <strong>{timeValue}</strong> risulta precedente all'ora
          attuale di oggi. Vuoi confermarlo comunque?
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-4)",
          }}
        >
          <Button
            variant="ghost"
            size="md"
            onClick={() => setConfirmPastOpen(false)}
            leftIcon={<CloseIcon size={18} />}
          >
            Correggi orario
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={async () => {
              setConfirmPastOpen(false);
              if (pendingPastAction === "start") {
                await proceedStart();
              } else {
                handleSave(true);
              }
            }}
          >
            Conferma comunque
          </Button>
        </div>
      </Modal>
    </div>
  );
};
