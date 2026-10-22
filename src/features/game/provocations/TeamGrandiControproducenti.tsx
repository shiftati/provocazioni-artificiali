import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";
import styles from "./ProvocationCard.module.scss";

export const TeamGrandiControproducenti: FC = () => {
    return (
        <ProvocationCard
            imageName="team-grandi-controproducenti.jpeg"
            ariaLabel="Provocazione: I team grandi sono controproducenti"
        >
            <h2 className={styles.title}>
                I team grandi <small>(da 2 persone in su)</small><br/>
                <span className={styles.highlight}>sono controproducenti</span>.
            </h2>
        </ProvocationCard>
    );
};
