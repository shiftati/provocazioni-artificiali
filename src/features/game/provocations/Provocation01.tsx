import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation01: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.bgAura} aria-hidden="true" />
      <div className={styles.category}>
        <span>⚡ Provocazione #01</span>
        <span>—</span>
        <span>SaaS & Modelli di Business</span>
      </div>

      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Il SaaS è morto: <span className={styles.highlight}>è meglio un software generato su misura per la propria azienda</span>.
        </h2>
        <p className={styles.subtitle}>
          Perché continuare a pagare licenze mensili per tool generici quando l'AI può creare e mantenere un software cucito esattamente sui processi aziendali?
        </p>
      </div>

      <div className={styles.footer}>
        <span className={styles.tag}>#death-of-saas #custom-software #bespoke-systems</span>
        <span className={styles.tag}>Shiftati di Testa @ Codemotion</span>
      </div>
    </div>
  );
};
