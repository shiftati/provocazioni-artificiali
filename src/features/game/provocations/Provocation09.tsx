import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation09: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #09</span>
        <span>—</span>
        <span>Team & Organizzazione</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          I team grandi (da 2 persone in su) <span className={styles.highlight}>sono controproducenti</span>.
        </h2>
        <p className={styles.subtitle}>
          Il costo di coordinamento, allineamenti e sincronizzazione supera il throughput effettivo: un singolo sviluppatore potenziato da agenti AI è più rapido e coeso di una squadra.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#solopreneur-dev #coordination-tax #one-person-unicorn</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
