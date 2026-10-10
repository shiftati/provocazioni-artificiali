import { type FC } from "react";
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
} from "../../components/icons";
import styles from "./GameView.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const KLIPPY_SAW_IMAGE = `${BASE_URL}images/slides/${encodeURI("8. Klippy saw.jpg")}`;

export const GameView: FC = () => {
  const navigate = useNavigate();
  const { game, dispatchGame, setMode } = useAppState();
  const allProvocationIds = PROVOCATIONS.map((p) => p.id);

  // Keyboard navigation:
  // - onNext in IDLE starts game
  // - onPrev (Left arrow / PageUp) returns to presentation slides
  useKeyboardNavigation({
    onNext: () => {
      if (game.step === "IDLE") {
        dispatchGame({ type: "PLAY", allProvocationIds });
      }
    },
    onPrev: () => {
      setMode("presentation");
      navigate("/presentation");
    },
    enabled: true,
  });

  // Challenge timer (30s)
  const challengeCountdown = useCountdown({
    targetTimestamp: game.step === "CHALLENGE" ? game.timerDeadline : null,
    onExpire: () => {
      dispatchGame({ type: "CHALLENGE_TIMEOUT", allProvocationIds });
    },
  });

  // Discussion timer (5m)
  const discussionCountdown = useCountdown({
    targetTimestamp: game.step === "DISCUSSION" ? game.timerDeadline : null,
    isPaused: game.isTimerPaused,
    remainingWhenPaused: game.remainingWhenPaused,
    onExpire: () => {
      dispatchGame({ type: "NEXT_PROVOCATION" });
    },
  });

  const currentProvocation = game.currentProvocationId
    ? PROVOCATION_MAP.get(game.currentProvocationId)
    : null;

  const ProvocationComponent = currentProvocation
    ? currentProvocation.component
    : null;

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
        {/* STEP 1: IDLE */}
        {game.step === "IDLE" && (
          <div
            className={styles.idleContainer}
            style={{ backgroundImage: `url("${KLIPPY_SAW_IMAGE}")` }}
            role="region"
            aria-label="Klippy saw - Inizia il gioco"
          >
            <div className={styles.idleControls}>
              <Button
                variant="primary"
                size="xl"
                onClick={() => dispatchGame({ type: "PLAY", allProvocationIds })}
                leftIcon={<PlayIcon size={32} />}
                className={styles.idleButton}
              >
                Inizia il gioco
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: CHALLENGE (30 seconds) */}
        {game.step === "CHALLENGE" && (
          <div className={styles.challengeContainer}>
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
                size="xl"
                onClick={() =>
                  dispatchGame({ type: "CHALLENGE_TIMEOUT", allProvocationIds })
                }
              >
                Salta
              </Button>

              <Button
                variant="primary"
                size="xl"
                onClick={() =>
                  dispatchGame({ type: "ACCEPT_PROVOCATION", allProvocationIds })
                }
                leftIcon={<CheckIcon size={28} />}
              >
                Accetta Provocazione
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2A: PROVOCATION (Displaying unused provocation) */}
        {game.step === "PROVOCATION" && (
          <div className={styles.provocationWrapper}>
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
                onClick={() =>
                  dispatchGame({ type: "SKIP_PROVOCATION", allProvocationIds })
                }
                disabled={allProvocationIds.length <= 1}
                leftIcon={<ShuffleIcon size={22} />}
              >
                Cambia provocazione
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={() =>
                  dispatchGame({
                    type: "ACCEPT_PROVOCATION",
                    allProvocationIds,
                  })
                }
                leftIcon={<CheckIcon size={24} />}
              >
                Accetta provocazione
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: DISCUSSION (5 minutes) */}
        {game.step === "DISCUSSION" && (
          <div className={styles.discussionContainer}>
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
                onClick={() =>
                  dispatchGame({ type: "TOGGLE_PAUSE_DISCUSSION" })
                }
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
                onClick={() => dispatchGame({ type: "NEXT_PROVOCATION" })}
                rightIcon={<ArrowRightIcon size={24} />}
              >
                Prossima provocazione
              </Button>
            </div>
          </div>
        )}
      </Stage>
    </div>
  );
};
