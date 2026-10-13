import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type FC,
} from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import { Stage } from "../../components/layout/Stage";
import { SLIDES } from "../presentation/slides.registry";
import { PROVOCATION_MAP } from "../game/provocations.registry";
import { CountdownDisplay } from "../../components/ui/CountdownDisplay";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  PlayIcon,
  PauseIcon,
  CheckIcon,
  ShuffleIcon,
  ArrowRightIcon,
  CloseIcon,
} from "../../components/icons";
import { formatDateTime } from "../../utils/time";
import {
  ensureSessionEvents,
  getReplayStateAt,
  getSessionTotalSeconds,
} from "./replayUtils";
import { ReplayControlBar } from "./ReplayControlBar";
import styles from "./SessionReplayView.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const KLIPPY_SAW_IMAGE = `${BASE_URL}images/slides/8-klippy-saw.jpg`;
const STOP_CALLS_BG = `${BASE_URL}images/stop-alle-telefonate.jpg`;

export const SessionReplayView: FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessions } = useAppState();

  // Find target session
  const session = useMemo(() => {
    if (sessionId) {
      const found = sessions.find((s) => s.id === sessionId);
      if (found) return found;
    }
    return sessions[0] ?? null;
  }, [sessions, sessionId]);

  // If no sessions, redirect to analytics
  useEffect(() => {
    if (!session && sessions.length === 0) {
      navigate("/analytics", { replace: true });
    }
  }, [session, sessions, navigate]);

  const events = useMemo(() => {
    if (!session) return [];
    return ensureSessionEvents(session);
  }, [session]);

  const totalDurationSeconds = useMemo(() => {
    if (!session) return 60;
    return getSessionTotalSeconds(session, events);
  }, [session, events]);

  // Initial start time offset from query param ?startAt=epochMs
  const initialTime = useMemo(() => {
    if (!session) return 0;
    const startAtParam = searchParams.get("startAt");
    if (startAtParam) {
      const ms = Number(startAtParam);
      if (!isNaN(ms) && ms >= session.startedAt) {
        return Math.min(
          totalDurationSeconds,
          Math.max(0, (ms - session.startedAt) / 1000)
        );
      }
    }
    return 0;
  }, [session, searchParams, totalDurationSeconds]);

  const [currentTime, setCurrentTime] = useState<number>(initialTime);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isIdle, setIsIdle] = useState<boolean>(false);

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  // Auto-hide controls when mouse is inactive
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const handleMouseMove = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 4000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    idleTimer = setTimeout(() => {
      setIsIdle(true);
    }, 4000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(idleTimer);
    };
  }, []);

  // Main playback animation loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastTimestamp = performance.now();
    let animFrameId: number;

    const tick = (now: number) => {
      const deltaSec = ((now - lastTimestamp) / 1000) * playbackSpeed;
      lastTimestamp = now;

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= totalDurationSeconds) {
          setIsPlaying(false);
          return totalDurationSeconds;
        }
        return next;
      });

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, playbackSpeed, totalDurationSeconds]);

  // Compute active replay state at current time
  const replayState = useMemo(() => {
    if (!session) {
      return {
        mode: "presentation" as const,
        slideIndex: 0,
        gameStep: "IDLE" as const,
        currentProvocationId: null,
        challengeSecondsRemaining: 30,
        discussionSecondsRemaining: 300,
        isDiscussionPaused: false,
        stopCallsShown: false,
        activeEvent: null,
        activeEventIndex: -1,
      };
    }
    return getReplayStateAt(session, events, currentTime);
  }, [session, events, currentTime]);

  const handleSeek = useCallback(
    (seconds: number) => {
      const clamped = Math.min(totalDurationSeconds, Math.max(0, seconds));
      setCurrentTime(clamped);
    },
    [totalDurationSeconds]
  );

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      // If at end, replay from beginning
      if (!prev && currentTimeRef.current >= totalDurationSeconds) {
        setCurrentTime(0);
        return true;
      }
      return !prev;
    });
  }, [totalDurationSeconds]);

  const handlePrevEvent = useCallback(() => {
    if (!session || events.length === 0) return;
    const currentMs = session.startedAt + currentTimeRef.current * 1000;
    // Find preceding event with at least 1s gap
    let targetEvent = events[0];
    for (let i = events.length - 1; i >= 0; i--) {
      const evt = events[i]!;
      if (evt.timestamp < currentMs - 1200) {
        targetEvent = evt;
        break;
      }
    }
    if (targetEvent) {
      const relSec = Math.max(0, (targetEvent.timestamp - session.startedAt) / 1000);
      handleSeek(relSec);
    }
  }, [session, events, handleSeek]);

  const handleNextEvent = useCallback(() => {
    if (!session || events.length === 0) return;
    const currentMs = session.startedAt + currentTimeRef.current * 1000;
    // Find following event
    const following = events.find((e) => e.timestamp > currentMs + 500);
    if (following) {
      const relSec = Math.max(0, (following.timestamp - session.startedAt) / 1000);
      handleSeek(relSec);
    } else {
      handleSeek(totalDurationSeconds);
    }
  }, [session, events, totalDurationSeconds, handleSeek]);

  const handleExit = useCallback(() => {
    navigate("/analytics");
  }, [navigate]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleExit();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) {
          handlePrevEvent();
        } else {
          handleSeek(currentTimeRef.current - 5);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) {
          handleNextEvent();
        } else {
          handleSeek(currentTimeRef.current + 5);
        }
      } else if (e.key === "1") {
        setPlaybackSpeed(1);
      } else if (e.key === "2") {
        setPlaybackSpeed(2);
      } else if (e.key === "3") {
        setPlaybackSpeed(5);
      } else if (e.key === "4") {
        setPlaybackSpeed(10);
      } else if (e.key === "5") {
        setPlaybackSpeed(30);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTogglePlay, handleExit, handlePrevEvent, handleNextEvent, handleSeek]);

  if (!session) {
    return null;
  }

  // Active slide
  const currentSlide = SLIDES[replayState.slideIndex] ?? SLIDES[0];
  const SlideComponent = currentSlide ? currentSlide.component : () => null;

  // Active provocation
  const currentProvocation = replayState.currentProvocationId
    ? PROVOCATION_MAP.get(replayState.currentProvocationId)
    : null;
  const ProvocationComponent = currentProvocation
    ? currentProvocation.component
    : null;

  return (
    <div className={styles.replayViewport}>
      {/* Top Replay Badge & Session Name */}
      <header className={styles.topReplayBar}>
        <div className={styles.topPill}>
          <span className={styles.replayBadge}>
            <span className={styles.liveDot} />
            REPLAY TALK
          </span>
          <span className={styles.sessionTitle}>{session.name}</span>
          <span className={styles.sessionDate}>
            ({formatDateTime(session.startedAt)})
          </span>
        </div>

        <div className={styles.topRightActions}>
          <Button
            variant="ghost"
            size="md"
            onClick={handleExit}
            leftIcon={<CloseIcon size={16} />}
            style={{
              backgroundColor: "rgba(14, 30, 48, 0.85)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "999px",
            }}
          >
            Esci dal Replay (Esc)
          </Button>
        </div>
      </header>

      {/* Replay Main Stage */}
      <div className={styles.stageContainer}>
        <Stage>
          {replayState.mode === "presentation" ? (
            <>
              <SlideComponent />
              <div className={styles.slideCounter}>
                {replayState.slideIndex + 1} / {SLIDES.length}
              </div>
            </>
          ) : (
            <div className={styles.gameWrapper}>
              {/* IDLE */}
              {replayState.gameStep === "IDLE" && (
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
                      leftIcon={<PlayIcon size={32} />}
                      style={{ pointerEvents: "none" }}
                    >
                      Inizia il gioco
                    </Button>
                  </div>
                </div>
              )}

              {/* CHALLENGE */}
              {replayState.gameStep === "CHALLENGE" && (
                <div className={styles.challengeContainer}>
                  <span className={styles.challengeHeading}>
                    Sfida Accettata? Decidi in fretta!
                  </span>

                  <div className={styles.challengeCountdown}>
                    <CountdownDisplay
                      remainingSeconds={replayState.challengeSecondsRemaining}
                      size="xl"
                      dangerThresholdSeconds={10}
                      warningThresholdSeconds={20}
                      ariaLabel="Tempo rimasto per accettare la provocazione"
                    />
                  </div>

                  <div className={styles.challengeControls}>
                    <Button variant="secondary" size="xl" style={{ pointerEvents: "none" }}>
                      Salta
                    </Button>
                    <Button
                      variant="primary"
                      size="xl"
                      leftIcon={<CheckIcon size={28} />}
                      style={{ pointerEvents: "none" }}
                    >
                      Accetta Provocazione
                    </Button>
                  </div>
                </div>
              )}

              {/* PROVOCATION */}
              {replayState.gameStep === "PROVOCATION" && (
                <div className={styles.provocationWrapper}>
                  {ProvocationComponent ? (
                    <ProvocationComponent />
                  ) : (
                    <div className={styles.idleContainer}>
                      <h2>Provocazioni Esaurite!</h2>
                    </div>
                  )}

                  <div className={styles.provocationControls}>
                    <Button
                      variant="secondary"
                      size="lg"
                      leftIcon={<ShuffleIcon size={22} />}
                      style={{ pointerEvents: "none" }}
                    >
                      Cambia provocazione
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      leftIcon={<CheckIcon size={24} />}
                      style={{ pointerEvents: "none" }}
                    >
                      Accetta provocazione
                    </Button>
                  </div>
                </div>
              )}

              {/* DISCUSSION */}
              {replayState.gameStep === "DISCUSSION" && (
                <div className={styles.discussionContainer}>
                  <div className={styles.discussionHeader}>
                    <span className={styles.discussionEyebrow}>
                      Tempo di Discussione
                    </span>
                  </div>

                  <div className={styles.discussionCountdownWrapper}>
                    <CountdownDisplay
                      remainingSeconds={replayState.discussionSecondsRemaining}
                      size="xl"
                      dangerThresholdSeconds={60}
                      warningThresholdSeconds={180}
                      ariaLabel="Tempo discussione"
                    />
                    {replayState.isDiscussionPaused && (
                      <Badge variant="danger">PAUSA IN CORSO</Badge>
                    )}
                  </div>

                  <div className={styles.discussionControls}>
                    <Button
                      variant="secondary"
                      size="lg"
                      leftIcon={
                        replayState.isDiscussionPaused ? (
                          <PlayIcon size={24} />
                        ) : (
                          <PauseIcon size={24} />
                        )
                      }
                      style={{ pointerEvents: "none" }}
                    >
                      {replayState.isDiscussionPaused ? "Riprendi" : "Pausa"}
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      rightIcon={<ArrowRightIcon size={24} />}
                      style={{ pointerEvents: "none" }}
                    >
                      Prossima provocazione
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stop Calls Overlay during Replay */}
          {replayState.stopCallsShown && (
            <div
              className={styles.stopCallsOverlay}
              style={{ backgroundImage: `url("${STOP_CALLS_BG}")` }}
            >
              <div className={styles.stopCallsBadge}>
                🔔 Stop alle telefonate!
              </div>
            </div>
          )}
        </Stage>
      </div>

      {/* Floating Bottom Media Player Dock */}
      <ReplayControlBar
        currentTime={currentTime}
        totalDurationSeconds={totalDurationSeconds}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        activeEvent={replayState.activeEvent}
        events={events}
        sessionStartTime={session.startedAt}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onSetSpeed={setPlaybackSpeed}
        onPrevEvent={handlePrevEvent}
        onNextEvent={handleNextEvent}
        onExit={handleExit}
        isIdle={isIdle}
      />
    </div>
  );
};
