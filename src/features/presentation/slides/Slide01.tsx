import type { FC } from "react";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import styles from "./Slide01.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const Slide01: FC = () => {
  const bgImg = useCachedAsset(
    `${BASE_URL}images/slides/codemotion-blue-title.jpg`,
  );
  const steImg = useCachedAsset(`${BASE_URL}images/slides/intro-ste.png`);
  const danielImg = useCachedAsset(`${BASE_URL}images/slides/intro-daniel.png`);
  const klippyImg = useCachedAsset(`${BASE_URL}images/slides/intro-klippy.png`);

  return (
    <div
      className={styles.slideContainer}
      style={{ backgroundImage: `url("${bgImg}")` }}
      role="region"
      aria-label="Slide 1 - Provocazioni Artificiali"
    >
      {/* Decorative lens flare glows matching reference art */}
      <div className={styles.titleFlash} aria-hidden="true" />

      {/* Header text */}
      <header className={styles.headerGroup}>
        {/* 1. Titolo */}
        <h1 className={styles.title}>
          <span className={`${styles.titleLine} ${styles.titleLine1}`}>
            Provocazioni
          </span>
          <span className={`${styles.titleLine} ${styles.titleLine2}`}>
            Artificiali
          </span>
        </h1>

        {/* 2. Sottotitolo */}
        <p className={styles.subtitle}>
          ...un talk così “shiftato” che ti verrà
          <br />
          la voglia di rubarci il microfono!
        </p>
      </header>

      {/* 3. Le due persone */}
      {/* In basso a sinistra: Stefano (intro-ste.png) */}
      <img src={steImg} alt="Stefano Bruno" className={styles.speakerLeft} />

      {/* In basso a destra: Daniel (intro-daniel.png) */}
      <img src={danielImg} alt="Daniel Zotti" className={styles.speakerRight} />

      {/* 4. Graffetta (Klippy): al centro dal basso */}
      <div className={styles.klippyWrapper}>
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
