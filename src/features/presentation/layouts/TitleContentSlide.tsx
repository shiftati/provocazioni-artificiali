import type { FC, ReactNode } from "react";
import styles from "./SlideLayout.module.scss";

export interface TitleContentSlideProps {
  eyebrow?: string;
  title: ReactNode;
  bullets: ReactNode[];
  footerNote?: string;
}

export const TitleContentSlide: FC<TitleContentSlideProps> = ({
  eyebrow = "Concetto Chiave",
  title,
  bullets,
  footerNote = "Shiftati di Testa",
}) => {
  return (
    <div className={styles.slideContainer}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <span className={styles.talkMeta}>Codemotion Talk</span>
      </header>

      <div className={styles.body}>
        <h2 className={styles.contentTitle}>{title}</h2>

        <ul className={styles.bulletList}>
          {bullets.map((bullet, idx) => (
            <li key={idx} className={styles.bulletItem}>
              <span className={styles.bulletMarker} aria-hidden="true">
                ▶
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className={styles.footer}>
        <span>{footerNote}</span>
        <span>Slide</span>
      </footer>
    </div>
  );
};
