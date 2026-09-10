import type { ProvocationDefinition } from "../../types";
import { Provocation01 } from "./provocations/Provocation01";
import { Provocation02 } from "./provocations/Provocation02";
import { Provocation03 } from "./provocations/Provocation03";
import { Provocation04 } from "./provocations/Provocation04";
import { Provocation05 } from "./provocations/Provocation05";
import { Provocation06 } from "./provocations/Provocation06";

export const PROVOCATIONS: readonly ProvocationDefinition[] = [
  {
    id: "ai-coding",
    title: "Il codice migliore è quello che non devi scrivere",
    subtitle: "AI Coding e debito tecnico istantaneo",
    component: Provocation01,
  },
  {
    id: "monolith",
    title: "I microservizi erano solo una scusa per le cartelle",
    subtitle: "La rinascita del monolite modulare",
    component: Provocation02,
  },
  {
    id: "friday-meetings",
    title: "I meeting tecnici del venerdì pomeriggio",
    subtitle: "Violazione dei diritti umani degli sviluppatori",
    component: Provocation03,
  },
  {
    id: "mock-testing",
    title: "I test sui mock dei mock sono teatro d'avanguardia",
    subtitle: "L'illusione della copertura al 100%",
    component: Provocation04,
  },
  {
    id: "cowboy-deploy",
    title: "Se non fai push su main dal palco ti manca il brivido",
    subtitle: "L'audacia del deploy in diretta",
    component: Provocation05,
  },
  {
    id: "clean-docs",
    title: "La documentazione perfetta esiste solo nei prompt",
    subtitle: "La fine del mito del codice che si autodocumenta",
    component: Provocation06,
  },
] as const;

export const PROVOCATION_MAP = new Map<string, ProvocationDefinition>(
  PROVOCATIONS.map((p) => [p.id, p])
);
