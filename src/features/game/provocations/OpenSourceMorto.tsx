import type {FC} from "react";
import {ProvocationCard} from "./ProvocationCard";

export const OpenSourceMorto: FC = () => {
    return (
        <ProvocationCard
            imageName="open-source-morto.jpeg.jpg"
            ariaLabel="Provocazione: L'open source è morto"
        />
    );
};
