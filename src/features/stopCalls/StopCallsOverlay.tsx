import { useEffect, useCallback, type FC } from "react";
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

  const handleProceed = useCallback(() => {
    closeStopCallsOverlay();
    navigate("/presentation");
  }, [closeStopCallsOverlay, navigate]);

  const isExcludedRoute =
    location.pathname === "/" ||
    location.pathname === "" ||
    location.pathname.startsWith("/replay");

  useEffect(() => {
    if (!stopCallsOverlayOpen || !isSessionActive || isExcludedRoute) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowRight" ||
        event.key === "PageDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        event.stopPropagation();
        handleProceed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stopCallsOverlayOpen, isSessionActive, isExcludedRoute, handleProceed]);

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
