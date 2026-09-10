import type { FC } from "react";
import { TitleContentSlide } from "../layouts/TitleContentSlide";

export const Slide02: FC = () => {
  return (
    <TitleContentSlide
      eyebrow="Fondamenta del Talk"
      title="Perché l'ingegneria del software è piena di dogmi non detti"
      bullets={[
        <>
          <strong>L'illusione del controllo:</strong> Aggiungiamo strati di complessità credendo di prevenire bug che non accadranno mai.
        </>,
        <>
          <strong>Trend-driven development:</strong> Adottiamo strumenti non perché risolvono un nostro problema reale, ma perché l'algoritmo ci fa sentire obsoleti.
        </>,
        <>
          <strong>La paura della semplicità:</strong> Scrivere 20 righe di CSS puro sembra quasi illegale quando potresti importare una libreria da 400KB.
        </>,
        <>
          <strong>Oggi facciamo una scommessa:</strong> Guardare le nostre abitudini in faccia e riderne con intelligenza.
        </>,
      ]}
      footerNote="Provocazione iniziale #0 — La comodità dei dogmi"
    />
  );
};
