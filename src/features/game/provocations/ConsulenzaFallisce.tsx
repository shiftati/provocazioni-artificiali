import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const ConsulenzaFallisce: FC = () => {
    return (
        <ProvocationCard
            imageName="consulenza-fallisce.jpeg"
            ariaLabel="Provocazione: Le società di consulenza falliranno"
        >
            <h2 className={styles.title}>
                Le società di consulenza{" "}
                <span className={styles.highlight}>falliranno</span>.
            </h2>
        </ProvocationCard>
    );
};
