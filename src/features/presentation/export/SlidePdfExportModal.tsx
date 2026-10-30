import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type FC,
} from "react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import {
  PdfIcon,
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  RefreshIcon,
  SlidesIcon,
  SpeakerNoteIcon,
} from "../../../components/icons";
import { SLIDES } from "../slides.registry";
import { PROVOCATIONS } from "../../game/provocations.registry";
import { useAppState } from "../../../state/AppStateContext";
import { buildExportFrames, type SlideExportFrame } from "./pdfExport.types";
import {
  getSpeakerNoteForFrame,
  buildPdfAnnotationContent,
  addTextAnnotation,
  renderA4HandoutPage,
} from "./exportNotesHelper";
import styles from "./SlidePdfExportModal.module.scss";

export interface SlidePdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Attende il primo giro completo di loop di Klippy nella Slide 1 (Titolo).
 * Klippy entra a 2.7s e compie un loop di 13s, terminando con l'evento 'animationiteration'.
 */
function waitForTitoloLoop(
  stageEl: HTMLElement,
  abortRef: React.RefObject<boolean>,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const runner = stageEl.querySelector<HTMLElement>(
      '[class*="klippyRunner"]',
    );
    if (!runner) {
      setTimeout(resolve, 15700);
      return;
    }

    let settled = false;
    let timerId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    const cleanUpAndResolve = () => {
      if (settled) return;
      settled = true;
      runner.removeEventListener("animationiteration", onIteration);
      clearTimeout(timerId);
      clearInterval(intervalId);
      resolve();
    };

    const onIteration = () => {
      cleanUpAndResolve();
    };

    runner.addEventListener("animationiteration", onIteration, { once: true });

    // Fallback a 16.2s in caso l'evento non venga intercettato
    timerId = setTimeout(() => {
      cleanUpAndResolve();
    }, 16200);

    // Controlla abort periodicamente
    intervalId = setInterval(() => {
      if (abortRef.current) {
        cleanUpAndResolve();
      }
    }, 100);
  });
}

/**
 * Attende che entri completamente il personaggio (Metroman) nella Slide 3 (Developer qualunque).
 * L'animazione dura 0.95s con 0.2s di ritardo e conclude con 'animationend'.
 */
function waitForMetromanEntrance(
  stageEl: HTMLElement,
  abortRef: React.RefObject<boolean>,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const container = stageEl.querySelector<HTMLElement>(
      '[class*="metromanContainer"]',
    );
    if (!container) {
      setTimeout(resolve, 1300);
      return;
    }

    let settled = false;
    let timerId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    const cleanUpAndResolve = () => {
      if (settled) return;
      settled = true;
      container.removeEventListener("animationend", onEnd);
      clearTimeout(timerId);
      clearInterval(intervalId);
      resolve();
    };

    const onEnd = () => {
      cleanUpAndResolve();
    };

    container.addEventListener("animationend", onEnd, { once: true });

    // Fallback a 1.4s
    timerId = setTimeout(() => {
      cleanUpAndResolve();
    }, 1400);

    // Controlla abort periodicamente
    intervalId = setInterval(() => {
      if (abortRef.current) {
        cleanUpAndResolve();
      }
    }, 100);
  });
}

