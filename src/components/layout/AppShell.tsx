import { useState, useEffect, type FC, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { StopCallsOverlay } from "../../features/stopCalls/StopCallsOverlay";
import { useWakeLock } from "../../hooks/useWakeLock";
import { appStorage } from "../../state/storage";
import { Button } from "../ui/Button";
import { RefreshIcon, ChevronDownIcon } from "../icons";
import styles from "./AppShell.module.scss";

export interface AppShellProps {
  children: ReactNode;
}

export const AppShell: FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "";
  const [swUpdateAvailable, setSwUpdateAvailable] = useState<boolean>(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState<boolean>(
    () => !appStorage.getHeaderCollapsed()
  );

  // Sync header collapse state to localStorage
  useEffect(() => {
    appStorage.saveHeaderCollapsed(!isHeaderExpanded);
  }, [isHeaderExpanded]);

  // Keep screen awake during the presentation
  useWakeLock(true);

  // Keyboard shortcut to toggle header ('h' or 'H', or Escape to collapse)
  useEffect(() => {
    if (isHome) return;

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
  }, [isHome, isHeaderExpanded]);

  useEffect(() => {
    // Listen for custom SW update event dispatched from main.tsx
    const handleUpdate = () => {
      setSwUpdateAvailable(true);
    };

    window.addEventListener("sw-update-available", handleUpdate);
    return () => window.removeEventListener("sw-update-available", handleUpdate);
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className={styles.shell}>
      {/* Collapsible header */}
      {!isHome && (
        <div
          className={`${styles.topBarWrapper} ${
            isHeaderExpanded ? styles.topBarExpanded : styles.topBarCollapsed
          }`}
          aria-hidden={!isHeaderExpanded}
        >
          <TopBar onCollapse={() => setIsHeaderExpanded(false)} />
        </div>
      )}

      {/* Discrete button in top right to expand header when hidden */}
      {!isHome && !isHeaderExpanded && (
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
          isHome || !isHeaderExpanded ? styles.mainContentFull : styles.mainContentWithHeader
        }`}
      >
        {children}
      </main>

      {/* Global "Stop alle telefonate" overlay triggers anywhere */}
      <StopCallsOverlay />

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
    </div>
  );
};
