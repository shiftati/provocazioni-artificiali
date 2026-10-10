import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation07: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #07</span>
        <span>—</span>
        <span>Ciclo di Vita del Software</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Il Software diventerà <span className={styles.highlight}>usa e getta</span>.
        </h2>
        <p className={styles.subtitle}>
          Costa meno rigenerare una nuova soluzione da zero ogni volta che cambiano i requisiti piuttosto che investire anni in manutenzione, refactoring e debito tecnico legacy.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#disposable-software #zero-maintenance #regenerative-code</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
