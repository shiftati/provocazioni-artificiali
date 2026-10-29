import type { ComponentType } from "react";
import type { SlideProps, SlideDefinition, ProvocationDefinition } from "../../../types";
import { PROVOCATIONS } from "../../game/provocations.registry";

export interface SlideExportFrame {
  frameIndex: number;
  slideIndex: number;
  slideId: string;
  slideTitle: string;
  component: ComponentType<SlideProps>;
  step?: number;
  totalSteps?: number;
  stepDescription?: string;
  isProvocation?: boolean;
}

export function getStepDescription(slideId: string, step?: number): string | undefined {
  if (step === undefined) return undefined;
  if (slideId === "daniel-e-ste") {
    switch (step) {
      case 0:
        return "Solo Stefano";
      case 1:
        return "Compare Daniel";
      case 2:
        return "Compare Klippy";
      default:
        return `Passo ${step + 1}`;
    }
  }
  if (slideId === "fight-club") {
    switch (step) {
      case 0:
        return "Sfondo iniziale";
      case 1:
        return "Regola 1: Dovete parlare";
      case 2:
        return "Regola 2: 30 secondi per proporre";
      case 3:
        return "Regola 3: 5 minuti per discutere";
      default:
        return `Passo ${step + 1}`;
    }
  }
  if (slideId === "finale") {
    switch (step) {
      case 0:
        return "Sfondo iniziale";
      case 1:
        return "Primo fumetto";
      case 2:
        return "Secondo fumetto & QR Code";
      default:
        return `Passo ${step + 1}`;
    }
  }
  return `Passo ${step + 1}`;
}

export function buildExportFrames(
  slides: readonly SlideDefinition[],
  provocations: readonly ProvocationDefinition[] = PROVOCATIONS,
  introEndSlide?: number
): SlideExportFrame[] {
  const frames: SlideExportFrame[] = [];
  let frameIndex = 0;

  // Escludi lo schermo nero finale ("nero") come richiesto
  const exportableSlides = slides.filter((slide) => slide.id !== "nero");

  // Identifica il punto in cui si apre il gioco:
  // Di default dopo la slide "klippy-matrix" oppure introEndSlide se configurato
  const targetEndId = "klippy-matrix";

  exportableSlides.forEach((slide, slideIndex) => {
    // 1. Aggiungi la slide corrente (con o senza step di animazione)
    if (slide.animationSteps && slide.animationSteps.length > 0) {
      slide.animationSteps.forEach((step) => {
        frames.push({
          frameIndex: frameIndex++,
          slideIndex,
          slideId: slide.id,
          slideTitle: slide.title,
          component: slide.component,
          step,
          totalSteps: slide.animationSteps!.length,
          stepDescription: getStepDescription(slide.id, step),
        });
      });
    } else {
      frames.push({
        frameIndex: frameIndex++,
        slideIndex,
        slideId: slide.id,
        slideTitle: slide.title,
        component: slide.component,
      });
    }

    // 2. Quando siamo dopo la slide di Klippy Matrix (o introEndSlide), inserisci tutte le provocazioni
    const isGameOpenPoint =
      slide.id === targetEndId ||
      (typeof introEndSlide === "number" && slideIndex === introEndSlide - 1);

    if (isGameOpenPoint) {
      provocations.forEach((provocation, pIdx) => {
        frames.push({
          frameIndex: frameIndex++,
          slideIndex: slideIndex + 1 + pIdx,
          slideId: `provocation-${provocation.id}`,
          slideTitle: `Provocazione: ${provocation.title}`,
          component: provocation.component as ComponentType<SlideProps>,
          isProvocation: true,
        });
      });
    }
  });

  return frames;
}
