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
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/codemotion-blue-title.jpg",
      "images/slides/intro-ste.png",
      "images/slides/intro-daniel.png",
    ],
  },
  {
    id: "gli-esperti",
    title: "Gli esperti",
    component: GliEsperti,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/gli-esperti.png"],
  },
  {
    id: "developer-qualunque",
    title: "Developer qualunque",
    component: SviluppatoreQualunque,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/codemotion-blue-bg.png",
      "images/slides/metroman.png",
    ],
  },
  {
    id: "macchinetta-caffe",
    title: "Macchinetta del caffè",
    component: MacchinettaDelCaffe,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/macchinetta-caffe.jpg"],
  },
  {
    id: "daniel-e-ste",
    title: "Daniel e Ste",
    component: DanielESte,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/codemotion-blue-bg.png",
      "images/slides/intro-ste.png",
      "images/slides/intro-daniel.png",
      "images/slides/intro-klippy.png",
    ],
  },
  {
    id: "ritorno-al-futuro",
    title: "Ritorno al Futuro",
    component: RitornoAlFuturo,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/7-ritorno-al-futuro.jpg",
      "images/slides/klippy-einstein.png",
    ],
  },
  {
    id: "klippy-saw",
    title: "Klippy saw",
    component: KlippySaw,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/8-klippy-saw.jpg",
      "images/slides/klippy-saw.png",
    ],
  },
  {
    id: "fight-club",
    title: "Fight club",
    component: FightClub,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/9-fight-club.jpg"],
  },
  {
    id: "klippy-lotta-ai",
    title: "Klippy lotta tra AI",
    component: KlippyLottaTraAi,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/10-klippy-lotta-tra-ai.jpg"],
  },
  {
    id: "klippy-matrix",
    title: "Klippy matrix",
    component: KlippyMatrix,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/11-klippy-matrix.jpg"],
  },
  {
    id: "io-sono-eccellenza",
    title: "Io sono eccellenza",
    component: IoSonoEccellenza,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/12-io-sono-eccellenza.jpg"],
  },
  {
    id: "selfie",
    title: "Selfie",
    component: Selfie,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/13-selfie.jpg"],
  },
  {
    id: "finale",
    title: "Finale",
    component: Finale,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/14-finale.jpg",
      "images/qr-shiftati.svg",
    ],
  },
  {
    id: "nero",
    title: "Schermo Nero",
    component: SchermoNero,
    transition: "fade",
    transitionDurationMs: 700,
    assets: [],
  },
] as const;
