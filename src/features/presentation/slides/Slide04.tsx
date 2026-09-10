import type { FC } from "react";
import { FullBleedSlide } from "../layouts/FullBleedSlide";

export const Slide04: FC = () => {
  return (
    <FullBleedSlide
      tag="Il Verdetto della Sala"
      quote={
        <>
          Il codice perfetto non esiste finché non va in produzione{" "}
          <span style={{ color: "var(--color-accent)" }}>davanti a centinaia di colleghi</span>.
        </>
      }
      author="Shiftati di Testa Manifesto — Codemotion 2026"
    />
  );
};
