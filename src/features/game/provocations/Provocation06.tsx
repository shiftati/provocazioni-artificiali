import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation06: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #06</span>
        <span>—</span>
        <span>Open Source & Community</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          L’open source <span className={styles.highlight}>è morto</span>.
        </h2>
        <p className={styles.subtitle}>
          I colossi dell'AI hanno monetizzato e chiuso nei propri modelli proprietari decenni di codice open source gratuito, rompendo il patto sociale di reciprocità della community.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#open-source-crisis #commons-tragedy #licensing-wars</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
