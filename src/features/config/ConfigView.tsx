import { useState, useMemo, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import { useFullscreen } from "../../hooks/useFullscreen";
import { parseEndTimeToday, getDurationPreview, getDefaultEndTime } from "../../utils/time";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { TimeInput } from "../../components/ui/TimeInput";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { LogoPlaceholder } from "../../components/layout/LogoPlaceholder";
import type { AppTheme } from "../../types";
import {
  PlayIcon,
  CheckIcon,
  RefreshIcon,
  ArrowRightIcon,
  CloseIcon,
  AnalyticsIcon,
} from "../../components/icons";
import styles from "./ConfigView.module.scss";

export const ConfigView: FC = () => {
  const navigate = useNavigate();
  const { config, session, game, theme, setTheme, updateConfig, startTalk, resetAll } = useAppState();
  const { requestFullscreen } = useFullscreen();

  // Initialize selected theme
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(
    () => config.theme || theme || "dark"
  );

  // Initialize input with stored config endTime or a default calculated time
  const [timeValue, setTimeValue] = useState<string>(() => {
    if (config.endTime) return config.endTime;
    return getDefaultEndTime();
  });

  const [hasSavedToast, setHasSavedToast] = useState<boolean>(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [confirmPastOpen, setConfirmPastOpen] = useState<boolean>(false);

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
    return getDurationPreview(parsedTarget.timestamp);
  }, [parsedTarget]);

  const hasActiveSession =
    session.startedAt !== null ||
    session.currentSlideIndex > 0 ||
    game.discussedCount > 0;

  const handleSave = (skipPastCheck = false) => {
    if (!parsedTarget) return;

    if (parsedTarget.isPast && !skipPastCheck) {
      setConfirmPastOpen(true);
      return;
    }

    updateConfig({
      endTime: timeValue,
      endTimestamp: parsedTarget.timestamp,
      createdAt: Date.now(),
      theme: selectedTheme,
    });

    setHasSavedToast(true);
    setTimeout(() => setHasSavedToast(false), 2500);
  };

  const handleStart = async () => {
    if (!parsedTarget) return;

    if (parsedTarget.isPast) {
      setConfirmPastOpen(true);
      return;
    }

    // Save configuration
    updateConfig({
      endTime: timeValue,
      endTimestamp: parsedTarget.timestamp,
      createdAt: Date.now(),
      theme: selectedTheme,
    });

    // Request fullscreen on stage canvas/viewport
    await requestFullscreen();

    // Start presentation session
    startTalk();
    navigate("/presentation");
  };

  const handleResume = async () => {
    await requestFullscreen();
    if (session.mode === "game") {
      navigate("/game");
    } else {
      navigate("/presentation");
    }
  };

  const handleResetConfirm = () => {
    resetAll();
    setTimeValue(getDefaultEndTime());
    setConfirmResetOpen(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.brandHeader}>
        <LogoPlaceholder />
        <h1 className={styles.title}>
          Pannello <span className={styles.highlight}>Talk dal Vivo</span>
        </h1>
        <p className={styles.subtitle}>
          Configura l'orario di fine del tuo talk, avvia lo stage a 16:9 ed entra nella presentazione.
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
        </div>
      </header>

      <div className={styles.cardGrid}>
        {/* Active Session block */}
        {hasActiveSession && (
          <Card raised className={styles.sessionCard}>
            <div className={styles.cardHeading}>
              <span>Sessione in corso</span>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
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
                <span className={styles.statValue}>{session.currentSlideIndex + 1}</span>
                <span className={styles.statLabel}>Slide attuale</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{game.discussedCount}</span>
                <span className={styles.statLabel}>Provocazioni</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue} style={{ textTransform: "capitalize" }}>
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
            error={parsedTarget?.isPast ? "Orario nel passato per oggi" : undefined}
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

      {/* Confirmation Modal: Reset session */}
      <Modal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        ariaLabel="Conferma azzeramento sessione"
      >
        <h2 style={{ fontSize: "1.8rem", marginBottom: "var(--space-4)", color: "var(--color-text)" }}>
          Ricominciare da capo?
        </h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-8)", fontSize: "1.1rem" }}>
          Questa operazione azzererà la configurazione del talk, riporterà la presentazione alla prima slide e resetterà il contatore e la cronologia delle provocazioni discusse nel gioco.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-4)" }}>
          <Button variant="ghost" size="md" onClick={() => setConfirmResetOpen(false)}>
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
        <h2 style={{ fontSize: "1.8rem", marginBottom: "var(--space-4)", color: "var(--color-warning)" }}>
          Orario già trascorso
        </h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-8)", fontSize: "1.1rem" }}>
          L'orario <strong>{timeValue}</strong> risulta precedente all'ora attuale di oggi. Vuoi confermarlo comunque?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-4)" }}>
          <Button variant="ghost" size="md" onClick={() => setConfirmPastOpen(false)} leftIcon={<CloseIcon size={18} />}>
            Correggi orario
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setConfirmPastOpen(false);
              handleSave(true);
            }}
          >
            Conferma comunque
          </Button>
        </div>
      </Modal>
    </div>
  );
};
