import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation02: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #02</span>
        <span>—</span>
        <span>Mercato & Consulenza</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Le società di consulenza <span className={styles.highlight}>falliranno</span>.
        </h2>
        <p className={styles.subtitle}>
          Il modello basato sul body rental e sulla vendita di ore/uomo non regge più se un singolo sviluppatore supportato da agenti AI produce quanto un intero team tradizionale.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#consulting-apocalypse #death-of-body-leasing #productivity-leap</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
