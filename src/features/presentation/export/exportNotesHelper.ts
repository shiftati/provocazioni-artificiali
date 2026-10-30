import type jsPDF from "jspdf";
import type { SlideExportFrame } from "./pdfExport.types";
import {
  SLIDE_NOTES,
  PROVOCATION_NOTES,
  type SpeakerNote,
} from "../../speaker/speakerNotes";

export interface TextAnnotationOptions {
  type: "text" | "freetext" | "link";
  title?: string;
  contents?: string;
  bounds?: { x: number; y: number; w: number; h: number };
  open?: boolean;
}

/**
 * Pulisce il testo grezzo delle note dello speaker per l'esportazione:
 * - Sostituisce i tag dello speaker [[Speaker]] con l'etichetta leggibile (es. "Daniel: ", "Ste: ")
 * - RIMUOVE completamente le note di regia e didascalie inline [es. Pausa d'effetto, Chiedere di alzare la mano]
 * - Rimuove i marcatori markdown di formattazione (*bold*, _italic_)
 */
export function cleanNotesForPdf(rawText?: string): string {
  if (!rawText) return "";
  let text = rawText;

  // 1. Rimuovi note di regia e didascalie inline [Didascalia / Regia] (parentesi quadre singole, non doppie)
  text = text.replace(/(?<!\[)\[(?!\[)([^\]\n]+)\]/g, "");

  // 2. Tag speaker [[Speaker]]
  text = text.replace(/\[\[(Daniel|DANIEL)\]\]/gi, "\nDaniel: ");
  text = text.replace(/\[\[(Ste|STE|Stefano)\]\]/gi, "\nSte: ");
  text = text.replace(/\[\[(Klippy|KLIPPY)\]\]/gi, "\nKlippy: ");
  text = text.replace(/\[\[(Entrambi|Tutti|Both)\]\]/gi, "\nEntrambi: ");
  text = text.replace(/\[\[(.*?)\]\]/g, "\n$1: ");

  // 3. Rimuovi marcatori di grassetto e corsivo (*bold*, _italic_)
  text = text.replace(/\*+/g, "");
  text = text.replace(/_+/g, "");

  // 4. Pulizia spazi bianchi e righe vuote in eccesso
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

export interface FrameSpeakerNoteData {
  note: SpeakerNote | null;
  title: string;
  cleanedNotes: string;
  hasNotes: boolean;
}

/**
 * Recupera la nota dello speaker associata al frame corrente (escludendo note di regia).
 */
export function getSpeakerNoteForFrame(
  frame: SlideExportFrame,
): FrameSpeakerNoteData {
  let note: SpeakerNote | null = null;
  if (frame.isProvocation) {
    const pId = frame.slideId.replace(/^provocation-/, "");
    note = PROVOCATION_NOTES[pId] || null;
  } else {
    note = SLIDE_NOTES[frame.slideId] || null;
  }

  const title = frame.stepDescription
    ? `${frame.slideTitle} (${frame.stepDescription})`
    : frame.slideTitle;

  const cleanedNotes = cleanNotesForPdf(note?.notes);
  const hasNotes = Boolean(cleanedNotes);

  return {
    note,
    title,
    cleanedNotes,
    hasNotes,
  };
}

/**
 * Crea il testo da includere nell'annotazione PDF (Sticky Note),
 * contenente esclusivamente il discorso dello speaker (senza note di regia).
 */
export function buildPdfAnnotationContent(
  frame: SlideExportFrame,
  noteData: FrameSpeakerNoteData,
): string {
  const parts: string[] = [];

  if (frame.stepDescription) {
    parts.push(`[Stato animazione: ${frame.stepDescription}]`);
  }

  if (noteData.cleanedNotes) {
    parts.push(noteData.cleanedNotes);
  } else {
    parts.push("(Nessun discorso registrato per questa slide)");
  }

  return parts.join("\n\n");
}

/**
 * Aggiunge un'annotazione di testo (Sticky Note) alla pagina corrente del PDF.
 */
export function addTextAnnotation(
  pdf: jsPDF,
  title: string,
  contents: string,
  bounds: { x: number; y: number; w: number; h: number },
): void {
  try {
    const rawPdf = pdf as unknown as {
      createAnnotation?: (options: TextAnnotationOptions) => void;
    };
    if (typeof rawPdf.createAnnotation === "function") {
      rawPdf.createAnnotation({
        type: "text",
        title: title || "Note Speaker",
        contents: contents || "",
        bounds: bounds || { x: 30, y: 30, w: 32, h: 32 },
        open: false,
      });
    }
  } catch (err) {
    console.warn("Impossibile aggiungere l'annotazione PDF:", err);
  }
}

/**
 * Renderizza una pagina in formato A4 Portrait (210×297 mm) stile Dispensa:
 * Miniatura slide 16:9 in alto + discorso dello speaker pulito in basso (senza note di regia).
 */
export function renderA4HandoutPage(
  pdf: jsPDF,
  slideDataUrl: string,
  frame: SlideExportFrame,
  frameIndex: number,
  totalFrames: number,
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  const slideHeight = contentWidth * (9 / 16); // 102.375 mm

  // Intestazione in alto
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 115, 135);
  pdf.text("PROVOCAZIONI ARTIFICIALI • CODEMOTION 2026", margin, 10);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Pagina ${frameIndex + 1} di ${totalFrames}`,
    pageWidth - margin,
    10,
    { align: "right" },
  );

  // Immagine Slide (16:9)
  pdf.addImage(
    slideDataUrl,
    "JPEG",
    margin,
    13,
    contentWidth,
    slideHeight,
    undefined,
    "FAST",
  );

  // Bordo sottile attorno all'immagine della slide
  pdf.setDrawColor(210, 220, 230);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, 13, contentWidth, slideHeight);

  // Titolo della slide sotto l'immagine
  let y = 13 + slideHeight + 7;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42);
  pdf.text(frame.slideTitle, margin, y);

  if (frame.stepDescription) {
    const titleWidth = pdf.getTextWidth(frame.slideTitle);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(90, 105, 125);
    pdf.text(
      ` • Passo ${(frame.step ?? 0) + 1} di ${frame.totalSteps ?? 1} (${frame.stepDescription})`,
      margin + titleWidth,
      y,
    );
  }

  const noteData = getSpeakerNoteForFrame(frame);

  // Card contenitore per le note dello speaker
  y += 4;
  const cardY = y;
  const cardHeight = pageHeight - cardY - 12;
  pdf.setDrawColor(225, 232, 240);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, cardY, contentWidth, cardHeight, 2, 2, "FD");

  let noteY = cardY + 6;
  const noteMargin = margin + 5;
  const noteWidth = contentWidth - 10;

  // Header sezione note
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(230, 80, 20); // Colore accento arancio
  pdf.text("NOTE DELLO SPEAKER", noteMargin, noteY);
  noteY += 4.5;

  if (noteData.hasNotes) {
    if (noteData.cleanedNotes) {
      // Adattamento dinamico della dimensione font per testi molto lunghi
      let fontSize = 9;
      let lineHeight = 3.8;
      let splitNotes = pdf.splitTextToSize(noteData.cleanedNotes, noteWidth);
      const availableHeight = cardHeight - 16;

      if (splitNotes.length * lineHeight > availableHeight) {
        fontSize = 8;
        lineHeight = 3.3;
        pdf.setFontSize(fontSize);
        splitNotes = pdf.splitTextToSize(noteData.cleanedNotes, noteWidth);
      }
      if (splitNotes.length * lineHeight > availableHeight) {
        fontSize = 7.5;
        lineHeight = 3.1;
        pdf.setFontSize(fontSize);
        splitNotes = pdf.splitTextToSize(noteData.cleanedNotes, noteWidth);
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(fontSize);
      pdf.setTextColor(30, 41, 59);
      pdf.text(splitNotes, noteMargin, noteY);
    }
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      "(Nessuna nota dello speaker registrata per questa slide)",
      noteMargin,
      noteY + 2,
    );
  }

  // Piè di pagina
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text("Shiftati di Testa • Daniel & Ste", margin, pageHeight - 5);

  // Aggiungi anche l'annotazione PDF (Sticky Note) per consultazione rapida
  addTextAnnotation(
    pdf,
    `Note Speaker: ${noteData.title}`,
    buildPdfAnnotationContent(frame, noteData),
    { x: margin, y: 13, w: 10, h: 10 },
  );
}
