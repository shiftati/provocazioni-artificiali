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
import { PROVOCATIONS } from "../game/provocations.registry";
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
import { getAudioRecording } from "../../utils/audioStorage";
import {
  ensureSessionEvents,
  getReplayStateAt,
  getSessionTotalSeconds,
  resolveReplayProvocation,
} from "./replayUtils";
import { ReplayControlBar } from "./ReplayControlBar";
import { KlippySaw } from "../presentation/slides/KlippySaw";
import { ProvocationCard } from "../game/provocations/ProvocationCard";
import styles from "./SessionReplayView.module.scss";
import cardStyles from "../game/provocations/ProvocationCard.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const STOP_CALLS_BG = `${BASE_URL}images/stop-alle-telefonate.webp`;

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

  // Audio recording state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isCurrent = true;
    let url: string | null = null;

    if (session?.id) {
      getAudioRecording(session.id, session.totalDurationSeconds).then((rec) => {
        if (!isCurrent) return;
        if (rec) {
          url = URL.createObjectURL(rec.blob);
          setAudioUrl(url);
          if (rec.durationSeconds) {
            setAudioDuration(rec.durationSeconds);
          }
        } else {
          setAudioUrl(null);
          setAudioDuration(null);
        }
      });
    } else {
      setAudioUrl(null);
      setAudioDuration(null);
    }

    return () => {
      isCurrent = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [session?.id, session?.totalDurationSeconds]);

  const totalDurationSeconds = useMemo(() => {
    if (!session) return 60;
    const dur = getSessionTotalSeconds(session, events);
    if (audioDuration && audioDuration > dur) {
      return audioDuration;
    }
    return dur;
  }, [session, events, audioDuration]);

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

  // Set initial time on audio element once loaded
  useEffect(() => {
    const el = audioRef.current;
    if (el && initialTime > 0) {
      const handleMetadata = () => {
        try {
          el.currentTime = initialTime;
        } catch (e) {
          console.warn("Could not set initial audio currentTime:", e);
        }
      };
      if (el.readyState >= 1) {
        handleMetadata();
      } else {
        el.addEventListener("loadedmetadata", handleMetadata, { once: true });
        return () => el.removeEventListener("loadedmetadata", handleMetadata);
      }
    }
  }, [initialTime, audioUrl]);

  // Sync isPlaying with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio autoplay blocked or error:", err);
          if (err.name === "NotAllowedError") {
            setIsPlaying(false);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, audioUrl]);

  // Sync playback rate and muted state on audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.playbackRate = Math.min(16, playbackSpeed);
      // Mute audio at high speeds (>= 5x) to avoid screeching
      audio.muted = isMuted || playbackSpeed >= 5;
    } catch (e) {
      console.warn("Failed to set audio playback rate:", e);
    }
  }, [playbackSpeed, isMuted]);

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

  // Main playback animation loop:
  // If synchronized audio is playing, audio hardware clock is the source of truth.
  // Otherwise, fallback / normal deltaSec clock runs identically to before.
  useEffect(() => {
    if (!isPlaying) return;

    let lastTimestamp = performance.now();
    let animFrameId: number;

    const tick = (now: number) => {
      const audio = audioRef.current;
      const hasActiveAudio = Boolean(audio && audioUrl && !audio.paused && !audio.ended);

      if (hasActiveAudio && audio) {
        const audioTime = audio.currentTime;
        setCurrentTime(audioTime);

        if (audio.ended || audioTime >= totalDurationSeconds) {
          setIsPlaying(false);
          return;
        }
      } else {
        const deltaSec = ((now - lastTimestamp) / 1000) * playbackSpeed;
        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          if (next >= totalDurationSeconds) {
            setIsPlaying(false);
            return totalDurationSeconds;
          }
          return next;
        });
      }

      lastTimestamp = now;
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, playbackSpeed, totalDurationSeconds, audioUrl]);

  // Compute active replay state at current time
  const replayState = useMemo(() => {
    if (!session) {
      return {
        mode: "presentation" as const,
        slideIndex: 0,
        slideStep: 0,
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

      if (audioRef.current && audioUrl) {
        const audioDur =
          Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0
            ? audioRef.current.duration
            : (audioDuration ?? totalDurationSeconds);
        const targetAudioTime = Math.min(audioDur, clamped);
        try {
          audioRef.current.currentTime = targetAudioTime;
        } catch (e) {
          console.warn("Error seeking audio:", e);
        }
      }
    },
    [totalDurationSeconds, audioUrl, audioDuration]
  );

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next && currentTimeRef.current >= totalDurationSeconds) {
        setCurrentTime(0);
        if (audioRef.current) {
          try {
            audioRef.current.currentTime = 0;
          } catch (e) {
            console.warn("Failed to rewind audio:", e);
          }
        }
        return true;
      }
      return next;
    });
  }, [totalDurationSeconds]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

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
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleToggleMute();
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
  }, [handleTogglePlay, handleExit, handleToggleMute, handlePrevEvent, handleNextEvent, handleSeek]);

  // Active provocation resolved with robust fallbacks
  const activeProvocation = useMemo(() => {
    return resolveReplayProvocation(
      replayState.currentProvocationId,
      session,
      replayState.activeEvent,
      events,
      currentTime
    );
  }, [
    replayState.currentProvocationId,
    replayState.activeEvent,
    session,
    events,
    currentTime,
  ]);

  if (!session) {
    return null;
  }

  // Active slide
  const currentSlide = SLIDES[replayState.slideIndex] ?? SLIDES[0];
  const SlideComponent = currentSlide ? currentSlide.component : () => null;

  const ProvocationComponent = activeProvocation.Component;

  return (
    <div className={styles.replayViewport}>
      {/* Hidden synchronized audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          playsInline
          style={{ display: "none" }}
        />
      )}

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
              <SlideComponent
                key={`replay-slide-${replayState.slideIndex}`}
                step={replayState.slideStep}
                isReplay={true}
              />
              <div className={styles.slideCounter}>
                {replayState.slideIndex + 1} / {SLIDES.length}
              </div>
            </>
          ) : (
            <div className={styles.gameWrapper}>
              {/* STEP 1: IDLE */}
              {replayState.gameStep === "IDLE" && (
                <KlippySaw isReplay={true}>
                  <div className={styles.idleControls}>
                    <Button
                      variant="primary"
                      size="xl"
                      leftIcon={<PlayIcon size={32} />}
                      className={styles.idleButton}
                      style={{ pointerEvents: "none" }}
                    >
                      Inizia il gioco
                    </Button>
                  </div>
                </KlippySaw>
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
                  ) : activeProvocation.title ? (
                    <ProvocationCard imageName={activeProvocation.image}>
                      <div className={cardStyles.contentWrapper}>
                        <h2 className={cardStyles.title}>
                          {activeProvocation.title}
                        </h2>
                        {activeProvocation.subtitle && (
                          <p className={cardStyles.subtitle}>
                            {activeProvocation.subtitle}
                          </p>
                        )}
                      </div>
                    </ProvocationCard>
                  ) : (
                    (() => {
                      const FallbackComp = PROVOCATIONS[0]!.component;
                      return <FallbackComp />;
                    })()
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
        hasAudio={Boolean(audioUrl)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
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
