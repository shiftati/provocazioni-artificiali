import type { ComponentType } from "react";
import type { SlideProps, SlideDefinition } from "../../../types";

export interface SlideExportFrame {
  frameIndex: number;
  slideIndex: number;
  slideId: string;
  slideTitle: string;
  component: ComponentType<SlideProps>;
  step?: number;
  totalSteps?: number;
  stepDescription?: string;
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

export function buildExportFrames(slides: readonly SlideDefinition[]): SlideExportFrame[] {
  const frames: SlideExportFrame[] = [];
  let frameIndex = 0;

  // Escludi lo schermo nero finale ("nero") come richiesto
  const exportableSlides = slides.filter((slide) => slide.id !== "nero");

  exportableSlides.forEach((slide, slideIndex) => {
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
  });

  return frames;
}