export const SlidePdfExportModal: FC<SlidePdfExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme, config } = useAppState();

  const frames = useMemo(
    () => buildExportFrames(SLIDES, PROVOCATIONS, config.introEndSlide),
    [config.introEndSlide],
  );
  const totalFrames = frames.length;
  const totalDistinctItems = useMemo(
    () => SLIDES.filter((s) => s.id !== "nero").length + PROVOCATIONS.length,
    [],
  );

  const [exportFormat, setExportFormat] = useState<"slides" | "handout">(
    "slides",
  );
  const [includeAnnotations, setIncludeAnnotations] = useState<boolean>(true);
  const [exportState, setExportState] = useState<
    "idle" | "exporting" | "completed" | "error"
  >("idle");
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [waitStatusText, setWaitStatusText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<boolean>(false);
  const pdfInstanceRef = useRef<jsPDF | null>(null);
  const savedFilenameRef = useRef<string>("provocazioni-artificiali-slide.pdf");

  const currentFrame: SlideExportFrame | undefined = frames[currentFrameIndex];

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setExportState("idle");
      setCurrentFrameIndex(0);
      setWaitStatusText(null);
      setErrorMessage(null);
      abortRef.current = false;
    } else {
      abortRef.current = true;
    }
  }, [isOpen]);

  const handleStartExport = useCallback(async () => {
    setExportState("exporting");
    setErrorMessage(null);
    setWaitStatusText(null);
    abortRef.current = false;

    const isHandout = exportFormat === "handout";
    const filename = isHandout
      ? "provocazioni-artificiali-dispense-note.pdf"
      : includeAnnotations
        ? "provocazioni-artificiali-slide-con-note.pdf"
        : "provocazioni-artificiali-slide.pdf";

    savedFilenameRef.current = filename;

    try {
      const pdf = isHandout
        ? new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
          })
        : new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [1920, 1080],
            hotfixes: ["px_scaling"],
          });
      pdfInstanceRef.current = pdf;

      for (let i = 0; i < frames.length; i++) {
        if (abortRef.current) {
          setExportState("idle");
          return;
        }

        const frame = frames[i];
        if (!frame) continue;
        setCurrentFrameIndex(i);

        // Wait for React to mount and apply styles
        await new Promise((resolve) =>
          requestAnimationFrame(() => setTimeout(resolve, 80)),
        );

        const stageEl = stageRef.current;
        if (!stageEl) {
          throw new Error("Elemento stage di esportazione non disponibile.");
        }

        // Wait for all images inside stage to be loaded and decoded
        const imgs = Array.from(stageEl.querySelectorAll("img"));
        if (imgs.length > 0) {
          await Promise.all(
            imgs.map((img) => {
              if (img.complete && img.naturalWidth > 0)
                return Promise.resolve();
              return new Promise<void>((res) => {
                const finish = () => res();
                img.addEventListener("load", finish, { once: true });
                img.addEventListener("error", finish, { once: true });
                setTimeout(finish, 600); // safety fallback timeout
              });
            }),
          );
        }

        if (abortRef.current) {
          setExportState("idle");
          return;
        }

        // Slide 1 (Titolo): attendi la fine del primo giro di loop di Klippy
        if (frame.slideId === "titolo") {
          setWaitStatusText(
            "Attesa completamento primo giro di loop di Klippy...",
          );
          await waitForTitoloLoop(stageEl, abortRef);
          setWaitStatusText(null);
        }

        // Slide 3 (Developer qualunque): attendi che entri il personaggio (Metroman)
        if (frame.slideId === "developer-qualunque") {
          setWaitStatusText("Attesa ingresso completo del personaggio...");
          await waitForMetromanEntrance(stageEl, abortRef);
          setWaitStatusText(null);
        }

        if (abortRef.current) {
          setExportState("idle");
          return;
        }

        // Additional brief delay to ensure layout and GPU paint settle
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (abortRef.current) {
          setExportState("idle");
          return;
        }

        // Capture slide node to JPEG
        const dataUrl = await toJpeg(stageEl, {
          quality: 0.94,
          width: 1920,
          height: 1080,
          pixelRatio: 1,
          cacheBust: false,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              if (
                node.classList.contains("audioControls") ||
                node
                  .getAttribute("aria-label")
                  ?.toLowerCase()
                  .includes("audio") ||
                node.tagName.toLowerCase() === "audio"
              ) {
                return false;
              }
            }
            return true;
          },
        });

        if (abortRef.current) {
          setExportState("idle");
          return;
        }

        if (isHandout) {
          if (i > 0) {
            pdf.addPage("a4", "portrait");
          }
          renderA4HandoutPage(pdf, dataUrl, frame, i, frames.length);
        } else {
          if (i === 0) {
            pdf.addImage(dataUrl, "JPEG", 0, 0, 1920, 1080, undefined, "FAST");
          } else {
            pdf.addPage([1920, 1080], "landscape");
            pdf.addImage(dataUrl, "JPEG", 0, 0, 1920, 1080, undefined, "FAST");
          }

          if (includeAnnotations) {
            const noteData = getSpeakerNoteForFrame(frame);
            const annotationContent = buildPdfAnnotationContent(
              frame,
              noteData,
            );
            addTextAnnotation(
              pdf,
              `Note Speaker: ${noteData.title}`,
              annotationContent,
              { x: 40, y: 40, w: 32, h: 32 },
            );
          }
        }
      }

      // Download file
      pdf.save(filename);
      setExportState("completed");
    } catch (err) {
      console.error("Errore durante l'esportazione del PDF delle slide:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Errore sconosciuto durante l'esportazione.",
      );
      setExportState("error");
    }
  }, [exportFormat, includeAnnotations, frames]);

  const handleCancel = useCallback(() => {
    abortRef.current = true;
    setExportState("idle");
    setWaitStatusText(null);
    onClose();
  }, [onClose]);

  const handleDownloadAgain = useCallback(() => {
    if (pdfInstanceRef.current) {
      pdfInstanceRef.current.save(savedFilenameRef.current);
    } else {
      handleStartExport();
    }
  }, [handleStartExport]);

  const percent =
    totalFrames > 0
      ? Math.round(((currentFrameIndex + 1) / totalFrames) * 100)
      : 0;

  const CurrentSlideComponent = currentFrame
    ? currentFrame.component
    : () => null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={exportState === "exporting" ? handleCancel : onClose}
        ariaLabel="Esporta slide in PDF"
      >
        <div className={styles.modalContent}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.titleGroup}>
              <div className={styles.iconWrapper}>
                <PdfIcon size={24} />
              </div>
              <div>
                <h2 className={styles.modalTitle}>Esporta Slide in PDF</h2>
                <div className={styles.modalSubtitle}>
                  Esportazione completa ad alta definizione (1920×1080)
                </div>
              </div>
            </div>
            {exportState !== "exporting" && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi finestra"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <CloseIcon size={20} />
              </button>
            )}
          </div>

          {/* Body based on State */}
          {exportState === "idle" && (
            <>
              {/* Format Selector Cards */}
              <div className={styles.formatSelectorSection}>
                <div className={styles.sectionHeading}>
                  Formato di Esportazione
                </div>
                <div
                  className={styles.formatCardsGrid}
                  role="radiogroup"
                  aria-label="Formato di esportazione PDF"
                >
                  {/* Card 1: 16:9 Presentazione */}
                  <button
                    type="button"
                    className={`${styles.formatCard} ${
                      exportFormat === "slides" ? styles.formatCardSelected : ""
                    }`}
                    onClick={() => setExportFormat("slides")}
                    role="radio"
                    aria-checked={exportFormat === "slides"}
                  >
                    <div className={styles.formatCardTop}>
                      <div className={styles.formatIconTitleGroup}>
                        <div className={styles.formatCardIcon}>
                          <SlidesIcon size={18} />
                        </div>
                        <span className={styles.formatCardTitle}>
                          Presentazione
                        </span>
                      </div>
                      <span className={styles.formatBadgePill}>
                        16:9 Full HD
                      </span>
                    </div>
                    <p className={styles.formatCardDesc}>
                      Slide a pieno schermo (1920×1080) per proiezione ad alta
                      qualità.
                    </p>
                  </button>

                  {/* Card 2: A4 Dispense con Note */}
                  <button
                    type="button"
                    className={`${styles.formatCard} ${
                      exportFormat === "handout"
                        ? styles.formatCardSelected
                        : ""
                    }`}
                    onClick={() => setExportFormat("handout")}
                    role="radio"
                    aria-checked={exportFormat === "handout"}
                  >
                    <div className={styles.formatCardTop}>
                      <div className={styles.formatIconTitleGroup}>
                        <div className={styles.formatCardIcon}>
                          <SpeakerNoteIcon size={18} />
                        </div>
                        <span className={styles.formatCardTitle}>
                          Dispense con Note
                        </span>
                      </div>
                      <span className={styles.formatBadgePill}>
                        A4 Stampabile
                      </span>
                    </div>
                    <p className={styles.formatCardDesc}>
                      Miniatura slide in alto con copione dello speaker
                      stampabile in basso.
                    </p>
                  </button>
                </div>
              </div>

              {/* Opzione note per formato 16:9 */}
              {exportFormat === "slides" && (
                <div className={styles.optionsBox}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={includeAnnotations}
                      onChange={(e) => setIncludeAnnotations(e.target.checked)}
                    />
                    <div>
                      <div className={styles.checkboxTitle}>
                        Includi note dello speaker come annotazioni PDF
                      </div>
                      <div className={styles.checkboxSubtitle}>
                        Aggiunge a ogni pagina una nota digitale consultabile
                        dal pannello &quot;Note / Commenti&quot; di Adobe
                        Acrobat, Anteprima macOS o browser.
                      </div>
                    </div>
                  </label>
                </div>
              )}

              <div className={styles.descriptionBox}>
                <span className={styles.badgePill}>
                  {totalDistinctItems} Slide & Provocazioni • {totalFrames}{" "}
                  Schermate totali
                </span>
                <p style={{ margin: 0 }}>
                  {exportFormat === "slides" ? (
                    <>
                      Verranno esportate tutte le slide della presentazione e
                      tutte le 9 provocazioni del gioco in formato PDF 16:9 a
                      pieno schermo (lo schermo nero finale viene escluso).
                      {includeAnnotations && (
                        <>
                          {" "}
                          In ogni pagina saranno incorporate le{" "}
                          <strong>note dello speaker</strong>.
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      Verrà generato un documento <strong>A4 verticale</strong>{" "}
                      stile dispensa: miniatura della slide in alto e
                      trascrizione integrale del discorso dello speaker (senza
                      note di regia) nella parte inferiore.
                    </>
                  )}
                </p>
                <p style={{ margin: "8px 0 0 0" }}>
                  Per ogni slide con animazioni (es. <em>Daniel e Ste</em>,{" "}
                  <em>Fight Club</em>, <em>Finale</em>), verrà creata una pagina
                  per ciascun passaggio.
                </p>
                <p style={{ margin: "8px 0 0 0" }}>
                  Per la <strong>slide 1 (Titolo)</strong> viene atteso il primo
                  giro del loop; per la{" "}
                  <strong>slide 3 (Developer qualunque)</strong> viene atteso
                  l&apos;ingresso del personaggio.
                </p>
                <p
                  style={{
                    margin: "8px 0 0 0",
                    color: "var(--color-mint)",
                    fontSize: "0.85rem",
                  }}
                >
                  ✓ Esclusi automaticamente il player dell&apos;audio, la top bar e i tasti di navigazione.
                </p>
              </div>

              <div className={styles.actionsRow}>
                <Button variant="ghost" size="md" onClick={onClose}>
                  Annulla
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartExport}
                  leftIcon={<DownloadIcon size={18} />}
                >
                  {exportFormat === "slides"
                    ? "Avvia Esportazione 16:9"
                    : "Avvia Esportazione Dispense A4"}
                </Button>
              </div>
            </>
          )}

          {exportState === "exporting" && (
            <>
              <div className={styles.progressSection}>
                <div className={styles.progressLabelRow}>
                  <span className={styles.currentSlideName}>
                    {currentFrame?.isProvocation ? (
                      <>
                        Schermata {currentFrameIndex + 1} di {totalFrames}:{" "}
                        {currentFrame?.slideTitle}
                        <span className={styles.provocationTag}>Gioco</span>
                      </>
                    ) : (
                      <>
                        Slide {currentFrameIndex + 1} di {totalFrames}:{" "}
                        {currentFrame?.slideTitle}
                      </>
                    )}
                  </span>
                  <span className={styles.percentageLabel}>{percent}%</span>
                </div>

                <div
                  className={styles.progressBarTrack}
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {waitStatusText ? (
                  <div className={styles.badgeWait}>
                    <span>⏳</span> {waitStatusText}
                  </div>
                ) : currentFrame?.stepDescription ? (
                  <div className={styles.stepHint}>
                    Stato animazione: {currentFrame.stepDescription}
                  </div>
                ) : null}
              </div>

              {/* Scaled Preview Frame */}
              <div className={styles.previewContainer}>
                <div className={styles.previewFrame}>
                  <div
                    className={styles.previewScaler}
                    style={{
                      transform: "scale(0.24)",
                    }}
                  >
                    <div
                      data-theme={theme}
                      style={{
                        width: "1920px",
                        height: "1080px",
                        position: "relative",
                        backgroundColor:
                          "var(--color-stage-bg, var(--color-bg))",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {currentFrame && (
                        <CurrentSlideComponent
                          key={`preview-${currentFrame.slideId}-${currentFrame.step ?? "single"}`}
                          step={currentFrame.step}
                          isReplay={true}
                          isExport={
                            currentFrame.slideId !== "titolo" &&
                            currentFrame.slideId !== "developer-qualunque"
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <Button variant="danger" size="md" onClick={handleCancel}>
                  Interrompi
                </Button>
              </div>
            </>
          )}

          {exportState === "completed" && (
            <>
              <div className={styles.successCard}>
                <div className={styles.successIcon}>
                  <CheckIcon size={44} />
                </div>
                <h3 className={styles.successTitle}>
                  PDF Generato con Successo!
                </h3>
                <p className={styles.successText}>
                  Il download del file{" "}
                  <strong>{savedFilenameRef.current}</strong> (
                  {totalFrames} pagine{" "}
                  {exportFormat === "handout"
                    ? "in formato A4 con copione"
                    : "a 1080p Full HD"}
                  ) è stato avviato.
                </p>
              </div>

              <div className={styles.actionsRow}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleDownloadAgain}
                  leftIcon={<DownloadIcon size={18} />}
                >
                  Scarica Ancora
                </Button>
                <Button variant="primary" size="md" onClick={onClose}>
                  Chiudi
                </Button>
              </div>
            </>
          )}

          {exportState === "error" && (
            <>
              <div className={styles.errorCard} role="alert">
                <strong>
                  Si è verificato un errore durante l'esportazione:
                </strong>
                <span>
                  {errorMessage || "Impossibile generare il file PDF."}
                </span>
              </div>

              <div className={styles.actionsRow}>
                <Button variant="ghost" size="md" onClick={onClose}>
                  Chiudi
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartExport}
                  leftIcon={<RefreshIcon size={18} />}
                >
                  Riprova
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Hidden 1920x1080 offscreen capture stage (active only while exporting) */}
      {exportState === "exporting" && currentFrame && (
        <div className={styles.offscreenCaptureContainer} aria-hidden="true">
          <div
            ref={stageRef}
            className={styles.offscreenStage}
            data-theme={theme}
          >
            <CurrentSlideComponent
              key={`export-node-${currentFrame.slideId}-${currentFrame.step ?? "single"}`}
              step={currentFrame.step}
              isReplay={true}
              isExport={
                currentFrame.slideId !== "titolo" &&
                currentFrame.slideId !== "developer-qualunque"
              }
            />
          </div>
        </div>
      )}
    </>
  );
};
