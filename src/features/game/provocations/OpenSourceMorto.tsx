import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const OpenSourceMorto: FC = () => {
    return (
        <ProvocationCard
            imageName="open-source-morto.jpeg.jpg"
            ariaLabel="Provocazione: L'open source è morto"
        >
            <h2 className={styles.title}>
                L’open source <span className={styles.highlight}>è morto</span>.
            </h2>
        </ProvocationCard>
    );
};
