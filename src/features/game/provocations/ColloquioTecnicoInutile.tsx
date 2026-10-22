import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const ColloquioTecnicoInutile: FC = () => {
    return (
        <ProvocationCard
            imageName="colloquio-tecnico-inutile.webp"
            ariaLabel="Provocazione: Il colloquio tecnico sul codice non ha più senso"
        >
            <h2 className={styles.title}>
                Il colloquio tecnico sul codice{" "}
                <span className={styles.highlight}>non ha più senso</span>.
            </h2>
        </ProvocationCard>
    );
};
