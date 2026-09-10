import type { FC } from "react";
import { SplitSlide } from "../layouts/SplitSlide";

export const Slide03: FC = () => {
  return (
    <SplitSlide
      eyebrow="Architettura & Pragmatismo"
      title="Quello che ci raccontano vs Quello che succede sul palco"
      leftTitle="La Teoria dei Tutorial"
      leftContent={
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <li>❌ "Devi avere 25 livelli di astrazione"</li>
          <li>❌ "Tutto deve andare su cloud serverless distribuito"</li>
          <li>❌ "Scrivi sempre prima 100 test prima del codice"</li>
          <li>❌ "Se non usi l'ultimo framework sei un dinosauro"</li>
        </ul>
      }
      rightTitle="La Realtà sul Campo"
      rightContent={
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <li>✅ "L'app deve funzionare senza internet sul palco"</li>
          <li>✅ "Se ricarichi la pagina, i dati non devono sparire"</li>
          <li>✅ "Il CSS standard moderno oggi fa miracoli da solo"</li>
          <li>✅ "L'affidabilità batte la moda ogni singolo giorno"</li>
        </ul>
      }
    />
  );
};
