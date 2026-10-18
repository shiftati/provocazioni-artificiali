import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation05: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Non ha più senso diventare esperti in{" "}
          <span className={styles.highlight}>una tecnologia specifica</span>.
        </h2>
        <p className={styles.subtitle}>
          I dettagli sintattici e i singoli framework sono diventati commodity
          usa e getta: ciò che conta è l'architettura, la capacità critica e il
          problem-solving sistemico.
        </p>
      </div>
    </div>
  );
};
