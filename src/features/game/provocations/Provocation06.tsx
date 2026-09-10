import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation06: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #06</span>
        <span>—</span>
        <span>Developer Experience</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          La documentazione perfetta esiste: <span className={styles.highlight}>è il prompt che passi all'LLM</span>.
        </h2>
        <p className={styles.subtitle}>
          "Il codice si autodocumenta" è stata la più grande menzogna collettiva degli ultimi vent'anni di informatica.
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#documentation-myths #clean-code-dogma</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
