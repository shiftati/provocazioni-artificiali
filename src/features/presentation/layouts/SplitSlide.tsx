import type { FC, ReactNode } from "react";
import styles from "./SlideLayout.module.scss";

export interface SplitSlideProps {
  eyebrow?: string;
  title: ReactNode;
  leftTitle: string;
  leftContent: ReactNode;
  rightTitle: string;
  rightContent: ReactNode;
}

export const SplitSlide: FC<SplitSlideProps> = ({
  eyebrow = "Confronto Diretto",
  title,
  leftTitle,
  leftContent,
  rightTitle,
  rightContent,
}) => {
  return (
    <div className={styles.slideContainer}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <span className={styles.talkMeta}>Shiftati di Testa</span>
      </header>

      <div className={styles.body}>
        <h2 className={styles.contentTitle}>{title}</h2>

        <div className={styles.splitGrid}>
          <div className={`${styles.splitColumn} ${styles.columnCard}`}>
            <h3 style={{ color: "var(--color-text-muted)", fontSize: "1.8rem" }}>{leftTitle}</h3>
            <div style={{ fontSize: "1.5rem", lineHeight: 1.5 }}>{leftContent}</div>
          </div>

          <div className={`${styles.splitColumn} ${styles.columnCard}`} style={{ borderColor: "var(--color-accent)" }}>
            <h3 style={{ color: "var(--color-accent)", fontSize: "1.8rem" }}>{rightTitle}</h3>
            <div style={{ fontSize: "1.5rem", lineHeight: 1.5 }}>{rightContent}</div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <span>Analisi comparativa</span>
        <span>Codemotion 2026</span>
      </footer>
    </div>
  );
};
