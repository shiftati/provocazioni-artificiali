import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation01: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #01</span>
        <span>—</span>
        <span>AI Coding</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Il codice migliore è quello che <span className={styles.highlight}>non devi scrivere</span>.
        </h2>
        <p className={styles.subtitle}>
          Perché l'ha generato l'AI in 4 secondi... e adesso tocca a te passare le prossime tre settimane a capirne il motivo dei memory leak.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#vibe-coding #generative-debt</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
