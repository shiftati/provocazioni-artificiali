import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { ImageSlide } from "../layouts/ImageSlide";
import { useAppState } from "../../../state/AppStateContext";
import styles from "./Slide14.module.scss";

export const Slide14: FC = () => {
  const { previousSlideIndex, slideAnimKey } = useAppState();

  const isEnteredBackwards = useRef(
    typeof previousSlideIndex === "number" && previousSlideIndex > 12,
  ).current;

  const [isBubbleVisible, setIsBubbleVisible] = useState<boolean>(
    () => isEnteredBackwards,
  );
  const [isBubbleEntranceComplete, setIsBubbleEntranceComplete] =
    useState<boolean>(() => isEnteredBackwards);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const playEntranceSequence = useCallback(() => {
    clearAllTimers();
    setIsBubbleVisible(false);
    setIsBubbleEntranceComplete(false);

    // Piccolo intervallo per far entrare il fumetto
    const t0 = setTimeout(() => {
      setIsBubbleVisible(true);
      const tEnd = setTimeout(() => {
        setIsBubbleEntranceComplete(true);
      }, 600);
      timersRef.current.push(tEnd);
    }, 450);

    timersRef.current.push(t0);
  }, [clearAllTimers]);

  useEffect(() => {
    if (isEnteredBackwards) return;
    playEntranceSequence();

    return () => {
      clearAllTimers();
    };
  }, [isEnteredBackwards, playEntranceSequence, clearAllTimers, slideAnimKey]);

  let bubbleAnimationClass = "";
  if (isBubbleVisible) {
    bubbleAnimationClass =
      (isBubbleEntranceComplete
        ? styles.bubbleStatic
        : styles.bubbleEntrance) || "";
  }

  return (
    <ImageSlide imageName="14-finale.jpg" title="Finale">
      <div className={styles.slideContainer}>
        {isBubbleVisible && (
          <div
            className={`${styles.speechBubble} ${bubbleAnimationClass}`}
            role="status"
            aria-live="polite"
            onClick={playEntranceSequence}
            title="Clicca per rigiocare l'animazione"
          >
            <span className={styles.bubbleText}>
              Il futuro è come ve lo creerete voi
              <br />
              perciò createvelo buono!
            </span>
            <div className={styles.bubbleTail} aria-hidden="true" />
          </div>
        )}
      </div>
    </ImageSlide>
  );
};
