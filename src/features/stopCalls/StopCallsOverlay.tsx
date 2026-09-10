import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { PhoneOffIcon, ArrowRightIcon } from "../../components/icons";
import { useAppState } from "../../state/AppStateContext";
import styles from "./StopCallsOverlay.module.scss";

export const StopCallsOverlay: FC = () => {
  const { stopCallsOverlayOpen, closeStopCallsOverlay } = useAppState();
  const navigate = useNavigate();

  if (!stopCallsOverlayOpen) return null;

  const handleProceed = () => {
    closeStopCallsOverlay();
    navigate("/presentation");
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="stop-calls-title"
      className={styles.overlay}
    >
      <div className={styles.iconWrapper} aria-hidden="true">
        <PhoneOffIcon size={96} />
      </div>

      <h1 id="stop-calls-title" className={styles.title}>
        Stop alle <span className={styles.highlight}>telefonate!</span>
      </h1>

      <p className={styles.subtitle}>
        Il tempo a disposizione per le discussioni è terminato. È il momento di tirare le fila e scoprire il verdetto della sala.
      </p>

      <Button
        variant="primary"
        size="xl"
        onClick={handleProceed}
        rightIcon={<ArrowRightIcon size={28} />}
        className={styles.actionButton}
      >
        Prosegui
      </Button>
    </div>
  );
};
