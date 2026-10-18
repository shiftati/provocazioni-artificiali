import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { ImageSlide } from "../layouts/ImageSlide";
import { useAppState } from "../../../state/AppStateContext";
import styles from "./Slide14.module.scss";

export const Slide14: FC = () => {
  const { registerSlideStepHandler, previousSlideIndex, slideAnimKey } =
    useAppState();

  // Se si naviga all'indietro da una slide successiva (slide 15 / contatti),
  // inizializziamo con entrambi i fumetti visibili (step 2)
  const isEnteredBackwards = useRef(
    typeof previousSlideIndex === "number" && previousSlideIndex > 12,
  ).current;

  // Step 0: nessun fumetto
  // Step 1: compare il 1° fumetto ("Il futuro è come ve lo creerete voi") al 1° click
  // Step 2: compare il 2° fumetto ("perciò createvelo buono!") al 2° click
  const [step, setStep] = useState<number>(() => (isEnteredBackwards ? 2 : 0));
  const stepRef = useRef<number>(step);
  stepRef.current = step;

  // Animazioni di comparsa
  const [hasForwardBubble1Entrance, setHasForwardBubble1Entrance] =
    useState<boolean>(false);
  const [isBubble1EntranceComplete, setIsBubble1EntranceComplete] =
    useState<boolean>(() => isEnteredBackwards);

  const [hasForwardBubble2Entrance, setHasForwardBubble2Entrance] =
    useState<boolean>(false);
  const [isBubble2EntranceComplete, setIsBubble2EntranceComplete] =
    useState<boolean>(() => isEnteredBackwards);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Registrazione del gestore passi:
  // - 1° click Avanti: mostra il 1° fumetto sopra la testa
  // - 2° click Avanti: mostra il 2° fumetto sotto la faccia
  // - 3° click Avanti: avanza alla slide successiva
  // - Freccia Indietro: riavvolge i fumetti uno alla volta
  useEffect(() => {
    registerSlideStepHandler({
      onNext: () => {
        if (stepRef.current === 0) {
          stepRef.current = 1;
          setStep(1);
          setHasForwardBubble1Entrance(true);
          setIsBubble1EntranceComplete(false);

          const t1 = setTimeout(() => {
            setIsBubble1EntranceComplete(true);
          }, 550);
          timersRef.current.push(t1);

          return true; // Consumato: mostra il 1° fumetto, non cambia slide
        }

        if (stepRef.current === 1) {
          stepRef.current = 2;
          setStep(2);
          setHasForwardBubble2Entrance(true);
          setIsBubble2EntranceComplete(false);

          const t2 = setTimeout(() => {
            setIsBubble2EntranceComplete(true);
          }, 550);
          timersRef.current.push(t2);

          return true; // Consumato: mostra il 2° fumetto, non cambia slide
        }

        return false; // Entrambi i fumetti sono visibili: avanza alla slide 15
      },
      onPrev: () => {
        if (stepRef.current === 2) {
          stepRef.current = 1;
          setStep(1);
          setHasForwardBubble2Entrance(false);
          setIsBubble2EntranceComplete(false);
          return true; // Consumato: nasconde il 2° fumetto, non cambia slide
        }

        if (stepRef.current === 1) {
          stepRef.current = 0;
          setStep(0);
          setHasForwardBubble1Entrance(false);
          setIsBubble1EntranceComplete(false);
          return true; // Consumato: nasconde il 1° fumetto, non cambia slide
        }

        return false; // Nessun fumetto a schermo: torna alla slide 13 precedente
      },
    });

    return () => {
      registerSlideStepHandler(null);
    };
  }, [registerSlideStepHandler]);

  // Se viene attivato il replay animazione da TopBar
  useEffect(() => {
    if (isEnteredBackwards) return;
    clearAllTimers();
    setStep(0);
    setHasForwardBubble1Entrance(false);
    setIsBubble1EntranceComplete(false);
    setHasForwardBubble2Entrance(false);
    setIsBubble2EntranceComplete(false);
  }, [slideAnimKey, isEnteredBackwards, clearAllTimers]);

  // Avanzamento manuale opzionale al click sul fumetto o container
  const handleAdvance = useCallback(() => {
    if (stepRef.current === 0) {
      stepRef.current = 1;
      setStep(1);
      setHasForwardBubble1Entrance(true);
      setIsBubble1EntranceComplete(false);
      const t1 = setTimeout(() => {
        setIsBubble1EntranceComplete(true);
      }, 550);
      timersRef.current.push(t1);
    } else if (stepRef.current === 1) {
      stepRef.current = 2;
      setStep(2);
      setHasForwardBubble2Entrance(true);
      setIsBubble2EntranceComplete(false);
      const t2 = setTimeout(() => {
        setIsBubble2EntranceComplete(true);
      }, 550);
      timersRef.current.push(t2);
    }
  }, []);

  // Classi dinamiche 1° fumetto
  const isBubble1Visible = step >= 1;
  let bubble1AnimationClass = "";
  if (isBubble1Visible) {
    if (hasForwardBubble1Entrance && !isBubble1EntranceComplete) {
      bubble1AnimationClass = styles.bubbleEntrance || "";
    } else {
      bubble1AnimationClass = styles.bubbleStatic || "";
    }
  }

  // Classi dinamiche 2° fumetto
  const isBubble2Visible = step >= 2;
  let bubble2AnimationClass = "";
  if (isBubble2Visible) {
    if (hasForwardBubble2Entrance && !isBubble2EntranceComplete) {
      bubble2AnimationClass = styles.bubbleEntrance || "";
    } else {
      bubble2AnimationClass = styles.bubbleStatic || "";
    }
  }

  return (
    <ImageSlide imageName="14-finale.jpg" title="Finale">
      <div className={styles.slideContainer}>
        {/* 1° Fumetto: "Il futuro è come ve lo creerete voi" (compare al 1° click freccia destra) */}
        {isBubble1Visible && (
          <div
            className={`${styles.speechBubble} ${styles.speechBubble1} ${bubble1AnimationClass}`}
            role="status"
            aria-live="polite"
            onClick={handleAdvance}
            title={step === 1 ? "Clicca per mostrare il seguito" : undefined}
          >
            <span className={styles.bubbleText}>
              Il futuro è come ve lo creerete voi...
            </span>
            <div className={styles.bubbleTail1} aria-hidden="true" />
          </div>
        )}

        {/* 2° Fumetto: "perciò createvelo buono!" (compare al 2° click freccia destra, sotto la faccia) */}
        {isBubble2Visible && (
          <div
            className={`${styles.speechBubble} ${styles.speechBubble2} ${bubble2AnimationClass}`}
            role="status"
            aria-live="polite"
          >
            <span className={styles.bubbleText}>
              ...perciò createvelo buono!
            </span>
            <div className={styles.bubbleTail2} aria-hidden="true" />
          </div>
        )}
      </div>
    </ImageSlide>
  );
};
