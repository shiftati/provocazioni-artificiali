import type { ProvocationDefinition } from "../../types";
import { SaasMorto } from "./provocations/SaasMorto";
import { ConsulenzaFallisce } from "./provocations/ConsulenzaFallisce";
import { LavoroSviluppatoreFinito } from "./provocations/LavoroSviluppatoreFinito";
import { ColloquioTecnicoInutile } from "./provocations/ColloquioTecnicoInutile";
import { EspertiVerticaliInutili } from "./provocations/EspertiVerticaliInutili";
import { OpenSourceMorto } from "./provocations/OpenSourceMorto";
import { SoftwareUsaEGetta } from "./provocations/SoftwareUsaEGetta";
import { AgileMorto } from "./provocations/AgileMorto";
import { TeamGrandiControproducenti } from "./provocations/TeamGrandiControproducenti";

export const PROVOCATIONS: readonly ProvocationDefinition[] = [
  {
    id: "saas-morto",
    title: "Il SaaS è morto: meglio un software generato su misura",
    subtitle: "Software su misura per la propria azienda vs licenze SaaS",
    component: SaasMorto,
    image: "images/provocations/saas-morto.webp",
    transition: "fade-scale",
    transitionDurationMs: 600,
  },
  {
    id: "software-usa-e-getta",
    title: "Il Software diventerà usa e getta",
    subtitle: "Rigenerare da zero batte la manutenzione del debito legacy",
    component: SoftwareUsaEGetta,
    image: "images/provocations/software-usa-e-getta.webp",
    transition: "fade-scale",
    transitionDurationMs: 600,
  },
  {
    id: "agile-morto",
    title: "AGILE è finalmente morto",
    subtitle: "La fine delle cerimonie burocratiche e degli sprint infiniti",
    component: AgileMorto,
    image: "images/provocations/agile-morto.webp",
    transition: "fade-scale",
    transitionDurationMs: 600,
  },
  {
    id: "societa-consulenza",
    title: "Le società di consulenza falliranno",
    subtitle: "La crisi del body rental e delle tariffe orarie",
    component: ConsulenzaFallisce,
    image: "images/provocations/consulenza-fallisce.webp",
    transition: "fade-scale",
    transitionDurationMs: 600,
  },
  {
    id: "team-grandi-controproducenti",
    title: "I team grandi (da 2 persone in su) sono controproducenti",
    subtitle: "Il sovraccarico di coordinamento vs la velocità del singolo dev con AI",
    component: TeamGrandiControproducenti,
    image: "images/provocations/team-grandi-controproducenti.webp",
    transition: "fade-scale",
    transitionDurationMs: 600,
  },
  {
    id: "open-source-morto",
    title: "L’open source è morto",
    subtitle: "Modelli proprietari, licenze e crisi del patto con la community",
    component: OpenSourceMorto,
    image: "images/provocations/open-source-morto.webp",
    transition: "fade-scale",
    transitionDurationMs: 600,
  },
  {
    id: "colloquio-tecnico",
    title: "Il colloquio tecnico sul codice non ha più senso",
    subtitle: "La fine dei puzzle algoritmici su LeetCode",
    component: ColloquioTecnicoInutile,
    image: "images/provocations/colloquio-tecnico-inutile.webp",
    transition: "fade-scale",
    transitionDurationMs: 600,
  },
  {
    id: "sviluppo-software-morto",
    title: "Il mondo dello sviluppo software è morto",
    subtitle: "I dev lavoreranno più a contatto col “mondo reale”",
    component: LavoroSviluppatoreFinito,
    image: "images/provocations/sviluppo-software-morto.webp",
    transition: "fade-scale",
    transitionDurationMs: 600,
  },
  {
    id: "esperto-tecnologia",
    title: "Non ha più senso diventare esperti in una tecnologia specifica",
    subtitle: "Dalla sintassi dei framework all'orchestrazione architetturale",
    component: EspertiVerticaliInutili,
    image: "images/provocations/esperti-verticali-inutili.webp",
    transition: "fade-scale",
    transitionDurationMs: 600,
  },
] as const;

export const PROVOCATION_MAP = new Map<string, ProvocationDefinition>(
  PROVOCATIONS.map((p) => [p.id, p])
);
