import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const LavoroSviluppatoreFinito: FC = () => {
    return (
        <ProvocationCard
            imageName="sviluppo-software-morto.webp"
            ariaLabel="Provocazione: Il mondo dello sviluppo software è morto"
        >
            <h2 className={styles.title}>
                Il lavoro dello sviluppatore{" "}
                <span className={styles.highlight}>è finito</span>.
            </h2>
        </ProvocationCard>
    );
};
