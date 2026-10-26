import { useState, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { SLIDES } from "../presentation/slides.registry";
import { SLIDE_NOTES, type SpeakerNote } from "./speakerNotes";
import { renderFormattedSpeakerNotes } from "./speakerNotesFormatter";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SlidesIcon,
  CopyIcon,
  CheckIcon,
} from "../../components/icons";
import styles from "./SpeakerView.module.scss";

export const ScriptView: FC = () => {
  const navigate = useNavigate();
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("rasbora_speaker_font_size");
    return saved ? parseInt(saved, 10) : 18;
  });
  const [copied, setCopied] = useState<boolean>(false);

  const totalSlides = SLIDES.length;
  const currentSlide = SLIDES[currentSlideIndex];
  const slideId = currentSlide?.id;
  const currentNote: SpeakerNote | null | undefined = slideId
    ? SLIDE_NOTES[slideId]
    : null;

  const activeBadge = `Slide ${currentSlideIndex + 1} di ${totalSlides}`;
  const activeTitle =
    currentNote?.title ||
    currentSlide?.title ||
    `Slide ${currentSlideIndex + 1}`;

  useEffect(() => {
    document.title = `Script - Slide ${currentSlideIndex + 1}/${totalSlides} · ${activeTitle}`;
  }, [currentSlideIndex, totalSlides, activeTitle]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentSlideIndex]);

  const handleFontSizeChange = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(14, Math.min(32, prev + delta));
      localStorage.setItem("rasbora_speaker_font_size", next.toString());
      return next;
    });
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
  };

  const handleCopyNotes = async () => {
    const textToCopy = currentNote?.notes?.trim();
    if (!textToCopy) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Errore durante la copia del testo negli appunti:", err);
    }
  };

  // Standalone keyboard navigation (left / right arrow, page up / page down, space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSlides]);

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <span className={styles.brandTitle}>📜 Script</span>
          <span
            className={styles.syncBadge}
            style={{
              background: "rgba(88, 166, 255, 0.15)",
              color: "#58a6ff",
              borderColor: "rgba(88, 166, 255, 0.4)",
            }}
          >
            <span
              className={styles.syncDot}
              style={{
                backgroundColor: "#58a6ff",
                boxShadow: "0 0 8px #58a6ff",
              }}
            />
            Standalone
          </span>
        </div>

        <div className={styles.controlsGroup}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => handleFontSizeChange(-1)}
            title="Riduci dimensione testo"
          >
            A-
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => handleFontSizeChange(1)}
            title="Aumenta dimensione testo"
          >
            A+
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.headerCard}>
          <span className={styles.modeBadge}>{activeBadge}</span>
          <h1 className={styles.slideHeading}>{activeTitle}</h1>
        </div>

        <div className={styles.notesCard}>
          <div className={styles.notesCardHeader}>
            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopyNotes}
              disabled={!currentNote?.notes}
              title={copied ? "Copiato negli appunti!" : "Copia testo note"}
              aria-label="Copia testo note"
            >
              {copied ? (
                <>
                  <CheckIcon size={14} />
                  <span>Copiato!</span>
                </>
              ) : (
                <>
                  <CopyIcon size={14} />
                  <span>Copia testo</span>
                </>
              )}
            </button>
          </div>

          <div
            className={styles.notesBody}
            style={{ fontSize: `${fontSize}px` }}
          >
            {currentNote?.notes ? (
              renderFormattedSpeakerNotes(currentNote.notes)
            ) : (
              <p style={{ color: "#8b949e", fontStyle: "italic" }}>
                Nessuna nota specifica per questa slide. Presenta liberamente i
                contenuti a schermo.
              </p>
            )}
          </div>
        </div>

        {currentNote?.hints && (
          <div className={styles.hintsCard}>
            <span className={styles.hintsLabel}>💡 Suggerimento & Regia</span>
            <div className={styles.hintsBody}>
              {renderFormattedSpeakerNotes(currentNote.hints)}
            </div>
          </div>
        )}
      </main>

      <footer className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <button
            type="button"
            className={styles.bottomNavBtn}
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            title={currentSlideIndex === 0 ? "Prima slide" : "Slide precedente"}
            aria-label="Slide precedente"
          >
            <ArrowLeftIcon size={16} />
          </button>

          <div
            className={styles.bottomModeGroup}
            role="group"
            aria-label="Modalità"
          >
            <button
              type="button"
              className={`${styles.bottomModeBtn} ${styles.bottomModeBtnActive}`}
              onClick={() => navigate("/slide")}
              title="Vai alla presentazione slide (/slide)"
              aria-label="Vai alla presentazione slide (/slide)"
            >
              <SlidesIcon size={14} />
              <span>Slide</span>
            </button>
          </div>

          <button
            type="button"
            className={styles.bottomNavBtn}
            onClick={handleNext}
            disabled={currentSlideIndex === totalSlides - 1}
            title={
              currentSlideIndex === totalSlides - 1
                ? "Ultima slide"
                : "Slide successiva"
            }
            aria-label="Slide successiva"
          >
            <ArrowRightIcon size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
};
