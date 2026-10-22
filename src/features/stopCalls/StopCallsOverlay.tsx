import { useEffect, useCallback, type FC } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ArrowRightIcon } from "../../components/icons";
import { useAppState } from "../../state/AppStateContext";
import { useCachedAsset } from "../../hooks/useCachedAsset";
import styles from "./StopCallsOverlay.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const STOP_CALLS_BG = `${BASE_URL}images/stop-alle-telefonate.webp`;

export const StopCallsOverlay: FC = () => {
  const { session, stopCallsOverlayOpen, closeStopCallsOverlay, isSessionActive } = useAppState();
  const bgUrl = useCachedAsset(STOP_CALLS_BG);
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

  const isGameRoute = location.pathname === "/game";
  const shouldShowOnGame =
    isGameRoute && Boolean(session.stopCallsShown) && isSessionActive && !session.endedAt;

  const isVisible =
    (stopCallsOverlayOpen || shouldShowOnGame) &&
    isSessionActive &&
    !session.endedAt &&
    !isExcludedRoute;

  useEffect(() => {
    if (!isVisible) return;

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
  }, [isVisible, handleProceed]);

  if (!isVisible) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="stop-calls-title"
      className={styles.overlay}
      style={{ backgroundImage: `url("${bgUrl}")` }}
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
