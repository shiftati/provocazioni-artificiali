import { useState, useEffect, useRef, type FC } from "react";
import { ImageSlide } from "../layouts/ImageSlide";
import { useAppState } from "../../../state/AppStateContext";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import styles from "./RitornoAlFuturo.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const RitornoAlFuturo: FC = () => {
  const { previousSlideIndex } = useAppState();

  const isEnteredBackwards = useRef(
    typeof previousSlideIndex === "number" && previousSlideIndex > 6,
  ).current;

  // Compare dopo un paio di secondi (2000ms), oppure subito se navigato a ritroso
  const [isVisible, setIsVisible] = useState<boolean>(() => isEnteredBackwards);

  useEffect(() => {
    if (isEnteredBackwards) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isEnteredBackwards]);

  const klippyEinsteinUrl = useCachedAsset(
    `${BASE_URL}images/slides/klippy-einstein.webp`,
  );

  return (
    <ImageSlide imageName="ritorno-al-futuro.jpg" title="Ritorno al Futuro">
      <div
        className={`${styles.klippyContainer} ${isVisible ? styles.klippyVisible : ""}`}
      >
        <img
          src={klippyEinsteinUrl}
          alt="Klippy Einstein"
          className={styles.klippyImage}
        />
      </div>
    </ImageSlide>
  );
};
