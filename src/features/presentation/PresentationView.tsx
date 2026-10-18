import { useCallback, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Stage } from "../../components/layout/Stage";
import { SLIDES } from "./slides.registry";
import { useAppState } from "../../state/AppStateContext";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { IconButton } from "../../components/ui/IconButton";
import { ArrowLeftIcon, ArrowRightIcon, FinishIcon } from "../../components/icons";
import styles from "./PresentationView.module.scss";

export const PresentationView: FC = () => {
  const navigate = useNavigate();
  const {
    session,
    config,
    setSlideIndex,
    setMode,
    endTalk,
    stopCallsOverlayOpen,
    slideAnimKey,
    navOnSlide,
    stepForward,
    stepBackward,
    hasPendingSlideAnimations,
  } = useAppState();

  const totalSlides = SLIDES.length;
  // Ensure index is within range
  const currentIndex = Math.min(Math.max(0, session.currentSlideIndex), totalSlides - 1);
  const introEndSlideIndex = (config.introEndSlide ? config.introEndSlide - 1 : 10);
  const isIntroEndSlide = currentIndex === introEndSlideIndex;
  const isLastSlide = currentIndex === totalSlides - 1;
  const showFinishButton = isLastSlide && !hasPendingSlideAnimations;

  // Finalize session and navigate to analytics
  const handleEndSession = useCallback(() => {
    endTalk();
    navigate("/analytics");
  }, [endTalk, navigate]);

  // On-screen "Avanti" button: on introEndSlide advances to next slide; on last slide finishes session
  const handleOnScreenNext = useCallback(() => {
    if (stepForward()) {
      return;
    }

    if (isLastSlide) {
      handleEndSession();
      return;
    }

    if (currentIndex < totalSlides - 1) {
      setSlideIndex(currentIndex + 1);
    }
  }, [stepForward, isLastSlide, handleEndSession, currentIndex, totalSlides, setSlideIndex]);

  // Keyboard "Next" (Right arrow / Space / PageDown): on introEndSlide enters GAME mode; on other slides advances
  const handleKeyboardNext = useCallback(() => {
    if (stepForward()) {
      return;
    }

    if (isIntroEndSlide) {
      setMode("game");
      navigate("/game");
      return;
    }

    if (isLastSlide) {
      handleEndSession();
      return;
    }

    if (currentIndex < totalSlides - 1) {
      setSlideIndex(currentIndex + 1);
    }
  }, [stepForward, isIntroEndSlide, isLastSlide, handleEndSession, currentIndex, totalSlides, setSlideIndex, setMode, navigate]);

  const handlePrev = useCallback(() => {
    if (stepBackward()) {
      return;
    }

    if (currentIndex > 0) {
      setSlideIndex(currentIndex - 1);
    }
  }, [stepBackward, currentIndex, setSlideIndex]);

  // Keyboard navigation
  useKeyboardNavigation({
    onNext: handleKeyboardNext,
    onPrev: handlePrev,
    enabled: !stopCallsOverlayOpen,
  });

  const currentSlide = SLIDES[currentIndex] ?? SLIDES[0];
  const SlideComponent = currentSlide ? currentSlide.component : () => null;

  return (
    <div className={styles.wrapper}>
      <Stage>
        <SlideComponent key={`${currentIndex}-${slideAnimKey}`} />
      </Stage>

      {/* Discrete bottom navigation controls */}
      {!stopCallsOverlayOpen && navOnSlide && (
        <nav className={styles.navControls} aria-label="Controlli slide">
          <IconButton
            aria-label="Slide precedente"
            size="md"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            title="Slide precedente (Freccia Sinistra / PageUp)"
          >
            <ArrowLeftIcon size={20} />
          </IconButton>

          <span className={styles.slideCounter} aria-live="polite">
            {currentIndex + 1} / {totalSlides}
          </span>

          {showFinishButton ? (
            <IconButton
              aria-label="Concludi talk e sessione"
              size="md"
              onClick={handleEndSession}
              title="Concludi sessione talk"
              style={{ color: "var(--color-mint)" }}
            >
              <FinishIcon size={22} />
            </IconButton>
          ) : (
            <IconButton
              aria-label="Slide successiva"
              size="md"
              onClick={handleOnScreenNext}
              title="Slide successiva (Pulsante a video avanza alla slide successiva)"
            >
              <ArrowRightIcon size={20} />
            </IconButton>
          )}
        </nav>
      )}
    </div>
  );
};
