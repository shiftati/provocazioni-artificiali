import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation04: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Il colloquio tecnico sul codice{" "}
          <span className={styles.highlight}>non ha più senso</span>.
        </h2>
        <p className={styles.subtitle}>
          Chiedere di invertire alberi binari alla lavagna o risolvere puzzle su
          LeetCode mentre l'AI risolve qualsiasi challenge in 2 secondi è puro
          anacronismo selettivo.
        </p>
      </div>
    </div>
  );
};
