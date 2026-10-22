import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const AgileMorto: FC = () => {
    return (
        <ProvocationCard
            imageName="agile-morto.jpeg"
            ariaLabel="Provocazione: AGILE è finalmente morto"
        >
            <h2 className={styles.title}>
                AGILE è <span className={styles.highlight}>finalmente morto</span>.
            </h2>
        </ProvocationCard>
    );
};
