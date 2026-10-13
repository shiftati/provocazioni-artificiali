import type { FC } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogoPlaceholder } from "./LogoPlaceholder";
import { SegmentedControl } from "../ui/SegmentedControl";
import { CountdownDisplay } from "../ui/CountdownDisplay";
import { IconButton } from "../ui/IconButton";
import {
  FullscreenIcon,
  ExitFullscreenIcon,
  SettingsIcon,
  ClockIcon,
  ChevronUpIcon,
  AnalyticsIcon,
  DownloadIcon,
} from "../icons";
import { useAppState } from "../../state/AppStateContext";
import { useFullscreen } from "../../hooks/useFullscreen";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import { formatSecondsToMMSS } from "../../utils/time";
import styles from "./TopBar.module.scss";

export interface TopBarProps {
  onCollapse?: () => void;
}

export const TopBar: FC<TopBarProps> = ({ onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { globalRemainingSeconds, session, config, setMode, isSessionActive } = useAppState();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { isInstallable, isInstalled, installApp } = usePwaInstall();

  const currentMode = location.pathname.includes("/game") ? "game" : "presentation";

  const handleModeChange = (mode: "presentation" | "game") => {
    setMode(mode);
    if (mode === "game") {
      navigate("/game");
    } else {
      navigate("/presentation");
    }
  };

  const introEndIndex = (config.introEndSlide ? config.introEndSlide - 1 : 10);
  const isPostGameSlides = session.currentSlideIndex > introEndIndex;
  const isPostStopCalls = session.stopCallsShown || isPostGameSlides;
  const isTalkEnded = Boolean(session.endedAt);
  const isNegative = globalRemainingSeconds < 0;

  const countdownTitle = isTalkEnded
    ? `Talk concluso (${isNegative ? "tempo sforato di " : "tempo residuo "}${formatSecondsToMMSS(globalRemainingSeconds)})`
    : isPostStopCalls
    ? (isNegative ? `Tempo talk sforato: ${formatSecondsToMMSS(globalRemainingSeconds)}` : "Countdown fine talk")
    : "Countdown fine gioco";

  const countdownAriaLabel = isTalkEnded
    ? `Talk concluso, ${isNegative ? "tempo sforato di " : "tempo residuo "}${formatSecondsToMMSS(globalRemainingSeconds)}`
    : isPostStopCalls
    ? (isNegative ? `Tempo talk sforato: ${formatSecondsToMMSS(globalRemainingSeconds)}` : "Tempo rimanente per la fine del talk")
    : "Tempo rimanente per la fine del gioco";

  return (
    <header className={styles.topBar}>
      <div className={styles.leftSection}>
        <LogoPlaceholder />
      </div>

      <div className={styles.centerSection}>
        <SegmentedControl
          options={[
            { value: "presentation", label: "Slide" },
            { value: "game", label: "Gioco" },
          ]}
          value={currentMode}
          onChange={handleModeChange}
          ariaLabel="Passa tra modalità Slide e Gioco"
        />
      </div>

      <div className={styles.rightSection}>
        {isSessionActive && (
          <div className={styles.countdownWrapper} title={countdownTitle}>
            <ClockIcon size={20} style={{ color: "var(--color-accent)" }} />
            <span className={styles.countdownPhase}>
              {isPostStopCalls ? "Talk" : "Gioco"}
            </span>
            <CountdownDisplay
              remainingSeconds={globalRemainingSeconds}
              size="sm"
              ariaLabel={countdownAriaLabel}
              pulseOnDanger={!isTalkEnded}
            />
          </div>
        )}

        <IconButton
          aria-label={isFullscreen ? "Esci da schermo intero" : "Attiva schermo intero"}
          onClick={() => toggleFullscreen()}
          title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
        >
          {isFullscreen ? <ExitFullscreenIcon size={20} /> : <FullscreenIcon size={20} />}
        </IconButton>

        <IconButton
          aria-label="Statistiche e Analytics talk"
          onClick={() => navigate("/analytics")}
          title="Statistiche & Analytics (A)"
        >
          <AnalyticsIcon size={20} />
        </IconButton>

        {isInstallable && !isInstalled && (
          <IconButton
            aria-label="Installa app sul dispositivo"
            onClick={() => installApp()}
            title="Installa App sul dispositivo (PWA)"
          >
            <DownloadIcon size={20} />
          </IconButton>
        )}

        <IconButton
          aria-label="Impostazioni talk"
          onClick={() => navigate("/")}
          title="Configurazione talk"
        >
          <SettingsIcon size={20} />
        </IconButton>

        {onCollapse && (
          <IconButton
            aria-label="Nascondi intestazione"
            onClick={onCollapse}
            title="Nascondi intestazione (H)"
          >
            <ChevronUpIcon size={20} />
          </IconButton>
        )}
      </div>
    </header>
  );
};
