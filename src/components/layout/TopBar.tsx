import type { FC } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogoPlaceholder } from "./LogoPlaceholder";
import { CountdownDisplay } from "../ui/CountdownDisplay";
import { IconButton } from "../ui/IconButton";
import {
  FullscreenIcon,
  ExitFullscreenIcon,
  SettingsIcon,
  ClockIcon,
  ChevronUpIcon,
  AnalyticsIcon,
  // DownloadIcon,
  RefreshIcon,
  SlidesIcon,
  GameIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FinishIcon,
  NavOnSlideIcon,
  NavInHeaderIcon,
} from "../icons";
import { useAppState } from "../../state/AppStateContext";
import { useFullscreen } from "../../hooks/useFullscreen";
// import { usePwaInstall } from "../../hooks/usePwaInstall";
import { SLIDES } from "../../features/presentation/slides.registry";
import { formatSecondsToMMSS } from "../../utils/time";
import styles from "./TopBar.module.scss";

export interface TopBarProps {
  onCollapse?: () => void;
}

export const TopBar: FC<TopBarProps> = ({ onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    globalRemainingSeconds,
    session,
    config,
    setMode,
    isSessionActive,
    theme,
    setTheme,
    replaySlideAnimation,
    navOnSlide,
    setNavOnSlide,
    setSlideIndex,
    endTalk,
  } = useAppState();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  // const { isInstallable, isInstalled, installApp } = usePwaInstall();

  const isPresentation = location.pathname === "/presentation";
  const isGame = location.pathname === "/game";
  const isAnalytics = location.pathname === "/analytics";
  const isHome = location.pathname === "/";

  const handleModeChange = (mode: "presentation" | "game") => {
    setMode(mode);
    if (mode === "game") {
      navigate("/game");
    } else {
      navigate("/presentation");
    }
  };

  const introEndIndex = config.introEndSlide ? config.introEndSlide - 1 : 10;
  const isPostGameSlides = session.currentSlideIndex > introEndIndex;
  const isPostStopCalls = session.stopCallsShown || isPostGameSlides;
  const isTalkEnded = Boolean(session.endedAt);
  const isNegative = globalRemainingSeconds < 0;

  const countdownTitle = isTalkEnded
    ? `Talk concluso (${isNegative ? "tempo sforato di " : "tempo residuo "}${formatSecondsToMMSS(globalRemainingSeconds)})`
    : isPostStopCalls
      ? isNegative
        ? `Tempo talk sforato: ${formatSecondsToMMSS(globalRemainingSeconds)}`
        : "Countdown fine talk"
      : "Countdown fine gioco";

  const countdownAriaLabel = isTalkEnded
    ? `Talk concluso, ${isNegative ? "tempo sforato di " : "tempo residuo "}${formatSecondsToMMSS(globalRemainingSeconds)}`
    : isPostStopCalls
      ? isNegative
        ? `Tempo talk sforato: ${formatSecondsToMMSS(globalRemainingSeconds)}`
        : "Tempo rimanente per la fine del talk"
      : "Tempo rimanente per la fine del gioco";

  const totalSlides = SLIDES.length;
  const currentIndex = Math.min(
    Math.max(0, session.currentSlideIndex),
    totalSlides - 1
  );
  const isLastSlide = currentIndex === totalSlides - 1;

  const handleHeaderPrev = () => {
    if (!isPresentation) {
      setMode("presentation");
      navigate("/presentation");
    }
    if (currentIndex > 0) {
      setSlideIndex(currentIndex - 1);
    }
  };

  const handleHeaderNext = () => {
    if (!isPresentation) {
      setMode("presentation");
      navigate("/presentation");
    }
    if (isLastSlide) {
      endTalk();
      navigate("/analytics");
      return;
    }
    if (currentIndex < totalSlides - 1) {
      setSlideIndex(currentIndex + 1);
    }
  };

  const handleHeaderEndSession = () => {
    endTalk();
    navigate("/analytics");
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.leftSection}>
        <LogoPlaceholder />
      </div>

      <div className={styles.centerSection}>
        {!navOnSlide && (
          <div
            className={`${styles.compactNavControls} ${
              !isPresentation ? styles.compactNavControlsDisabled : ""
            }`}
            role="group"
            aria-label="Controlli slide nell'intestazione"
          >
            <IconButton
              aria-label="Slide precedente"
              size="sm"
              onClick={handleHeaderPrev}
              disabled={!isPresentation || currentIndex === 0}
              title={
                !isPresentation
                  ? "Disponibile solo in modalità slide"
                  : "Slide precedente"
              }
              className={styles.compactNavBtn}
            >
              <ArrowLeftIcon size={16} />
            </IconButton>

            <span className={styles.compactSlideCounter} aria-live="polite">
              {currentIndex + 1} / {totalSlides}
            </span>

            {isLastSlide ? (
              <IconButton
                aria-label="Concludi talk e sessione"
                size="sm"
                onClick={handleHeaderEndSession}
                disabled={!isPresentation}
                title={
                  !isPresentation
                    ? "Disponibile solo in modalità slide"
                    : "Concludi sessione talk"
                }
                className={styles.compactNavBtn}
                style={{ color: "var(--color-mint)" }}
              >
                <FinishIcon size={18} />
              </IconButton>
            ) : (
              <IconButton
                aria-label="Slide successiva"
                size="sm"
                onClick={handleHeaderNext}
                disabled={!isPresentation || currentIndex === totalSlides - 1}
                title={
                  !isPresentation
                    ? "Disponibile solo in modalità slide"
                    : "Slide successiva"
                }
                className={styles.compactNavBtn}
              >
                <ArrowRightIcon size={16} />
              </IconButton>
            )}
          </div>
        )}
        <IconButton
          aria-label="Riesegui animazione slide"
          onClick={replaySlideAnimation}
          disabled={!isPresentation}
          title={
            isPresentation
              ? "Riesegui animazione slide"
              : "Disponibile solo in modalità slide"
          }
          className={styles.topBarBtn}
        >
          <RefreshIcon size={20} />
        </IconButton>
        <IconButton
          aria-label="Modalità Slide"
          isActive={isPresentation}
          onClick={() => handleModeChange("presentation")}
          title="Modalità Slide"
          className={styles.topBarBtn}
        >
          <SlidesIcon size={20} />
        </IconButton>
        <IconButton
          aria-label="Modalità Gioco"
          isActive={isGame}
          onClick={() => handleModeChange("game")}
          title="Modalità Gioco"
          className={styles.topBarBtn}
        >
          <GameIcon size={20} />
        </IconButton>
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
          aria-label={
            navOnSlide
              ? "Sposta frecce nell'intestazione"
              : "Sposta frecce sopra la slide"
          }
          onClick={() => setNavOnSlide(!navOnSlide)}
          title={
            navOnSlide
              ? "Frecce sopra la slide (clicca per spostarle nell'intestazione)"
              : "Frecce nell'intestazione (clicca per spostarle sopra la slide)"
          }
          className={styles.topBarBtn}
        >
          {navOnSlide ? (
            <NavOnSlideIcon size={20} />
          ) : (
            <NavInHeaderIcon size={20} />
          )}
        </IconButton>

        <IconButton
          aria-label={
            isFullscreen ? "Esci da schermo intero" : "Attiva schermo intero"
          }
          onClick={() => toggleFullscreen()}
          title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
          className={`${styles.topBarBtn} ${styles.fullscreenBtn}`}
        >
          {isFullscreen ? (
            <ExitFullscreenIcon size={20} />
          ) : (
            <FullscreenIcon size={20} />
          )}
        </IconButton>

        <IconButton
          aria-label={
            theme === "dark" ? "Passa a tema chiaro" : "Passa a tema scuro"
          }
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={
            theme === "dark" ? "Passa a tema chiaro" : "Passa a tema scuro"
          }
          className={styles.topBarBtn}
        >
          {theme === "dark" ? <SunIcon size={20} /> : <MoonIcon size={20} />}
        </IconButton>

        <IconButton
          aria-label="Statistiche e Analytics talk"
          isActive={isAnalytics}
          onClick={() => navigate("/analytics")}
          title="Statistiche & Analytics (A)"
          className={styles.topBarBtn}
        >
          <AnalyticsIcon size={20} />
        </IconButton>

        <IconButton
          aria-label="Impostazioni talk"
          isActive={isHome}
          onClick={() => navigate("/")}
          title="Configurazione talk"
          className={styles.topBarBtn}
        >
          <SettingsIcon size={20} />
        </IconButton>

        {onCollapse && (
          <IconButton
            aria-label="Nascondi intestazione"
            onClick={onCollapse}
            title="Nascondi intestazione (H)"
            className={`${styles.topBarBtn} ${styles.collapseBtn}`}
          >
            <ChevronUpIcon size={20} />
          </IconButton>
        )}
      </div>
    </header>
  );
};
