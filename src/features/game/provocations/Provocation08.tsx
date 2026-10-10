import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation08: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #08</span>
        <span>—</span>
        <span>Metodologie & Processi</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          AGILE è <span className={styles.highlight}>finalmente morto</span>.
        </h2>
        <p className={styles.subtitle}>
          Sprint planning infiniti, story point e cerimonie burocratiche sono stati inventati per gestire l'inefficienza umana, ma oggi rallentano soltanto il delivery.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#agile-is-dead #no-more-scrum #ship-direct</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
