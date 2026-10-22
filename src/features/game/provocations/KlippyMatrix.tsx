import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const KlippyMatrix: FC = () => {
    return (
        <ProvocationCard
            imageName="documentazione-inutile.jpg"
            ariaLabel="Klippy matrix"
        >
            <div className={styles.title}>
                La documentazione non ha più senso
            </div>
        </ProvocationCard>
    );
};
