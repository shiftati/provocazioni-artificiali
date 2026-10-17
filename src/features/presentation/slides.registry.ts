import type { SlideDefinition } from "../../types";
import { Slide01 } from "./slides/Slide01";
import { Slide02 } from "./slides/Slide02";
import { Slide03 } from "./slides/Slide03";
import { Slide04 } from "./slides/Slide04";
import { Slide05 } from "./slides/Slide05";
import { Slide06 } from "./slides/Slide06";
import { Slide07 } from "./slides/Slide07";
import { Slide08 } from "./slides/Slide08";
import { Slide09 } from "./slides/Slide09";
import { Slide10 } from "./slides/Slide10";
import { Slide11 } from "./slides/Slide11";
import { Slide12 } from "./slides/Slide12";
import { Slide13 } from "./slides/Slide13";
import { Slide14 } from "./slides/Slide14";
import { Slide15 } from "./slides/Slide15";

export const SLIDES: readonly SlideDefinition[] = [
  {
    id: "titolo",
    title: "1. Titolo",
    component: Slide01,
  },
  {
    id: "gli-esperti",
    title: "2. Gli esperti",
    component: Slide02,
  },
  {
    id: "developer-qualunque",
    title: "3. Developer qualunque",
    component: Slide03,
  },
  {
    id: "macchinetta-caffe",
    title: "4. Macchinetta del caffè",
    component: Slide04,
  },
  {
    id: "daniel-e-ste",
    title: "5. Daniel e Ste",
    component: Slide05,
  },
  {
    id: "ritorno-al-futuro",
    title: "6. Ritorno al Futuro",
    component: Slide07,
  },
  {
    id: "klippy-saw",
    title: "7. Klippy saw",
    component: Slide08,
  },
  {
    id: "fight-club",
    title: "8. Fight club",
    component: Slide09,
  },
  {
    id: "klippy-lotta-ai",
    title: "9. Klippy lotta tra AI",
    component: Slide10,
  },
  {
    id: "klippy-matrix",
    title: "10. Klippy matrix",
    component: Slide11,
  },
  {
    id: "io-sono-eccellenza",
    title: "11. Io sono eccellenza",
    component: Slide12,
  },
  {
    id: "selfie",
    title: "12. Selfie",
    component: Slide13,
  },
  {
    id: "finale",
    title: "13. Finale",
    component: Slide14,
  },
  {
    id: "contatti",
    title: "14. Contatti",
    component: Slide15,
  },
] as const;
