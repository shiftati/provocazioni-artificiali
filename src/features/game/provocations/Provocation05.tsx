import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation05: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #05</span>
        <span>—</span>
        <span>CI/CD & DevOps</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Se non fai push su main direttamente dal palco, <span className={styles.highlight}>ti manca il brivido</span>.
        </h2>
        <p className={styles.subtitle}>
          Lo staging environment è solo un'invenzione dei deboli di cuore che non hanno fede nei propri console.log.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#cowboy-deploy #yolo-engineering</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
