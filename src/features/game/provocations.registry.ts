import type { ProvocationDefinition } from "../../types";
import { Provocation01 } from "./provocations/Provocation01";
import { Provocation02 } from "./provocations/Provocation02";
import { Provocation03 } from "./provocations/Provocation03";
import { Provocation04 } from "./provocations/Provocation04";
import { Provocation05 } from "./provocations/Provocation05";
import { Provocation06 } from "./provocations/Provocation06";
import { Provocation07 } from "./provocations/Provocation07";
import { Provocation08 } from "./provocations/Provocation08";
import { Provocation09 } from "./provocations/Provocation09";

export const PROVOCATIONS: readonly ProvocationDefinition[] = [
  {
    id: "saas-morto",
    title: "Il SaaS è morto: meglio un software generato su misura",
    subtitle: "Software su misura per la propria azienda vs licenze SaaS",
    component: Provocation01,
  },
  {
    id: "societa-consulenza",
    title: "Le società di consulenza falliranno",
    subtitle: "La crisi del body rental e delle tariffe orarie",
    component: Provocation02,
  },
  {
    id: "sviluppo-software-morto",
    title: "Il mondo dello sviluppo software è morto",
    subtitle: "I dev lavoreranno più a contatto col “mondo reale”",
    component: Provocation03,
  },
  {
    id: "colloquio-tecnico",
    title: "Il colloquio tecnico sul codice non ha più senso",
    subtitle: "La fine dei puzzle algoritmici su LeetCode",
    component: Provocation04,
  },
  {
    id: "esperto-tecnologia",
    title: "Non ha più senso diventare esperti in una tecnologia specifica",
    subtitle: "Dalla sintassi dei framework all'orchestrazione architetturale",
    component: Provocation05,
  },
  {
    id: "open-source-morto",
    title: "L’open source è morto",
    subtitle: "Modelli proprietari, licenze e crisi del patto con la community",
    component: Provocation06,
  },
  {
    id: "software-usa-e-getta",
    title: "Il Software diventerà usa e getta",
    subtitle: "Rigenerare da zero batte la manutenzione del debito legacy",
    component: Provocation07,
  },
  {
    id: "agile-morto",
    title: "AGILE è finalmente morto",
    subtitle: "La fine delle cerimonie burocratiche e degli sprint infiniti",
    component: Provocation08,
  },
  {
    id: "team-grandi-controproducenti",
    title: "I team grandi (da 2 persone in su) sono controproducenti",
    subtitle: "Il sovraccarico di coordinamento vs la velocità del singolo dev con AI",
    component: Provocation09,
  },
] as const;

export const PROVOCATION_MAP = new Map<string, ProvocationDefinition>(
  PROVOCATIONS.map((p) => [p.id, p])
);
