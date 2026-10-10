import { useCallback, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Stage } from "../../components/layout/Stage";
import { SLIDES } from "./slides.registry";
import { useAppState } from "../../state/AppStateContext";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { IconButton } from "../../components/ui/IconButton";
import { ArrowLeftIcon, ArrowRightIcon } from "../../components/icons";
import styles from "./PresentationView.module.scss";

export const PresentationView: FC = () => {
  const navigate = useNavigate();
  const { session, setSlideIndex, setMode, stopCallsOverlayOpen } = useAppState();

  const totalSlides = SLIDES.length;
  // Ensure index is within range
  const currentIndex = Math.min(Math.max(0, session.currentSlideIndex), totalSlides - 1);
  const isSlide11 = currentIndex === 10 || SLIDES[currentIndex]?.id === "klippy-matrix";

  const handleNext = useCallback(() => {
    if (isSlide11) {
      setMode("game");
      navigate("/game");
      return;
    }

    if (currentIndex < totalSlides - 1) {
      setSlideIndex(currentIndex + 1);
    }
  }, [isSlide11, currentIndex, totalSlides, setSlideIndex, setMode, navigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setSlideIndex(currentIndex - 1);
    }
  }, [currentIndex, setSlideIndex]);

  // Disable keyboard navigation if Stop Calls overlay is active
  useKeyboardNavigation({
    onNext: handleNext,
    onPrev: handlePrev,
    enabled: !stopCallsOverlayOpen,
  });

  const currentSlide = SLIDES[currentIndex] ?? SLIDES[0];
  const SlideComponent = currentSlide ? currentSlide.component : () => null;

  return (
    <div className={styles.wrapper}>
      <Stage>
        <SlideComponent />
      </Stage>

      {/* Discrete bottom navigation controls */}
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

        <IconButton
          aria-label={isSlide11 ? "Passa al Gioco" : "Slide successiva"}
          size="md"
          onClick={handleNext}
          disabled={currentIndex === totalSlides - 1}
          title={
            isSlide11
              ? "Passa alla modalità Gioco (Freccia Destra / Spazio / PageDown)"
              : "Slide successiva (Freccia Destra / Spazio / PageDown)"
          }
        >
          <ArrowRightIcon size={20} />
        </IconButton>
      </nav>

    </div>
  );
};
