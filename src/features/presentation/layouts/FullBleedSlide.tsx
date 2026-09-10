import type { FC, ReactNode } from "react";
import styles from "./SlideLayout.module.scss";

export interface FullBleedSlideProps {
  quote: ReactNode;
  author?: string;
  tag?: string;
}

export const FullBleedSlide: FC<FullBleedSlideProps> = ({
  quote,
  author,
  tag = "Punto di Svolta",
}) => {
  return (
    <div className={`${styles.slideContainer} ${styles.fullBleed}`}>
      <span className={styles.eyebrow} style={{ marginBottom: "var(--space-6)" }}>
        {tag}
      </span>

      <blockquote className={styles.fullBleedQuote}>
        "{quote}"
      </blockquote>

      {author && (
        <p style={{ fontSize: "2rem", color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
          — {author}
        </p>
      )}
    </div>
  );
};
