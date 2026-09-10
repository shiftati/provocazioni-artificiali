import { useState, useEffect, type FC, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { StopCallsOverlay } from "../../features/stopCalls/StopCallsOverlay";
import { useWakeLock } from "../../hooks/useWakeLock";
import { Button } from "../ui/Button";
import { RefreshIcon } from "../icons";
import styles from "./AppShell.module.scss";

export interface AppShellProps {
  children: ReactNode;
}

export const AppShell: FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "";
  const [swUpdateAvailable, setSwUpdateAvailable] = useState<boolean>(false);

  // Keep screen awake during the presentation
  useWakeLock(true);

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
      {!isHome && <TopBar />}

      <main
        className={`${styles.mainContent} ${isHome ? styles.mainContentFull : ""}`}
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
