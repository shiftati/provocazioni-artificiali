import { useState, useRef, useEffect, type FC } from "react";
import { useAppState } from "../../../state/AppStateContext";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import styles from "./Slide05.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const Slide05: FC = () => {
  const { registerSlideStepHandler, previousSlideIndex } = useAppState();

  const bgImg = useCachedAsset(
    `${BASE_URL}images/slides/codemotion-blue-bg.png`,
  );
  const steImg = useCachedAsset(`${BASE_URL}images/slides/intro-ste.png`);
  const danielImg = useCachedAsset(`${BASE_URL}images/slides/intro-daniel.png`);
  const klippyImg = useCachedAsset(`${BASE_URL}images/slides/intro-klippy.png`);

  // Se si naviga all'indietro partendo da una slide successiva (slide 6 o oltre),
  // inizializziamo con tutti i personaggi visibili (step 2)
  const isEnteredBackwards = useRef(
    typeof previousSlideIndex === "number" && previousSlideIndex > 4,
  ).current;

  // Step 0: Ste visibile immediatamente
  // Step 1: Daniel compare al 1° click freccia destra
  // Step 2: Klippy compare al 2° click freccia destra
  // Click successivo: avanza alla slide 6
  const [step, setStep] = useState<number>(() => (isEnteredBackwards ? 2 : 0));
  const stepRef = useRef(step);
  stepRef.current = step;

  // Traccia se Klippy è comparso tramite avanzamento per attivare il bounce pop
  const [hasForwardKlippyEntrance, setHasForwardKlippyEntrance] =
    useState<boolean>(!isEnteredBackwards);

  useEffect(() => {
    registerSlideStepHandler({
      onNext: () => {
        if (stepRef.current < 2) {
          const nextStep = stepRef.current + 1;
          stepRef.current = nextStep;
          if (nextStep === 2) {
            setHasForwardKlippyEntrance(true);
          }
          setStep(nextStep);
          return true; // Consumato: non cambia slide
        }
        return false; // Tutti i personaggi sono entrati: cambia slide (avanza a slide 6)
      },
      onPrev: () => {
        if (stepRef.current > 0) {
          const prevStep = stepRef.current - 1;
          stepRef.current = prevStep;
          setStep(prevStep);
          return true; // Consumato: non cambia slide
        }
        return false; // Solo Ste a schermo: torna alla slide 4 precedente
      },
    });

    return () => {
      registerSlideStepHandler(null);
    };
  }, [registerSlideStepHandler]);

  const isDanielVisible = step >= 1;
  const isKlippyVisible = step >= 2;

  // Determina la classe di animazione per Klippy: bounce se entrato in avanti, idle se entrato tornando indietro
  const klippyAnimationClass = isKlippyVisible
    ? hasForwardKlippyEntrance
      ? styles.klippyVisible
      : styles.klippyVisibleIdleOnly
    : "";

  return (
    <div
      className={styles.slideContainer}
      style={{ backgroundImage: `url("${bgImg}")` }}
      role="region"
      aria-label="Slide 5 - Daniel e Ste"
    >
      {/* 1. In basso a sinistra: Stefano (intro-ste.png) - compare immediatamente all'apertura della slide */}
      <img
        src={steImg}
        alt="Stefano Bruno"
        className={`${styles.speakerLeft} ${
          isEnteredBackwards
            ? styles.speakerLeftStatic
            : styles.speakerLeftEntrance
        }`}
      />

      {/* Freccia indicatore per Stefano */}
      <div
        className={`${styles.indicatorStefano} ${
          isEnteredBackwards
            ? styles.indicatorStatic
            : styles.indicatorEntrance
        }`}
        aria-hidden="true"
      >
        <span className={styles.indicatorBadge}>Stefano</span>
        <svg
          className={styles.indicatorArrow}
          width="48"
          height="54"
          viewBox="0 0 42 48"
          fill="none"
        >
          <path
            d="M16 0H26V24H38L21 44L4 24H16V0Z"
            fill="#ffd100"
            stroke="#071526"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 2. In basso a destra: Daniel (intro-daniel.png) - compare al primo click avanti */}
      <img
        src={danielImg}
        alt="Daniel Zotti"
        className={`${styles.speakerRight} ${isDanielVisible ? styles.speakerRightVisible : ""}`}
      />

      {/* Freccia indicatore per Daniel */}
      {isDanielVisible && (
        <div
          className={`${styles.indicatorDaniel} ${
            isEnteredBackwards && step === 2
              ? styles.indicatorStatic
              : styles.indicatorEntrance
          }`}
          aria-hidden="true"
        >
          <span className={styles.indicatorBadge}>Daniel</span>
          <svg
            className={styles.indicatorArrow}
            width="48"
            height="54"
            viewBox="0 0 42 48"
            fill="none"
          >
            <path
              d="M16 0H26V24H38L21 44L4 24H16V0Z"
              fill="#ffd100"
              stroke="#071526"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* 3. Graffetta (Klippy): al centro dal basso - compare al secondo click avanti */}
      <div className={`${styles.klippyWrapper} ${klippyAnimationClass}`}>
        {isKlippyVisible && (
          <div
            className={`${styles.klippySpeechBubble} ${
              hasForwardKlippyEntrance
                ? styles.klippyBubbleEntrance
                : styles.klippyBubbleStatic
            }`}
          >
            <span className={styles.bubbleText}>...e io sono Klippy!</span>
            <div className={styles.bubbleTail} aria-hidden="true" />
          </div>
        )}
        <img
          src={klippyImg}
          alt="Klippy la graffetta"
          className={styles.klippyImg}
        />
        <div className={styles.klippyFloorShadow} aria-hidden="true" />
      </div>
    </div>
  );
};
