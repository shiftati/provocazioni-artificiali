import { useEffect, type FC } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ArrowRightIcon } from "../../components/icons";
import { useAppState } from "../../state/AppStateContext";
import styles from "./StopCallsOverlay.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const STOP_CALLS_BG = `${BASE_URL}images/stop-alle-telefonate.jpg`;

export const StopCallsOverlay: FC = () => {
  const { session: _session, stopCallsOverlayOpen, closeStopCallsOverlay, isSessionActive } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  const handleProceed = () => {
    closeStopCallsOverlay();
    navigate("/presentation");
  };

  useEffect(() => {
    if (!stopCallsOverlayOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight") {
        event.preventDefault();
        handleProceed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stopCallsOverlayOpen]);

  const isExcludedRoute =
    location.pathname === "/" ||
    location.pathname === "" ||
    location.pathname.startsWith("/replay");
  if (!stopCallsOverlayOpen || !isSessionActive || isExcludedRoute) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="stop-calls-title"
      className={styles.overlay}
      style={{ backgroundImage: `url("${STOP_CALLS_BG}")` }}
    >
      <div className={styles.modalContent}>
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
    </div>
  );
};
