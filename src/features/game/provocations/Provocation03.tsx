import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation03: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #03</span>
        <span>—</span>
        <span>Cultura Aziendale</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          I meeting tecnici del venerdì pomeriggio sono una <span className={styles.highlight}>violazione dei diritti umani</span>.
        </h2>
        <p className={styles.subtitle}>
          "Facciamo solo un rapido allineamento di 10 minuti" è la bugia più crudele mai pronunciata su Google Meet prima di un weekend di deployment.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#friday-deploy-syndrome #burnout</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
