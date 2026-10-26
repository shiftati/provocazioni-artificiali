import { useState, useCallback, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Stage } from "../../components/layout/Stage";
import { useAppState } from "../../state/AppStateContext";
import { PROVOCATIONS, PROVOCATION_MAP } from "./provocations.registry";
import { useCountdown } from "../../hooks/useCountdown";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { CountdownDisplay } from "../../components/ui/CountdownDisplay";
import {
  PlayIcon,
  PauseIcon,
  CheckIcon,
  ShuffleIcon,
  ArrowRightIcon,
  FinishIcon,
} from "../../components/icons";
import { KlippySaw } from "../presentation/slides/KlippySaw";
import { SlideTransition } from "../presentation/components/SlideTransition";
import { getCachedBlobUrl } from "../../utils/precacheAllAssets";
import styles from "./GameView.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const GameView: FC = () => {
  const navigate = useNavigate();
  const {
    game,
    dispatchGame,
    setMode,
    endGame,
    session,
    isSessionActive,
    stopCallsOverlayOpen,
  } = useAppState();
  const allProvocationIds = PROVOCATIONS.map((p) => p.id);

  const [navigationDirection, setNavigationDirection] = useState<
    "forward" | "backward" | "none"
  >("forward");

  const isStopCallsOverlayVisible =
    stopCallsOverlayOpen ||
    (Boolean(session.stopCallsShown) && isSessionActive && !session.endedAt);

  // Precarica e decodifica anticipatamente nella memoria GPU tutte le immagini delle provocazioni
  useEffect(() => {
    PROVOCATIONS.forEach((provocation) => {
      if (!provocation.image) return;
      const cleanImageName = provocation.image.replace(/^images\/provocations\//, "");
      const imageUrl = cleanImageName.startsWith("images/")
        ? `${BASE_URL}${encodeURI(cleanImageName.normalize("NFC"))}`
        : `${BASE_URL}images/provocations/${encodeURI(cleanImageName.normalize("NFC"))}`;
      const effectiveUrl = getCachedBlobUrl(imageUrl) || imageUrl;
      const img = new Image();
      img.src = effectiveUrl;
      if (typeof img.decode === "function") {
        img.decode().catch(() => {});
      }
    });
  }, []);

  const handlePlay = useCallback(() => {
    setNavigationDirection("forward");
    dispatchGame({ type: "PLAY", allProvocationIds });
  }, [dispatchGame, allProvocationIds]);

  const handleChallengeSkip = useCallback(() => {
    setNavigationDirection("backward");
    dispatchGame({ type: "CHALLENGE_TIMEOUT", allProvocationIds });
  }, [dispatchGame, allProvocationIds]);

  const handleChallengeAccept = useCallback(() => {
    setNavigationDirection("forward");
    dispatchGame({ type: "ACCEPT_PROVOCATION", allProvocationIds });
  }, [dispatchGame, allProvocationIds]);

  const handleProvocationSkip = useCallback(() => {
    setNavigationDirection("forward");
    dispatchGame({ type: "SKIP_PROVOCATION", allProvocationIds });
  }, [dispatchGame, allProvocationIds]);

  const handleProvocationAccept = useCallback(() => {
    setNavigationDirection("forward");
    dispatchGame({ type: "ACCEPT_PROVOCATION", allProvocationIds });
  }, [dispatchGame, allProvocationIds]);

  const handleTogglePause = useCallback(() => {
    dispatchGame({ type: "TOGGLE_PAUSE_DISCUSSION" });
  }, [dispatchGame]);

  const handleNextProvocation = useCallback(() => {
    setNavigationDirection("forward");
    dispatchGame({ type: "NEXT_PROVOCATION" });
  }, [dispatchGame]);

  // Fine gioco: solo su click esplicito col mouse/touch (evita trigger da tastiera)
  const handleEndGame = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (e.detail === 0) {
        // Click sintetico originato da tastiera (es. Invio / Spazio): ignora per sicurezza
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.currentTarget.blur();
      endGame();
      navigate("/presentation");
    },
    [endGame, navigate]
  );

  // Keyboard navigation:
  // - onNext:
  //   - IDLE: inizia il gioco
  //   - CHALLENGE (30s): accetta provocazione
  //   - PROVOCATION (scheda predefinita): accetta provocazione
  //   - DISCUSSION (5m): prossima provocazione
  // - onPrev (Left arrow / PageUp):
  //   - PROVOCATION: cambia provocazione
  //   - DISCUSSION (5m): pausa / riprendi
  //   - CHALLENGE (30s): salta
  //   - IDLE: torna alle slide di presentazione
  useKeyboardNavigation({
    onNext: () => {
      setNavigationDirection("forward");
      if (game.step === "IDLE") {
        dispatchGame({ type: "PLAY", allProvocationIds });
      } else if (game.step === "CHALLENGE" || game.step === "PROVOCATION") {
        dispatchGame({ type: "ACCEPT_PROVOCATION", allProvocationIds });
      } else if (game.step === "DISCUSSION") {
        dispatchGame({ type: "NEXT_PROVOCATION" });
      }
    },
    onPrev: () => {
      if (game.step === "PROVOCATION") {
        setNavigationDirection("forward");
        dispatchGame({ type: "SKIP_PROVOCATION", allProvocationIds });
      } else if (game.step === "DISCUSSION") {
        dispatchGame({ type: "TOGGLE_PAUSE_DISCUSSION" });
      } else if (game.step === "CHALLENGE") {
        setNavigationDirection("backward");
        dispatchGame({ type: "CHALLENGE_TIMEOUT", allProvocationIds });
      } else {
        setMode("presentation");
        navigate("/presentation");
      }
    },
    enabled: !isStopCallsOverlayVisible,
  });

  // Challenge timer (30s)
  const challengeCountdown = useCountdown({
    targetTimestamp: game.step === "CHALLENGE" ? game.timerDeadline : null,
    onExpire: () => {
      setNavigationDirection("forward");
      dispatchGame({ type: "CHALLENGE_TIMEOUT", allProvocationIds });
    },
  });

  // Discussion timer (5m)
  const discussionCountdown = useCountdown({
    targetTimestamp: game.step === "DISCUSSION" ? game.timerDeadline : null,
    isPaused: game.isTimerPaused,
    remainingWhenPaused: game.remainingWhenPaused,
    onExpire: () => {
      setNavigationDirection("forward");
      dispatchGame({ type: "NEXT_PROVOCATION" });
    },
  });

  const currentProvocation = game.currentProvocationId
    ? PROVOCATION_MAP.get(game.currentProvocationId)
    : null;

  const ProvocationComponent = currentProvocation
    ? currentProvocation.component
    : null;

  const isDiscussion = game.step === "DISCUSSION";
  const isChallenge = game.step === "CHALLENGE";

  const slideTransitionType = isDiscussion
    ? "epic"
    : isChallenge
    ? "glitch"
    : (currentProvocation?.transition ?? "fade-scale");

  const slideTransitionDuration = isDiscussion
    ? 850
    : isChallenge
    ? 750
    : (currentProvocation?.transitionDurationMs ?? 600);

  // currentTransitionKey non include timerDeadline per evitare transizioni indesiderate
  // quando si mette in pausa o si riprende il countdown durante la discussione.
  const currentTransitionKey = `${game.step}-${game.currentProvocationId ?? "none"}-${game.discussedCount}-${game.skippedProvocationIds.length}`;

  return (
    <div className={styles.gameWrapper}>
      {/* Top right game status: discussed counter */}
      {/* <div className={styles.statusBar}>
        <Badge variant="accent">
          <span>Provocazioni discusse:</span>
          <strong>{game.discussedCount}</strong>
        </Badge>
      </div> */}

      <Stage>
        <SlideTransition
          currentKey={currentTransitionKey}
          direction={navigationDirection}
          transitionType={slideTransitionType}
          durationMs={slideTransitionDuration}
        >
          {/* STEP 1: IDLE */}
          {game.step === "IDLE" && (
            <KlippySaw key="game-idle">
              {/* Tasto Fine gioco: sul lato opposto (sinistra) a Inizia il gioco */}
              <div className={styles.idleLeftControls}>
                <Button
                  variant="secondary"
                  size="xl"
                  onClick={handleEndGame}
                  tabIndex={-1}
                  onKeyDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onKeyUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onFocus={(e) => e.currentTarget.blur()}
                  leftIcon={<FinishIcon size={28} />}
                  className={styles.endGameButton}
                  title="Concludi il gioco e passa alla slide successiva a quella di fine intro"
                >
                  Fine gioco
                </Button>
              </div>

              <div className={styles.idleControls}>
                <Button
                  variant="primary"
                  size="xl"
                  onClick={handlePlay}
                  leftIcon={<PlayIcon size={32} />}
                  className={styles.idleButton}
                >
                  Inizia il gioco
                </Button>
              </div>
            </KlippySaw>
          )}

          {/* STEP 2: CHALLENGE (30 seconds) */}
          {game.step === "CHALLENGE" && (
            <div
              key={`game-challenge-${game.timerDeadline ?? "start"}`}
              className={styles.challengeContainer}
            >
              <span className={styles.challengeHeading}>
                Sfida Accettata? Decidi in fretta!
              </span>

              <div className={styles.challengeCountdown}>
                <CountdownDisplay
                  remainingSeconds={challengeCountdown.remainingSeconds}
                  size="xl"
                  dangerThresholdSeconds={10}
                  warningThresholdSeconds={20}
                  ariaLabel="Tempo rimasto per accettare la provocazione"
                />
              </div>

              <div className={styles.challengeControls}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleChallengeSkip}
                >
                  Salta
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleChallengeAccept}
                  leftIcon={<CheckIcon size={24} />}
                >
                  Accetta Provocazione
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2A: PROVOCATION (Displaying unused provocation) */}
          {game.step === "PROVOCATION" && (
            <div
              key={`game-provocation-${game.currentProvocationId ?? "exhausted"}`}
              className={styles.provocationWrapper}
            >
              {ProvocationComponent ? (
                <ProvocationComponent />
              ) : (
                <div className={styles.idleContainer}>
                  <h2
                    className={styles.idleTitle}
                    style={{ color: "var(--color-danger)" }}
                  >
                    Provocazioni Esaurite!
                  </h2>
                  <p className={styles.idleSubtitle}>
                    Tutte le provocazioni disponibili per questa sessione sono
                    state discusse o scartate. Puoi comunque accettare e avviare
                    una discussione (senza titolo).
                  </p>
                </div>
              )}

              {/* Bottom-right action controls */}
              <div className={styles.provocationControls}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleProvocationSkip}
                  disabled={allProvocationIds.length <= 1}
                  leftIcon={<ShuffleIcon size={22} />}
                >
                  Cambia provocazione
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleProvocationAccept}
                  leftIcon={<CheckIcon size={24} />}
                >
                  Accetta provocazione
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: DISCUSSION (5 minutes) */}
          {game.step === "DISCUSSION" && (
            <div
              key={`game-discussion-${game.currentProvocationId ?? "discuss"}`}
              className={styles.discussionContainer}
            >
              <div className={styles.discussionHeader}>
                <span className={styles.discussionEyebrow}>
                  Tempo di Discussione
                </span>
              </div>

              <div className={styles.discussionCountdownWrapper}>
                <CountdownDisplay
                  remainingSeconds={discussionCountdown.remainingSeconds}
                  size="xl"
                  dangerThresholdSeconds={60}
                  warningThresholdSeconds={180}
                  ariaLabel="Tempo discussione"
                />
                {game.isTimerPaused && (
                  <Badge variant="danger">PAUSA IN CORSO</Badge>
                )}
              </div>

              <div className={styles.discussionControls}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleTogglePause}
                  leftIcon={
                    game.isTimerPaused ? (
                      <PlayIcon size={24} />
                    ) : (
                      <PauseIcon size={24} />
                    )
                  }
                >
                  {game.isTimerPaused ? "Riprendi" : "Pausa"}
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNextProvocation}
                  rightIcon={<ArrowRightIcon size={24} />}
                >
                  Prossima provocazione
                </Button>
              </div>
            </div>
          )}
        </SlideTransition>
      </Stage>
    </div>
  );
};
