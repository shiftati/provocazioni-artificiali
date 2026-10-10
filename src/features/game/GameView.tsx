import { type FC } from "react";
import { Stage } from "../../components/layout/Stage";
import { useAppState } from "../../state/AppStateContext";
import { PROVOCATIONS, PROVOCATION_MAP } from "./provocations.registry";
import { getAvailableProvocations } from "./game.machine";
import { useCountdown } from "../../hooks/useCountdown";
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

export const GameView: FC = () => {
  const { game, dispatchGame } = useAppState();
  const allProvocationIds = PROVOCATIONS.map((p) => p.id);

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
  });

  // Available unused provocations
  const availableCount = getAvailableProvocations(
    allProvocationIds,
    game.usedProvocationIds,
    game.skippedProvocationIds
  ).length;

  const currentProvocation = game.currentProvocationId
    ? PROVOCATION_MAP.get(game.currentProvocationId)
    : null;

  const ProvocationComponent = currentProvocation ? currentProvocation.component : null;

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
          <div className={styles.idleContainer}>
            {/* Thematic SAW spiral / mask placeholder SVG */}
            <div className={styles.sawMaskContainer} aria-hidden="true">
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-surface-raised)" strokeWidth="6" />
                <circle cx="50" cy="50" r="32" fill="none" stroke="var(--color-border)" strokeWidth="4" />
                <path
                  d="M50 50 m -22, 0 a 22,22 0 1,0 44,0 a 22,22 0 1,0 -44,0"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="5"
                  strokeDasharray="10 5"
                />
                <circle cx="38" cy="42" r="5" fill="var(--color-accent)" />
                <circle cx="62" cy="42" r="5" fill="var(--color-accent)" />
                <path d="M38 65 Q50 78 62 65" fill="none" stroke="var(--color-text)" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>

            <h1 className={styles.idleTitle}>Voglio fare un gioco con te</h1>
            <p className={styles.idleSubtitle}>
              Sei pronto a mettere in discussione i pilastri della tua carriera di sviluppatore davanti a tutta la sala?
            </p>

            <Button
              variant="primary"
              size="xl"
              onClick={() => dispatchGame({ type: "PLAY", allProvocationIds })}
              leftIcon={<PlayIcon size={32} />}
            >
              Inizia il Gioco
            </Button>
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

            <Button
              variant="primary"
              size="xl"
              onClick={() => dispatchGame({ type: "ACCEPT_PROVOCATION", allProvocationIds })}
              leftIcon={<CheckIcon size={28} />}
            >
              Accetta Provocazione
            </Button>
          </div>
        )}

        {/* STEP 2A: PROVOCATION (Displaying unused provocation) */}
        {game.step === "PROVOCATION" && (
          <div className={styles.provocationWrapper}>
            {ProvocationComponent ? (
              <ProvocationComponent />
            ) : (
              <div className={styles.idleContainer}>
                <h2 className={styles.idleTitle} style={{ color: "var(--color-danger)" }}>
                  Provocazioni Esaurite!
                </h2>
                <p className={styles.idleSubtitle}>
                  Tutte le provocazioni disponibili per questa sessione sono state discusse o scartate.
                  Puoi comunque accettare e avviare una discussione (senza titolo).
                </p>
              </div>
            )}

            {/* Bottom-right action controls */}
            <div className={styles.provocationControls}>
              {availableCount <= 1 && (
                <span className={styles.exhaustedMessage}>
                  {availableCount === 0 ? "Nessuna altra provocazione" : "Ultima provocazione rimasta"}
                </span>
              )}

              <Button
                variant="secondary"
                size="lg"
                onClick={() => dispatchGame({ type: "SKIP_PROVOCATION", allProvocationIds })}
                disabled={availableCount <= 1}
                leftIcon={<ShuffleIcon size={22} />}
              >
                Cambia provocazione
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={() => dispatchGame({ type: "ACCEPT_PROVOCATION", allProvocationIds })}
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
              <span className={styles.discussionEyebrow}>Tempo di Discussione</span>
              {currentProvocation?.title && (
                <p className={styles.discussionTitle}>
                  {currentProvocation.title}
                </p>
              )}
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
                <Badge variant="danger">
                  PAUSA IN CORSO
                </Badge>
              )}
            </div>

            <div className={styles.discussionControls}>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => dispatchGame({ type: "TOGGLE_PAUSE_DISCUSSION" })}
                leftIcon={game.isTimerPaused ? <PlayIcon size={24} /> : <PauseIcon size={24} />}
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
