import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation03: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #03</span>
        <span>—</span>
        <span>Futuro dei Developer</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Il mondo dello sviluppo software è morto: <span className={styles.highlight}>i dev lavoreranno a contatto col “mondo reale”</span>.
        </h2>
        <p className={styles.subtitle}>
          Il valore non è più scrivere codice isolati dal business: la vera abilità sarà comprendere a fondo le persone, i processi operativi e i problemi reali.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#real-world-dev #business-empathy #beyond-code</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
