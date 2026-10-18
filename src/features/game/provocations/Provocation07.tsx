import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation07: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Il Software diventerà{" "}
          <span className={styles.highlight}>usa e getta</span>.
        </h2>
        <p className={styles.subtitle}>
          Costa meno rigenerare una nuova soluzione da zero ogni volta che
          cambiano i requisiti piuttosto che investire anni in manutenzione,
          refactoring e debito tecnico legacy.
        </p>
      </div>
    </div>
  );
};
