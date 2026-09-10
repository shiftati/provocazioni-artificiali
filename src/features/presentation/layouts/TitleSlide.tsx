import type { FC, ReactNode } from "react";
import styles from "./SlideLayout.module.scss";

export interface TitleSlideProps {
  title: ReactNode;
  subtitle: ReactNode;
  speakers?: string[];
  eventTag?: string;
}

export const TitleSlide: FC<TitleSlideProps> = ({
  title,
  subtitle,
  speakers = ["Shiftati di Testa", "Codemotion 2026"],
  eventTag = "Codemotion Live Session",
}) => {
  return (
    <div className={`${styles.slideContainer} ${styles.titleSlide}`}>
      <div className={styles.eyebrow}>
        <span>{eventTag}</span>
      </div>

      <div className={styles.body}>
        <h1 className={styles.titleBig}>{title}</h1>
        <p className={styles.subtitleBig}>{subtitle}</p>

        {speakers && speakers.length > 0 && (
          <div className={styles.speakerPills}>
            {speakers.map((sp) => (
              <span key={sp} className={styles.speakerPill}>
                {sp}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <span>Premi Spazio / Frecce per avanzare</span>
        <span>16:9 Stage Canvas</span>
      </div>
    </div>
  );
};
