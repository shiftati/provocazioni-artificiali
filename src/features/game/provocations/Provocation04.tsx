import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation04: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #04</span>
        <span>—</span>
        <span>Testing & QA</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Scrivere unit test che testano i mock dei mock <span className={styles.highlight}>non è ingegneria</span>.
        </h2>
        <p className={styles.subtitle}>
          È pura performance artistica d'avanguardia per far diventare verde la barra di SonarQube prima del rilascio.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#coverage-illusions #mock-inception</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
