import { useState, useEffect, useRef, useCallback, type FC, type ReactNode } from "react";
import { ImageSlide } from "../layouts/ImageSlide";
import { useAppState } from "../../../state/AppStateContext";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import type { SlideProps } from "../../../types";
import styles from "./KlippySaw.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export interface KlippySawProps extends SlideProps {
  children?: ReactNode;
  className?: string;
}

export const KlippySaw: FC<KlippySawProps> = ({ children, className }) => {
  const { previousSlideIndex, session } = useAppState();

  // Se l'utente arriva a ritroso da una slide successiva (indice > 6) in presentazione, mostra già tutto senza attendere
  const isEnteredBackwards = useRef(
    session.mode === "presentation" &&
      typeof previousSlideIndex === "number" &&
      previousSlideIndex > 6,
  ).current;

  const [hasEntered, setHasEntered] = useState<boolean>(
    () => isEnteredBackwards,
  );
  const [isEntranceComplete, setIsEntranceComplete] = useState<boolean>(
    () => isEnteredBackwards,
  );
  const [isBubbleVisible, setIsBubbleVisible] = useState<boolean>(
    () => isEnteredBackwards,
  );
  const [isBubbleEntranceComplete, setIsBubbleEntranceComplete] =
    useState<boolean>(() => isEnteredBackwards);
  const [isFlickerActive, setIsFlickerActive] = useState<boolean>(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Esegue la sequenza aggressiva e inquietante di apparizione
  const playEntranceSequence = useCallback(() => {
    clearAllTimers();

    // Reset stati iniziali per il replay
    setHasEntered(false);
    setIsEntranceComplete(false);
    setIsBubbleVisible(false);
    setIsBubbleEntranceComplete(false);
    setIsFlickerActive(false);

    // Piccolo micro-delay per garantire il re-render CSS
    const t0 = setTimeout(() => {
      // 1. Irruzione di Klippy con violento flash/strobe della stanza
      setHasEntered(true);
      setIsFlickerActive(true);

      // Spegnimento del flash stroboscopico dopo 650ms
      const tFlicker = setTimeout(() => {
        setIsFlickerActive(false);
      }, 650);
      timersRef.current.push(tFlicker);

      // Fine animazione entrata Klippy (dopo 700ms) -> transizione al twitch idle
      const tKlippyEnd = setTimeout(() => {
        setIsEntranceComplete(true);
      }, 700);
      timersRef.current.push(tKlippyEnd);

      // 2. Il fumetto scatta fuori 380ms dopo l'entrata di Klippy
      const tBubbleStart = setTimeout(() => {
        setIsBubbleVisible(true);
      }, 380);
      timersRef.current.push(tBubbleStart);

      // Fine entrata fumetto (dopo 550ms) -> transizione a statico
      const tBubbleEnd = setTimeout(() => {
        setIsBubbleEntranceComplete(true);
      }, 930);
      timersRef.current.push(tBubbleEnd);
    }, 30);

    timersRef.current.push(t0);
  }, [clearAllTimers]);

  useEffect(() => {
    if (isEnteredBackwards) return;

    // Suspense iniziale nella stanza buia di Saw: compare dopo 1.2 secondi
    const suspenseTimer = setTimeout(() => {
      playEntranceSequence();
    }, 200);

    return () => {
      clearTimeout(suspenseTimer);
      clearAllTimers();
    };
  }, [isEnteredBackwards, playEntranceSequence, clearAllTimers]);

  const klippySawUrl = useCachedAsset(
    `${BASE_URL}images/slides/klippy-saw.png`,
  );

  // Classi dinamiche Klippy
  let klippyStateClass = "";
  if (hasEntered) {
    klippyStateClass =
      (isEntranceComplete ? styles.klippyIdle : styles.klippyEntrance) || "";
  }

  // Classi dinamiche Fumetto classico come Slide 5
  let bubbleAnimationClass = "";
  if (isBubbleVisible) {
    bubbleAnimationClass =
      (isBubbleEntranceComplete
        ? styles.klippyBubbleStatic
        : styles.klippyBubbleEntrance) || "";
  }

  return (
    <ImageSlide imageName="8-gioco-saw.jpg" title="Klippy saw" className={className}>
      <div className={styles.sceneContainer}>
        {/* Overlay d'atmosfera cupa e horror flicker al momento dell'entrata */}
        <div
          className={`${styles.ambientOverlay} ${
            isFlickerActive ? styles.flickerActive : ""
          }`}
          aria-hidden="true"
        />

        {/* Klippy Saw Container - Posizionato al CENTRO */}
        <div
          className={`${styles.klippyWrapper} ${klippyStateClass}`}
          onClick={playEntranceSequence}
          title="Clicca per rigiocare l'apparizione"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              playEntranceSequence();
            }
          }}
        >
          {/* Classico fumetto bianco con testo nero identico a Slide 5 */}
          {isBubbleVisible && (
            <div
              className={`${styles.klippySpeechBubble} ${bubbleAnimationClass}`}
              role="status"
              aria-live="polite"
            >
              <span className={styles.bubbleText}>
                Voglio fare un gioco con voi
              </span>
              <div className={styles.bubbleTail} aria-hidden="true" />
            </div>
          )}

          {/* Immagine Klippy Saw */}
          <img
            src={klippySawUrl}
            alt="Klippy Saw - Voglio fare un gioco con voi"
            className={styles.klippyImage}
          />

          {/* Ombra sul pavimento */}
          <div className={styles.klippyFloorShadow} aria-hidden="true" />
        </div>
      </div>
      {children}
    </ImageSlide>
  );
};
