import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const EspertiVerticaliInutili: FC = () => {
    return (
        <ProvocationCard
            imageName="esperti-verticali-inutili.webp"
            ariaLabel="Provocazione: Non ha più senso diventare esperti in una tecnologia specifica"
        >
            <h2 className={styles.title}>
                Non ha più senso diventare esperti in{" "}
                <span className={styles.highlight}>una tecnologia specifica</span>.
            </h2>
        </ProvocationCard>
    );
};
