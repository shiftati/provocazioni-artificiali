import type { FC } from "react";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import styles from "./Titolo.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const Titolo: FC = () => {
  const bgImg = useCachedAsset(
    `${BASE_URL}images/slides/codemotion-blue-title.jpg`,
  );
  const klippyImg = useCachedAsset(`${BASE_URL}images/klippy-shattered.png`);

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
          </span>{" "}
          <span className={`${styles.titleLine} ${styles.titleLine2}`}>
            Artificiali
          </span>
        </h1>

        {/* 2. Sottotitolo */}
        <p className={styles.subtitle}>
          <span className={styles.subtitleText}>
            ...un talk così “shiftato” che ti verrà
            <br />
            la voglia di rubarci il microfono!
          </span>
        </p>
      </header>

      {/* 3. Klippy sconvolto in basso a destra */}
      <div className={styles.klippyWrapper}>
        <img
          src={klippyImg}
          alt="Klippy sconvolto"
          className={styles.klippyImg}
        />
      </div>
    </div>
  );
};
