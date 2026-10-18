import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation09: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          I team grandi (da 2 persone in su){" "}
          <span className={styles.highlight}>sono controproducenti</span>.
        </h2>
        <p className={styles.subtitle}>
          Il costo di coordinamento, allineamenti e sincronizzazione supera il
          throughput effettivo: un singolo sviluppatore potenziato da agenti AI
          è più rapido e coeso di una squadra.
        </p>
      </div>
    </div>
  );
};
