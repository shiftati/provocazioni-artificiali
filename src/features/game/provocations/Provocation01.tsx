import type { FC } from "react";
import styles from "./ProvocationCard.module.scss";

export const Provocation01: FC = () => {
  return (
    <div className={styles.provocationCard}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Il SaaS è morto:{" "}
          <span className={styles.highlight}>
            è meglio un software generato su misura per la propria azienda
          </span>
          .
        </h2>
        <p className={styles.subtitle}>
          Perché continuare a pagare licenze mensili per tool generici quando
          l'AI può creare e mantenere un software cucito esattamente sui
          processi aziendali?
        </p>
      </div>
    </div>
  );
};
