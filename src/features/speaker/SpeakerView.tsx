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
import { renderFormattedSpeakerNotes } from "./speakerNotesFormatter";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SlidesIcon,
  GameIcon,
} from "../../components/icons";
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

  const handleUiNext = () => {
    send({ type: "NAV_NEXT", source: "ui" });
  };

  const handleUiPrev = () => {
    send({ type: "NAV_PREV", source: "ui" });
  };

  const handleSetMode = (mode: "presentation" | "game") => {
    send({ type: "SET_MODE", mode });
  };

  // Keyboard navigation from speaker window (emulates physical keyboard on main screen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        send({ type: "NAV_NEXT", source: "keyboard" });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        send({ type: "NAV_PREV", source: "keyboard" });
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

  return (
    <div id="speaker-view-root" className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <span className={styles.brandTitle}>
            🎙️ Note Relatore
          </span>
          <span className={styles.syncBadge}>
            <span className={styles.syncDot} />
            Live Sync
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

          {isDocumentPipSupported && (
            <button
              type="button"
              className={styles.toolButton}
              onClick={togglePictureInPicture}
              title="Attiva/Disattiva Picture-in-Picture"
            >
              {pipActive ? "Finestra Standard" : "Picture-in-Picture"}
            </button>
          )}
        </div>
      </header>

      {!state ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>In attesa di connessione...</div>
          <p>
            Apri o naviga la presentazione principale per sincronizzare automaticamente le note dello speaker.
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
                renderFormattedSpeakerNotes(currentNote.notes)
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
              <div className={styles.hintsBody}>
                {renderFormattedSpeakerNotes(currentNote.hints)}
              </div>
            </div>
          )}
        </main>
      )}

      <footer className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <button
            type="button"
            className={styles.bottomNavBtn}
            onClick={handleUiPrev}
            title="Slide precedente"
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
              className={`${styles.bottomModeBtn} ${
                state?.mode === "presentation" ? styles.bottomModeBtnActive : ""
              }`}
              onClick={() => handleSetMode("presentation")}
              title="Passa a modalità Slide"
              aria-label="Modalità Slide"
            >
              <SlidesIcon size={14} />
              <span>Slide</span>
            </button>

            <button
              type="button"
              className={`${styles.bottomModeBtn} ${
                state?.mode === "game" ? styles.bottomModeBtnActive : ""
              }`}
              onClick={() => handleSetMode("game")}
              title="Passa a modalità Gioco"
              aria-label="Modalità Gioco"
            >
              <GameIcon size={14} />
              <span>Gioco</span>
            </button>
          </div>

          <button
            type="button"
            className={styles.bottomNavBtn}
            onClick={handleUiNext}
            title="Slide successiva"
            aria-label="Slide successiva"
          >
            <ArrowRightIcon size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
};
