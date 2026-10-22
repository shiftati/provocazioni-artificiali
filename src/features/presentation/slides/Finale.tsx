import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { ImageSlide } from "../layouts/ImageSlide";
import { useAppState } from "../../../state/AppStateContext";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import { PlayIcon, PauseIcon, StopIcon } from "../../../components/icons";
import type { SlideProps } from "../../../types";
import styles from "./Finale.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const Finale: FC<SlideProps> = ({ step: stepProp, isReplay = false }) => {
  const {
    registerSlideStepHandler,
    previousSlideIndex,
    slideAnimKey,
    setHasPendingSlideAnimations,
  } = useAppState();

  const audioSrc = useCachedAsset(`${BASE_URL}audio/back-to-the-future_short.mp3`);
  const qrSrc = useCachedAsset(`${BASE_URL}images/qr-shiftati.svg`);

  // Se si naviga all'indietro da una slide successiva (se presente),
  // inizializziamo con entrambi i fumetti e la card visibili (step 2)
  const isEnteredBackwards = useRef(
    !isReplay && typeof previousSlideIndex === "number" && previousSlideIndex > 12,
  ).current;

  // Step 0: nessun fumetto
  // Step 1: compare il 1° fumetto ("Il futuro è come ve lo creerete voi...") al 1° click
  // Step 2: compare il 2° fumetto ("...perciò createvelo buono!") al 2° click + parte audio BTTF
  //         + dopo 5s compare la card "Grazie!" con QR code a sinistra
  const [localStep, setLocalStep] = useState<number>(() => (isEnteredBackwards ? 2 : 0));
  const stepRef = useRef<number>(localStep);
  stepRef.current = localStep;

  const currentStep = stepProp !== undefined ? stepProp : localStep;

  // Animazioni di comparsa fumetti
  const [hasForwardBubble1Entrance, setHasForwardBubble1Entrance] =
    useState<boolean>(false);
  const [isBubble1EntranceComplete, setIsBubble1EntranceComplete] =
    useState<boolean>(() => isEnteredBackwards);

  const [hasForwardBubble2Entrance, setHasForwardBubble2Entrance] =
    useState<boolean>(false);
  const [isBubble2EntranceComplete, setIsBubble2EntranceComplete] =
    useState<boolean>(() => isEnteredBackwards);

  // Stato e animazione card "Grazie!" con QR code
  const [isCardVisible, setIsCardVisible] = useState<boolean>(
    () => isEnteredBackwards,
  );
  const isCardVisibleRef = useRef<boolean>(isCardVisible);
  isCardVisibleRef.current = isCardVisible;

  const [hasForwardCardEntrance, setHasForwardCardEntrance] =
    useState<boolean>(false);
  const [isCardEntranceComplete, setIsCardEntranceComplete] = useState<boolean>(
    () => isEnteredBackwards,
  );

  // All'inizio indichiamo che ci sono animazioni in sospeso
  useEffect(() => {
    setHasPendingSlideAnimations(!isEnteredBackwards);
  }, [isEnteredBackwards, setHasPendingSlideAnimations]);

  // Audio background
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const playBttfAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.8;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Autoplay was prevented by browser policy:", err);
          setIsPlaying(false);
        });
    }
  }, []);

  const stopBttfAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const handleStart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Audio play error:", err));
    }
  }, []);

  const handlePause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleStop = useCallback(() => {
    stopBttfAudio();
  }, [stopBttfAudio]);

  const revealCardImmediately = useCallback(() => {
    clearAllTimers();
    setIsCardVisible(true);
    isCardVisibleRef.current = true;
    setHasForwardCardEntrance(true);
    setIsCardEntranceComplete(false);
    setHasPendingSlideAnimations(false);

    const tCardEnd = setTimeout(() => {
      setIsCardEntranceComplete(true);
    }, 600);
    timersRef.current.push(tCardEnd);
  }, [clearAllTimers, setHasPendingSlideAnimations]);

  // Sequenza attivata al 2° step:
  // 1. Mostra il 2° fumetto
  // 2. Avvia la canzone di Ritorno al Futuro
  // 3. Dopo 5 secondi fa comparire la card "Grazie!" con link e QR Code a sinistra
  const triggerStep2Sequence = useCallback(() => {
    stepRef.current = 2;
    setLocalStep(2);
    setHasForwardBubble2Entrance(true);
    setIsBubble2EntranceComplete(false);
    setHasPendingSlideAnimations(true);

    const t2 = setTimeout(() => {
      setIsBubble2EntranceComplete(true);
    }, 550);
    timersRef.current.push(t2);

    // Canzone di Ritorno al Futuro
    playBttfAudio();

    // Comparsa card dopo 5 secondi
    const tCard = setTimeout(() => {
      setIsCardVisible(true);
      isCardVisibleRef.current = true;
      setHasForwardCardEntrance(true);
      setIsCardEntranceComplete(false);
      setHasPendingSlideAnimations(false);

      const tCardEnd = setTimeout(() => {
        setIsCardEntranceComplete(true);
      }, 600);
      timersRef.current.push(tCardEnd);
    }, 5000);
    timersRef.current.push(tCard);
  }, [playBttfAudio, setHasPendingSlideAnimations]);

  // Registrazione del gestore passi:
  // - 1° click Avanti: mostra il 1° fumetto sopra la testa
  // - 2° click Avanti: mostra il 2° fumetto + musica BTTF + card dopo 5s
  // - Freccia Indietro: riavvolge i passi
  useEffect(() => {
    if (isReplay) return;

    registerSlideStepHandler({
      onNext: () => {
        if (stepRef.current === 0) {
          stepRef.current = 1;
          setLocalStep(1);
          setHasForwardBubble1Entrance(true);
          setIsBubble1EntranceComplete(false);
          setHasPendingSlideAnimations(true);

          const t1 = setTimeout(() => {
            setIsBubble1EntranceComplete(true);
          }, 550);
          timersRef.current.push(t1);

          return true; // Consumato: mostra il 1° fumetto
        }

        if (stepRef.current === 1) {
          triggerStep2Sequence();
          return true; // Consumato: mostra il 2° fumetto e attiva musica + card
        }

        if (stepRef.current === 2 && !isCardVisibleRef.current) {
          // Mostra subito la card se l'utente clicca Avanti prima dei 5s
          revealCardImmediately();
          return true;
        }

        return false; // Tutte le animazioni sono completate
      },
      onPrev: () => {
        if (stepRef.current === 2) {
          stepRef.current = 1;
          setLocalStep(1);
          setHasForwardBubble2Entrance(false);
          setIsBubble2EntranceComplete(false);

          // Nascondi la card e ferma i timer
          clearAllTimers();
          setIsCardVisible(false);
          isCardVisibleRef.current = false;
          setHasForwardCardEntrance(false);
          setIsCardEntranceComplete(false);
          setHasPendingSlideAnimations(true);

          // Ferma e resetta l'audio
          stopBttfAudio();

          return true; // Consumato: nasconde il 2° fumetto e la card
        }

        if (stepRef.current === 1) {
          stepRef.current = 0;
          setLocalStep(0);
          setHasForwardBubble1Entrance(false);
          setIsBubble1EntranceComplete(false);
          setHasPendingSlideAnimations(true);
          clearAllTimers();
          return true; // Consumato: nasconde il 1° fumetto
        }

        return false; // Torna alla slide 12 precedente
      },
      getCurrentStep: () => stepRef.current,
      getStepDescription: (s) =>
        s === 1
          ? "Primo fumetto"
          : s === 2
          ? "Secondo fumetto e card ringraziamenti"
          : "Iniziale",
    });

    return () => {
      registerSlideStepHandler(null);
    };
  }, [
    registerSlideStepHandler,
    triggerStep2Sequence,
    revealCardImmediately,
    clearAllTimers,
    stopBttfAudio,
    setHasPendingSlideAnimations,
  ]);

  // Se viene attivato il replay animazione da TopBar
  useEffect(() => {
    if (isEnteredBackwards) return;
    clearAllTimers();
    stopBttfAudio();
    setLocalStep(0);
    setHasForwardBubble1Entrance(false);
    setIsBubble1EntranceComplete(false);
    setHasForwardBubble2Entrance(false);
    setIsBubble2EntranceComplete(false);
    setIsCardVisible(false);
    isCardVisibleRef.current = false;
    setHasForwardCardEntrance(false);
    setIsCardEntranceComplete(false);
    setHasPendingSlideAnimations(true);
  }, [
    slideAnimKey,
    isEnteredBackwards,
    clearAllTimers,
    stopBttfAudio,
    setHasPendingSlideAnimations,
  ]);

  // Cleanup all'unmount della slide
  useEffect(() => {
    return () => {
      clearAllTimers();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [clearAllTimers]);

  // Avanzamento manuale opzionale al click sul fumetto o container
  const handleAdvance = useCallback(() => {
    if (stepRef.current === 0) {
      stepRef.current = 1;
      setLocalStep(1);
      setHasForwardBubble1Entrance(true);
      setIsBubble1EntranceComplete(false);
      setHasPendingSlideAnimations(true);
      const t1 = setTimeout(() => {
        setIsBubble1EntranceComplete(true);
      }, 550);
      timersRef.current.push(t1);
    } else if (stepRef.current === 1) {
      triggerStep2Sequence();
    } else if (stepRef.current === 2 && !isCardVisibleRef.current) {
      revealCardImmediately();
    }
  }, [triggerStep2Sequence, revealCardImmediately, setHasPendingSlideAnimations]);

  // Classi dinamiche 1° fumetto
  const isBubble1Visible = currentStep >= 1;
  let bubble1AnimationClass = "";
  if (isBubble1Visible) {
    if (isReplay) {
      bubble1AnimationClass = styles.bubbleEntrance || "";
    } else if (hasForwardBubble1Entrance && !isBubble1EntranceComplete) {
      bubble1AnimationClass = styles.bubbleEntrance || "";
    } else {
      bubble1AnimationClass = styles.bubbleStatic || "";
    }
  }

  // Classi dinamiche 2° fumetto
  const isBubble2Visible = currentStep >= 2;
  let bubble2AnimationClass = "";
  if (isBubble2Visible) {
    if (isReplay) {
      bubble2AnimationClass = styles.bubbleEntrance || "";
    } else if (hasForwardBubble2Entrance && !isBubble2EntranceComplete) {
      bubble2AnimationClass = styles.bubbleEntrance || "";
    } else {
      bubble2AnimationClass = styles.bubbleStatic || "";
    }
  }

  const effectiveCardVisible = isReplay ? currentStep >= 2 : isCardVisible;

  // Classi dinamiche card "Grazie!"
  let cardAnimationClass = "";
  if (effectiveCardVisible) {
    if (isReplay) {
      cardAnimationClass = styles.cardEntrance || "";
    } else if (hasForwardCardEntrance && !isCardEntranceComplete) {
      cardAnimationClass = styles.cardEntrance || "";
    } else {
      cardAnimationClass = styles.cardStatic || "";
    }
  }

  return (
    <ImageSlide imageName="ritorno-al-futuro-treno.jpg" title="Finale">
      <div className={styles.slideContainer}>
        {/* Audio background elemento */}
        <audio
          ref={audioRef}
          src={audioSrc}
          loop
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* 1° Fumetto: "Il futuro è come ve lo creerete voi" */}
        {isBubble1Visible && (
          <div
            className={`${styles.speechBubble} ${styles.speechBubble1} ${bubble1AnimationClass}`}
            role="status"
            aria-live="polite"
            onClick={handleAdvance}
            title={currentStep === 1 ? "Clicca per mostrare il seguito" : undefined}
          >
            <span className={styles.bubbleText}>
              Il futuro è come ve lo creerete voi...
            </span>
            <div className={styles.bubbleTail1} aria-hidden="true" />
          </div>
        )}

        {/* 2° Fumetto: "...perciò createvelo buono!" (compare al 2° click, sotto la faccia) */}
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

        {/* Card nello spazio vuoto a sinistra con Grazie, sito e QR Code (dopo 5s dal 2° fumetto) */}
        {effectiveCardVisible && (
          <div
            className={`${styles.thanksCard} ${cardAnimationClass}`}
            role="region"
            aria-label="Ringraziamenti e Sito"
          >
            <h2 className={styles.cardTitle}>Grazie di ❤️</h2>

            <div className={styles.qrSection}>
              <a
                href="https://shiftatiditesta.it"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.qrCard}
                title="Apri il sito https://shiftatiditesta.it"
              >
                <img
                  src={qrSrc}
                  alt="QR Code shiftatiditesta.it"
                  className={styles.qrImg}
                />
              </a>
            </div>

            <a
              href="https://shiftatiditesta.it"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.websiteLink}
            >
              shiftatiditesta.it
            </a>
          </div>
        )}

        {/* Controlli audio in basso a destra (quando la musica parte) */}
        {currentStep >= 2 && !isReplay && (
          <aside
            className={styles.audioControls}
            aria-label="Controlli audio di sottofondo"
          >
            <div className={styles.audioStatus}>
              <span
                className={`${styles.audioEqualizer} ${isPlaying ? styles.isPlaying : ""}`}
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </span>
              <span className={styles.audioTrackName}>BTTF Theme</span>
            </div>

            <div className={styles.audioButtonGroup}>
              <button
                type="button"
                className={`${styles.audioBtn} ${isPlaying ? styles.audioBtnActive : ""}`}
                onClick={handleStart}
                title="Start audio"
                aria-label="Start audio"
              >
                <PlayIcon size={12} />
                <span>Start</span>
              </button>
              <button
                type="button"
                className={`${styles.audioBtn} ${!isPlaying ? styles.audioBtnActive : ""}`}
                onClick={handlePause}
                title="Pausa audio"
                aria-label="Pausa audio"
              >
                <PauseIcon size={12} />
                <span>Pausa</span>
              </button>
              <button
                type="button"
                className={styles.audioBtn}
                onClick={handleStop}
                title="Stop audio"
                aria-label="Stop audio"
              >
                <StopIcon size={12} />
                <span>Stop</span>
              </button>
            </div>
          </aside>
        )}
      </div>
    </ImageSlide>
  );
};
