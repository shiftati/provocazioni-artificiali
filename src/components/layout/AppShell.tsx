import { useState, useEffect, useRef, type FC, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { StopCallsOverlay } from "../../features/stopCalls/StopCallsOverlay";
import { useWakeLock } from "../../hooks/useWakeLock";
import { appStorage } from "../../state/storage";
import { useAppState } from "../../state/AppStateContext";
import { SLIDES } from "../../features/presentation/slides.registry";
import { PROVOCATIONS, PROVOCATION_MAP } from "../../features/game/provocations.registry";
import { Button } from "../ui/Button";
import { RefreshIcon, ChevronDownIcon } from "../icons";
import styles from "./AppShell.module.scss";

export interface AppShellProps {
  children: ReactNode;
}

export const AppShell: FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "";
  const { isSessionActive, logSessionEvent, session, game } = useAppState();
  const [swUpdateAvailable, setSwUpdateAvailable] = useState<boolean>(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState<boolean>(
    () => !appStorage.getHeaderCollapsed()
  );

  // Track route navigation events during an active session
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const prev = prevPathRef.current;
    const current = location.pathname;
    prevPathRef.current = current;

    if (!isSessionActive || prev === current) return;

    if (current === "/analytics") {
      logSessionEvent("NAVIGATION", "Passo a pagina analytics", { path: "/analytics" });
    } else if (current === "/" || current === "") {
      logSessionEvent("NAVIGATION", "Passo a schermata configurazione talk", { path: "/" });
    } else if ((prev === "/analytics" || prev === "/" || prev === "") && current === "/presentation") {
      const slideIdx = session.currentSlideIndex;
      const slideTitle = SLIDES[slideIdx]?.title;
      logSessionEvent(
        "NAVIGATION",
        `Passo a modalità slide (e sono su slide ${slideIdx + 1}${slideTitle ? `: "${slideTitle}"` : ""})`,
        {
          path: "/presentation",
          slideIndex: slideIdx,
          slideNumber: slideIdx + 1,
          slideTitle,
        }
      );
    } else if ((prev === "/analytics" || prev === "/" || prev === "") && current === "/game") {
      const currentProvId = game.currentProvocationId;
      if (currentProvId) {
        const provIdx = PROVOCATIONS.findIndex((p) => p.id === currentProvId);
        const provNum = provIdx >= 0 ? provIdx + 1 : 1;
        const provTitle = PROVOCATION_MAP.get(currentProvId)?.title;
        logSessionEvent(
          "NAVIGATION",
          `Passo a modalità gioco (e mostro provocazione numero ${provNum}${provTitle ? `: "${provTitle}"` : ""})`,
          {
            path: "/game",
            provocationId: currentProvId,
            provocationNumber: provNum,
            provocationTitle: provTitle,
          }
        );
      } else {
        logSessionEvent("NAVIGATION", "Passo a modalità gioco", { path: "/game" });
      }
    }
  }, [location.pathname, isSessionActive, logSessionEvent, session.currentSlideIndex, game.currentProvocationId]);

  // Sync header collapse state to localStorage
  useEffect(() => {
    appStorage.saveHeaderCollapsed(!isHeaderExpanded);
  }, [isHeaderExpanded]);

  // Keep screen awake during the presentation
  useWakeLock(true);

  // Keyboard shortcut to toggle header ('h' or 'H', or Escape to collapse)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        setIsHeaderExpanded((prev) => !prev);
      } else if (event.key === "Escape" && isHeaderExpanded) {
        event.preventDefault();
        setIsHeaderExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHeaderExpanded]);

  const [offlineToastVisible, setOfflineToastVisible] = useState(false);

  useEffect(() => {
    // Listen for custom SW update event dispatched from main.tsx
    const handleUpdate = () => {
      setSwUpdateAvailable(true);
    };

    const handleOfflineReady = () => {
      setOfflineToastVisible(true);
      const timer = setTimeout(() => {
        setOfflineToastVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("sw-update-available", handleUpdate);
    window.addEventListener("sw-offline-ready", handleOfflineReady);
    return () => {
      window.removeEventListener("sw-update-available", handleUpdate);
      window.removeEventListener("sw-offline-ready", handleOfflineReady);
    };
  }, []);

  const handleReload = () => {
    const updateSW = (
      window as unknown as { __updateSW?: (reloadPage?: boolean) => Promise<void> }
    ).__updateSW;
    if (updateSW) {
      updateSW(true);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className={styles.shell}>
      {/* Collapsible header */}
      <div
        className={`${styles.topBarWrapper} ${
          isHeaderExpanded ? styles.topBarExpanded : styles.topBarCollapsed
        }`}
        aria-hidden={!isHeaderExpanded}
      >
        <TopBar onCollapse={() => setIsHeaderExpanded(false)} />
      </div>

      {/* Discrete button in top right to expand header when hidden */}
      {!isHeaderExpanded && (
        <button
          type="button"
          className={styles.expandHeaderButton}
          onClick={() => setIsHeaderExpanded(true)}
          aria-label="Espandi intestazione"
          title="Espandi intestazione (H)"
        >
          <ChevronDownIcon size={18} />
        </button>
      )}

      <main
        className={`${styles.mainContent} ${
          !isHeaderExpanded ? styles.mainContentFull : styles.mainContentWithHeader
        }`}
      >
        {children}
      </main>

      {/* Global "Stop alle telefonate" overlay triggers during presentation/game */}
      {!isHome && <StopCallsOverlay />}

      {/* Offline PWA update banner */}
      {swUpdateAvailable && (
        <aside className={styles.updateBanner} role="status">
          <span>Nuova versione disponibile</span>
          <Button
            variant="primary"
            size="md"
            onClick={handleReload}
            leftIcon={<RefreshIcon size={18} />}
          >
            Aggiorna
          </Button>
        </aside>
      )}

      {/* Offline readiness notification */}
      {offlineToastVisible && (
        <aside className={styles.offlineReadyBanner} role="status">
          <span>✅ App salvata in cache: funziona anche offline senza connessione</span>
          <button
            type="button"
            className={styles.dismissToastButton}
            onClick={() => setOfflineToastVisible(false)}
            aria-label="Chiudi notifica"
          >
            ✕
          </button>
        </aside>
      )}
    </div>
  );
};
