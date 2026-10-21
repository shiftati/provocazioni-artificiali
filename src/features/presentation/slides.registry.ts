import type { SlideDefinition } from "../../types";
import { Titolo } from "./slides/Titolo";
import { GliEsperti } from "./slides/GliEsperti";
import { SviluppatoreQualunque } from "./slides/SviluppatoreQualunque";
import { MacchinettaDelCaffe } from "./slides/MacchinettaDelCaffe";
import { DanielESte } from "./slides/DanielESte";
import { RitornoAlFuturo } from "./slides/RitornoAlFuturo";
import { KlippySaw } from "./slides/KlippySaw";
import { FightClub } from "./slides/FightClub";
import { KlippyLottaTraAi } from "./slides/KlippyLottaTraAi";
import { KlippyMatrix } from "./slides/KlippyMatrix";
import { IoSonoEccellenza } from "./slides/IoSonoEccellenza";
import { Selfie } from "./slides/Selfie";
import { Finale } from "./slides/Finale";
import { SchermoNero } from "./slides/SchermoNero";

export const SLIDES: readonly SlideDefinition[] = [
  {
    id: "titolo",
    title: "Titolo",
    component: Titolo,
  },
  {
    id: "gli-esperti",
    title: "Gli esperti",
    component: GliEsperti,
  },
  {
    id: "developer-qualunque",
    title: "Developer qualunque",
    component: SviluppatoreQualunque,
  },
  {
    id: "macchinetta-caffe",
    title: "Macchinetta del caffè",
    component: MacchinettaDelCaffe,
  },
  {
    id: "daniel-e-ste",
    title: "Daniel e Ste",
    component: DanielESte,
  },
  {
    id: "ritorno-al-futuro",
    title: "Ritorno al Futuro",
    component: RitornoAlFuturo,
  },
  {
    id: "klippy-saw",
    title: "Klippy saw",
    component: KlippySaw,
  },
  {
    id: "fight-club",
    title: "Fight club",
    component: FightClub,
  },
  {
    id: "klippy-lotta-ai",
    title: "Klippy lotta tra AI",
    component: KlippyLottaTraAi,
  },
  {
    id: "klippy-matrix",
    title: "Klippy matrix",
    component: KlippyMatrix,
  },
  {
    id: "io-sono-eccellenza",
    title: "Io sono eccellenza",
    component: IoSonoEccellenza,
  },
  {
    id: "selfie",
    title: "Selfie",
    component: Selfie,
  },
  {
    id: "finale",
    title: "Finale",
    component: Finale,
  },
  {
    id: "nero",
    title: "Schermo Nero",
    component: SchermoNero,
  }
] as const;
