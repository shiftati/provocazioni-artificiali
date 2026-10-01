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
  const { globalRemainingSeconds, setMode } = useAppState();
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
        <div className={styles.countdownWrapper} title="Countdown fine talk">
          <ClockIcon size={20} style={{ color: "var(--color-accent)" }} />
          <CountdownDisplay
            remainingSeconds={globalRemainingSeconds}
            size="sm"
            ariaLabel="Tempo totale rimanente per il talk"
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
