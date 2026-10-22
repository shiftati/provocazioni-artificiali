import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const SoftwareUsaEGetta: FC = () => {
    return (
        <ProvocationCard
            imageName="software-usa-e-getta.webp"
            ariaLabel="Provocazione: Il Software diventerà usa e getta"
        >
            <h2 className={styles.title}>
                Il Software diventerà{" "}
                <span className={styles.highlight}>usa e getta</span>.
            </h2>
        </ProvocationCard>
    );
};
