import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const SaasMorto: FC = () => {
    return (
        <ProvocationCard
            imageName="saas-morto.jpeg"
            ariaLabel="Provocazione: Il SaaS è morto"
        >
            <h2 className={styles.title}>
                <div>Il SaaS</div>
                <div className={styles.highlight}>
                    è morto
                </div>
            </h2>

        </ProvocationCard>
    );
};
