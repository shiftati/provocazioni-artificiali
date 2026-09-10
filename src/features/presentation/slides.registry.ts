import type { SlideDefinition } from "../../types";
import { Slide01 } from "./slides/Slide01";
import { Slide02 } from "./slides/Slide02";
import { Slide03 } from "./slides/Slide03";
import { Slide04 } from "./slides/Slide04";
import { Slide05 } from "./slides/Slide05";

export const SLIDES: readonly SlideDefinition[] = [
  {
    id: "intro",
    title: "Shiftati di Testa — Intro",
    component: Slide01,
  },
  {
    id: "dogmi",
    title: "I Dogmi del Software",
    component: Slide02,
  },
  {
    id: "confronto",
    title: "Teoria vs Realtà sul Palco",
    component: Slide03,
  },
  {
    id: "verdetto",
    title: "Il Verdetto della Sala (Stop Telefonate)",
    component: Slide04,
  },
  {
    id: "closing",
    title: "Conclusioni & Q&A",
    component: Slide05,
  },
] as const;
