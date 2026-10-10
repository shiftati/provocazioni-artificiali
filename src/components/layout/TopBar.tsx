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
} from "../icons";
import { useAppState } from "../../state/AppStateContext";
import { useFullscreen } from "../../hooks/useFullscreen";
import styles from "./TopBar.module.scss";

export interface TopBarProps {
  onCollapse?: () => void;
}

export const TopBar: FC<TopBarProps> = ({ onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { globalRemainingSeconds, session, setMode } = useAppState();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const currentMode = location.pathname.includes("/game") ? "game" : "presentation";

  const handleModeChange = (mode: "presentation" | "game") => {
    setMode(mode);
    if (mode === "game") {
      navigate("/game");
    } else {
      navigate("/presentation");
    }
  };

  const isPostStopCalls = session.stopCallsShown;
  const countdownTitle = isPostStopCalls ? "Countdown fine talk" : "Countdown fine gioco";
  const countdownAriaLabel = isPostStopCalls
    ? "Tempo rimanente per la fine del talk"
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
        <div className={styles.countdownWrapper} title={countdownTitle}>
          <ClockIcon size={20} style={{ color: "var(--color-accent)" }} />
          <span className={styles.countdownPhase}>
            {isPostStopCalls ? "Talk" : "Gioco"}
          </span>
          <CountdownDisplay
            remainingSeconds={globalRemainingSeconds}
            size="sm"
            ariaLabel={countdownAriaLabel}
          />
        </div>

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
