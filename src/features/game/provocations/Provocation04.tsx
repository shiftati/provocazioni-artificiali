import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation04: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #04</span>
        <span>—</span>
        <span>Hiring & Valutazione</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Il colloquio tecnico sul codice <span className={styles.highlight}>non ha più senso</span>.
        </h2>
        <p className={styles.subtitle}>
          Chiedere di invertire alberi binari alla lavagna o risolvere puzzle su LeetCode mentre l'AI risolve qualsiasi challenge in 2 secondi è puro anacronismo selettivo.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#hiring-revolution #leetcode-is-dead #practical-skills</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
