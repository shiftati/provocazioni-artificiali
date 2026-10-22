import type { SlideDefinition } from "../../types";
import { Titolo } from "./slides/Titolo";
import { GliEsperti } from "./slides/GliEsperti";
import { SviluppatoreQualunque } from "./slides/SviluppatoreQualunque";
import { MacchinettaDelCaffe } from "./slides/MacchinettaDelCaffe";
import { DanielESte } from "./slides/DanielESte";
import { RitornoAlFuturo } from "./slides/RitornoAlFuturo";
import { KlippySaw } from "./slides/KlippySaw";
import { FightClub } from "./slides/FightClub";
import { CybersicurezzaLottaTraAi } from "../game/provocations/CybersicurezzaLottaTraAi";
import { DocumentazioneInsensata } from "../game/provocations/DocumentazioneInsensata";
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
      "images/slides/codemotion-blue-title.webp",
      "images/klippy-shattered.webp",
    ],
  },
  {
    id: "gli-esperti",
    title: "Gli esperti",
    component: GliEsperti,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/gli-esperti.webp"],
  },
  {
    id: "developer-qualunque",
    title: "Developer qualunque",
    component: SviluppatoreQualunque,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/codemotion-blue-bg.webp",
      "images/slides/metroman.webp",
    ],
  },
  {
    id: "macchinetta-caffe",
    title: "Macchinetta del caffè",
    component: MacchinettaDelCaffe,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/macchinetta-caffe.webp"],
  },
  {
    id: "daniel-e-ste",
    title: "Daniel e Ste",
    component: DanielESte,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/codemotion-blue-bg.webp",
      "images/slides/intro-ste.webp",
      "images/slides/intro-daniel.webp",
      "images/slides/intro-klippy.webp",
    ],
  },
  {
    id: "ritorno-al-futuro",
    title: "Ritorno al Futuro",
    component: RitornoAlFuturo,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/ritorno-al-futuro.webp",
      "images/slides/klippy-einstein.webp",
    ],
  },
  {
    id: "klippy-saw",
    title: "Klippy saw",
    component: KlippySaw,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/saw-background.webp",
      "images/slides/klippy-saw.webp",
    ],
  },
  {
    id: "fight-club",
    title: "Fight club",
    component: FightClub,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/fight-club.webp"],
  },
  {
    id: "klippy-lotta-ai",
    title: "Klippy lotta tra AI",
    component: CybersicurezzaLottaTraAi,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/cybersicurezza-lotta-tra-ai.webp"],
  },
  {
    id: "klippy-matrix",
    title: "Klippy matrix",
    component: DocumentazioneInsensata,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/documentazione-inutile.webp"],
  },
  {
    id: "io-sono-eccellenza",
    title: "Io sono eccellenza",
    component: IoSonoEccellenza,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/io-sono-eccellenza.webp"],
  },
  {
    id: "selfie",
    title: "Selfie",
    component: Selfie,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: ["images/slides/selfie.webp"],
  },
  {
    id: "finale",
    title: "Finale",
    component: Finale,
    transition: "fade-scale",
    transitionDurationMs: 600,
    assets: [
      "images/slides/ritorno-al-futuro-treno.webp",
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
