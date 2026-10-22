import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const SaasMorto: FC = () => {
    return (
        <ProvocationCard
            imageName="saas-morto.webp"
            ariaLabel="Provocazione: Il SaaS è morto"
        >
            <h2 className={styles.title}>
                <span>Il SaaS</span>{" "}
                <span className={styles.highlight}>
                    è morto
                </span>
            </h2>

        </ProvocationCard>
    );
};
