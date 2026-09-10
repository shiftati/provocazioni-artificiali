import type { FC } from "react";
import { ClosingSlide } from "../layouts/ClosingSlide";

export const Slide05: FC = () => {
  return (
    <ClosingSlide
      title="Grazie Codemotion!"
      subtitle="La vera provocazione è continuare a farsi domande critiche ogni lunedì mattina davanti a una pull request."
      speakerInfo={{
        name: "Daniel Zotti & Team",
        role: "Speaker @ Codemotion 2026",
      }}
      links={[
        {
          label: "Slide Roulette",
          url: "slide-roulette.danielzotti.it",
        },
        {
          label: "Codice Sorgente",
          url: "github.com/danielzotti/provocazioni-shiftate-codemotion-antigravity",
        },
      ]}
    />
  );
};
