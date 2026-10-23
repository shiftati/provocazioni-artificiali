import { useState, useCallback, useEffect, type FC } from "react";
import {
  useSpeakerChannel,
  getCachedSpeakerState,
  type SpeakerMessagePayload,
  type SpeakerMessage,
} from "./useSpeakerChannel";
import {
  SLIDE_NOTES,
  PROVOCATION_NOTES,
  GAME_STATE_NOTES,
  type SpeakerNote,
} from "./speakerNotes";
import styles from "./SpeakerView.module.scss";

export const SpeakerView: FC = () => {
  const [state, setState] = useState<SpeakerMessagePayload | null>(() =>
    getCachedSpeakerState()
  );
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("rasbora_speaker_font_size");
    return saved ? parseInt(saved, 10) : 18;
  });
  const [pipActive, setPipActive] = useState<boolean>(false);

  // Check if browser supports modern Document Picture-in-Picture
  const isDocumentPipSupported =
    typeof window !== "undefined" && "documentPictureInPicture" in window;

  const handleMessage = useCallback((msg: SpeakerMessage) => {
    if (msg.type === "STATE_UPDATE") {
      setState(msg.payload);
    }
  }, []);

  const { send } = useSpeakerChannel(handleMessage);

  // Request latest state immediately on mount
  useEffect(() => {
    send({ type: "REQUEST_SYNC" });
    const timer = setTimeout(() => {
      send({ type: "REQUEST_SYNC" });
    }, 400);
    return () => clearTimeout(timer);
  }, [send]);

  const handleFontSizeChange = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(14, Math.min(32, prev + delta));
      localStorage.setItem("rasbora_speaker_font_size", next.toString());
      return next;
    });
  };

  const handleNext = () => {
    send({ type: "NAV_NEXT" });
  };

  const handlePrev = () => {
    send({ type: "NAV_PREV" });
  };

  // Keyboard navigation from speaker window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        send({ type: "NAV_NEXT" });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        send({ type: "NAV_PREV" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [send]);

  // Document Picture-in-Picture integration
  const togglePictureInPicture = async () => {
    if (!isDocumentPipSupported) return;

    try {
      const pip = (window as unknown as {
        documentPictureInPicture: {
          requestWindow: (options: { width: number; height: number }) => Promise<Window>;
          window?: Window | null;
        };
      }).documentPictureInPicture;

      if (pip.window) {
        pip.window.close();
        setPipActive(false);
        return;
      }

      const pipWin = await pip.requestWindow({
        width: 550,
        height: 450,
      });

      // Copy stylesheets to the PiP window so styling looks identical
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules]
            .map((rule) => rule.cssText)
            .join("");
          const style = pipWin.document.createElement("style");
          style.textContent = cssRules;
          pipWin.document.head.appendChild(style);
        } catch {
          if (styleSheet.href) {
            const link = pipWin.document.createElement("link");
            link.rel = "stylesheet";
            link.type = styleSheet.type;
            link.media = styleSheet.media.toString();
            link.href = styleSheet.href;
            pipWin.document.head.appendChild(link);
          }
        }
      });

      // Clone container to PiP
      const container = document.getElementById("speaker-view-root");
      if (container) {
        pipWin.document.body.appendChild(container);
      }

      setPipActive(true);

      pipWin.addEventListener("pagehide", () => {
        setPipActive(false);
        if (container) {
          document.body.appendChild(container);
        }
      });
    } catch (err) {
      console.warn("Document Picture-in-Picture error:", err);
    }
  };

  // Determine active note based on current mode & state
  let currentNote: SpeakerNote | null | undefined = null;
  let activeTitle = "";
  let activeBadge = "";
  let activeSubtitle = "";

  if (state) {
    if (state.mode === "game") {
      if (state.gameStep === "PROVOCATION" && state.provocationId) {
        currentNote = PROVOCATION_NOTES[state.provocationId] || null;
        activeBadge = "Provocazione Gioco";
        activeTitle =
          currentNote?.title || state.provocationTitle || "Provocazione";
        activeSubtitle = state.provocationSubtitle || "";
      } else if (state.gameStep === "DISCUSSION" && state.provocationId) {
        currentNote =
          PROVOCATION_NOTES[state.provocationId] ||
          GAME_STATE_NOTES.DISCUSSION;
        activeBadge = "Discussione in Corso (5 min)";
        activeTitle =
          currentNote?.title || state.provocationTitle || "Discussione";
        activeSubtitle = state.provocationSubtitle || "";
      } else {
        currentNote =
          GAME_STATE_NOTES[state.gameStep] || GAME_STATE_NOTES.IDLE;
        activeBadge = `Gioco · ${state.gameStep}`;
        activeTitle = currentNote?.title || "Fase di Gioco";
      }
    } else {
      // Presentation slide
      currentNote = SLIDE_NOTES[state.slideId] || null;
      activeBadge = `Slide ${state.slideIndex + 1} di ${state.totalSlides || 14}`;
      activeTitle = currentNote?.title || state.slideTitle || `Slide ${state.slideIndex + 1}`;
    }
  }

  // Helper to format quote brackets [Dire qui: ...]
  const renderFormattedNotes = (text: string) => {
    // Split on brackets [ ... ]
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        return (
          <mark key={i} className={styles.speakerQuote}>
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className={styles.container} id="speaker-view-root">
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <span className={styles.brandTitle}>
            🎙️ Supporto Testuale
          </span>
          <span className={styles.syncBadge} title="Sincronizzato in tempo reale con lo stage principale">
            <span className={styles.syncDot} />
            Live
          </span>
        </div>

        <div className={styles.controlsGroup}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => handleFontSizeChange(-2)}
            title="Riduci dimensione testo"
          >
            A-
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => handleFontSizeChange(2)}
            title="Aumenta dimensione testo"
          >
            A+
          </button>

          {isDocumentPipSupported && (
            <button
              type="button"
              className={styles.toolButton}
              onClick={togglePictureInPicture}
              title="Attiva / disattiva Picture-in-Picture sempre in primo piano"
            >
              {pipActive ? "Finestra standard" : "Picture-in-Picture"}
            </button>
          )}
        </div>
      </header>

      {!state ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>In attesa della presentazione...</div>
          <p>
            Apri la presentazione principale per sincronizzare automaticamente i testi e le note della slide corrente.
          </p>
        </div>
      ) : (
        <main className={styles.mainContent}>
          <div className={styles.headerCard}>
            <span className={styles.modeBadge}>{activeBadge}</span>
            <h1 className={styles.slideHeading}>{activeTitle}</h1>
            {activeSubtitle && (
              <p className={styles.subtitleText}>{activeSubtitle}</p>
            )}
          </div>

          <div className={styles.notesCard}>
            <span className={styles.sectionLabel}>
              🗣️ Cosa dire / Punti da esporre
            </span>
            <div
              className={styles.notesBody}
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentNote?.notes ? (
                renderFormattedNotes(currentNote.notes)
              ) : (
                <p style={{ color: "#8b949e", fontStyle: "italic" }}>
                  Nessuna nota specifica per questa slide. Presenta liberamente i contenuti a schermo.
                </p>
              )}
            </div>
          </div>

          {currentNote?.hints && (
            <div className={styles.hintsCard}>
              <span className={styles.hintsLabel}>💡 Suggerimento & Regia</span>
              <p className={styles.hintsBody}>{currentNote.hints}</p>
            </div>
          )}

          <footer className={styles.footerControls}>
            <button
              type="button"
              className={styles.navButton}
              onClick={handlePrev}
              title="Indietro (Freccia Sinistra / PageUp)"
            >
              ◀ Precedente
            </button>

            <button
              type="button"
              className={styles.navButton}
              onClick={handleNext}
              title="Avanti (Freccia Destra / Spazio / PageDown)"
            >
              Successiva ▶
            </button>
          </footer>
        </main>
      )}
    </div>
  );
};
