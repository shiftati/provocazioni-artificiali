import type { FC } from "react";
import { ProvocationCard } from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const KlippyLottaTraAi: FC = () => {
  return (
    <ProvocationCard
      imageName="cybersicurezza-lotta-tra-ai.jpg"
      ariaLabel="Klippy lotta tra AI"
    >
        <div className={styles.title}>
          La cybersicurezza sarà una lotta tra AI
        </div>
    </ProvocationCard>
  );
};
