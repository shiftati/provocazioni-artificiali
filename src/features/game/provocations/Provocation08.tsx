import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation08: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          AGILE è <span className={styles.highlight}>finalmente morto</span>.
        </h2>
        <p className={styles.subtitle}>
          Sprint planning infiniti, story point e cerimonie burocratiche sono
          stati inventati per gestire l'inefficienza umana, ma oggi rallentano
          soltanto il delivery.
        </p>
      </div>
    </div>
  );
};
