import { useState, useEffect, useRef, type FC } from "react";
import { ImageSlide } from "../layouts/ImageSlide";
import { useAppState } from "../../../state/AppStateContext";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import styles from "./RitornoAlFuturo.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

import type { SlideProps } from "../../../types";

export const RitornoAlFuturo: FC<SlideProps> = ({ isExport = false }) => {
  const { previousSlideIndex } = useAppState();

  const isEnteredBackwards = useRef(
    !isExport && typeof previousSlideIndex === "number" && previousSlideIndex > 6,
  ).current;

  // Compare dopo un paio di secondi (2000ms), oppure subito se navigato a ritroso o in esportazione
  const [isVisible, setIsVisible] = useState<boolean>(() => isEnteredBackwards || isExport);

  useEffect(() => {
    if (isEnteredBackwards || isExport) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isEnteredBackwards, isExport]);

  const klippyEinsteinUrl = useCachedAsset(
    `${BASE_URL}images/slides/klippy-einstein.webp`,
  );

  return (
    <ImageSlide imageName="ritorno-al-futuro.webp" title="Ritorno al Futuro">
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
