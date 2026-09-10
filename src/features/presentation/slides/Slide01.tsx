import type { FC } from "react";
import { TitleSlide } from "../layouts/TitleSlide";

export const Slide01: FC = () => {
  return (
    <TitleSlide
      eventTag="Codemotion 2026 — Keynote & Interactive Talk"
      title={
        <>
          Shiftati di <span style={{ color: "var(--color-accent)" }}>Testa</span>
        </>
      }
      subtitle="Provocazioni senza filtri, architetture moderne e un gioco ad alto tasso di adrenalina per mettere alla prova le nostre certezze da sviluppatori."
      speakers={["Daniel Zotti", "Codemotion Speaker Team"]}
    />
  );
};
