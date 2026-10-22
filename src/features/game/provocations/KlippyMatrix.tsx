import type { FC } from "react";
import { ProvocationCard } from "./ProvocationCard";
import styles from "./KlippyMatrix.module.scss";

export const KlippyMatrix: FC = () => {
  return (
    <ProvocationCard
      imageName="documentazione-inutile.jpg"
      ariaLabel="Klippy matrix"
    >
      <div className={styles.captionContainer}>
        <div className={styles.captionBadge}>
          La documentazione non ha più senso
        </div>
      </div>
    </ProvocationCard>
  );
};
