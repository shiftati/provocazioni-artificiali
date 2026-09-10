import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation02: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #02</span>
        <span>—</span>
        <span>Architettura</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          I microservizi erano una scusa per non ammettere che <span className={styles.highlight}>non sapevamo organizzare le cartelle</span>.
        </h2>
        <p className={styles.subtitle}>
          Nel 2026 abbiamo riscoperto il maestoso monolite modulare, e improvvisamente i cluster Kubernetes non servono più per servire un form contatti.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#monolith-renaissance #overengineering</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
