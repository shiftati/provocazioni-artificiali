import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
  type FC,
} from "react";
import { appStorage, DEFAULT_GAME_STATE, DEFAULT_SESSION, DEFAULT_STATS } from "./storage";
import { APP_CONFIG } from "../config/app.config";
import { getDefaultEndTime, formatDateTime } from "../utils/time";
import { gameReducer, type GameAction } from "../features/game/game.machine";
import { PROVOCATIONS, PROVOCATION_MAP } from "../features/game/provocations.registry";
import { SLIDES } from "../features/presentation/slides.registry";
import { createSampleSessions } from "../features/analytics/sampleData";
import type {
  TalkConfig,
  AppSessionState,
  GameState,
  AppStats,
  AppMode,
  AppTheme,
  TalkSessionRecord,
  ProvocationStat,
  SessionEvent,
  SessionEventType,
} from "../types";

export interface AppStateContextValue {
  config: TalkConfig;
  session: AppSessionState;
  game: GameState;
  stats: AppStats;
  theme: AppTheme;
  globalRemainingSeconds: number;
  isGlobalExpired: boolean;
  stopCallsOverlayOpen: boolean;
  isSessionActive: boolean;
  // Sessions & Analytics
  sessions: TalkSessionRecord[];
  currentSessionId: string | null;
  activeSessionRecord: TalkSessionRecord | null;
  updateConfig: (cfg: TalkConfig) => void;
  setTheme: (theme: AppTheme) => void;
  startTalk: (configOverrides?: Partial<TalkConfig>) => void;
  endTalk: () => void;
  setSlideIndex: (index: number) => void;
  setMode: (mode: AppMode) => void;
  closeStopCallsOverlay: () => void;
  dispatchGame: (action: GameAction) => void;
  resetAll: () => void;
  // Event tracking
  logSessionEvent: (
    type: SessionEventType,
    description: string,
    details?: SessionEvent["details"],
    timestamp?: number
  ) => void;
  // Session management
  updateSessionRecord: (session: TalkSessionRecord) => void;
  deleteSessionRecord: (id: string) => void;
  clearAllSessionsRecords: () => void;
  importSessionsRecords: (imported: TalkSessionRecord[]) => void;
  loadSampleSessions: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export const AppStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<TalkConfig>(() => appStorage.getConfig());
  const [session, setSessionState] = useState<AppSessionState>(() => {
    const saved = appStorage.getSession();
    const currentConfig = appStorage.getConfig();
    const conclusionMs = Math.max(0, currentConfig.conclusionMinutes ?? 0) * 60 * 1000;
    const gameEndTimestamp = currentConfig.endTimestamp - conclusionMs;
    // If game countdown is in the future and talk not ended, stopCalls cannot have been shown yet
    if (!saved.endedAt && gameEndTimestamp > Date.now() && saved.stopCallsShown) {
      const reset = { ...saved, stopCallsShown: false };
      appStorage.saveSession(reset);
      return reset;
    }
    return saved;
  });
  const [game, setGameState] = useState<GameState>(() => {
    const saved = appStorage.getGame();
    const validIds = new Set(PROVOCATIONS.map((p) => p.id));
    const hasInvalidCurrent =
      saved.currentProvocationId && !validIds.has(saved.currentProvocationId);
    const hasInvalidUsed = saved.usedProvocationIds.some(
      (id) => !validIds.has(id)
    );
    if (hasInvalidCurrent || hasInvalidUsed) {
      const reset = { ...DEFAULT_GAME_STATE };
      appStorage.saveGame(reset);
      return reset;
    }
    return saved;
  });
  const [stats, setStatsState] = useState<AppStats>(() => appStorage.getStats());
  const [theme, setThemeState] = useState<AppTheme>(() => appStorage.getTheme());
  const [stopCallsOverlayOpen, setStopCallsOverlayOpen] = useState<boolean>(false);

  // Analytics Sessions History
  const [sessions, setSessionsState] = useState<TalkSessionRecord[]>(() => appStorage.getSessions());
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(() => appStorage.getCurrentSessionId());

  // Refs for tracking slide & provocation metrics without stale state issues
  const currentSessionIdRef = useRef<string | null>(currentSessionId);
  currentSessionIdRef.current = currentSessionId;

  const currentSlideIndexRef = useRef<number>(session.currentSlideIndex);
  currentSlideIndexRef.current = session.currentSlideIndex;

  const slideStartTimeRef = useRef<number>(Date.now());
  const currentModeRef = useRef<AppMode>(session.mode);
  currentModeRef.current = session.mode;

  const gameRef = useRef<GameState>(game);
  gameRef.current = game;
  const gameStartTimeRef = useRef<number | null>(null);

  // Provocation metrics refs
  const provocationDecisionStartTimeRef = useRef<number | null>(null);
  const lastAcceptedProvocationIdRef = useRef<string | null>(null);
  const lastAcceptanceTimeRef = useRef<number>(0);
  const discussionStartTimeRef = useRef<number | null>(null);
  const discussionAccumulatedSecondsRef = useRef<number>(0);
  const isDiscussionPausedRef = useRef<boolean>(false);
  const currentDiscussionProvStatIdRef = useRef<string | null>(null);

  // Sync theme with HTML data attribute and meta theme-color
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "light" ? "#1e66fa" : "#0e1e30");
    }
  }, [theme]);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Global Countdown calculation:
  // - Prima di "Stop alle telefonate", conta alla rovescia fino alla fine del gioco (si ferma a 0)
  // - Dopo la comparsa di "Stop alle telefonate" o nelle slide post-gioco, conta alla rovescia fino alla fine del talk
  //   Una volta arrivato a zero, prosegue in negativo finché non si preme la bandierina di fine talk (session.endedAt).
  const calculateGlobalRemaining = useCallback((): number => {
    if (!config.endTimestamp || config.endTimestamp <= 0) return 0;
    const now = Date.now();
    const conclusionMs = Math.max(0, config.conclusionMinutes ?? 0) * 60 * 1000;
    const gameEndTimestamp = config.endTimestamp - conclusionMs;

    const introEndIndex = (config.introEndSlide ? config.introEndSlide - 1 : 10);
    const isPostGameSlides = sessionRef.current.currentSlideIndex > introEndIndex;
    const isPostStopCalls = sessionRef.current.stopCallsShown || stopCallsOverlayOpen || isPostGameSlides;

    const effectiveNow = sessionRef.current.endedAt ?? now;

    if (isPostStopCalls) {
      const diffMs = config.endTimestamp - effectiveNow;
      const s = Math.ceil(diffMs / 1000);
      return s === 0 ? 0 : s;
    }

    // Altrimenti countdown sulla fine del gioco (non del gioco: si ferma a 0)
    const diffMs = gameEndTimestamp - effectiveNow;
    return Math.max(0, Math.ceil(diffMs / 1000));
  }, [config.endTimestamp, config.conclusionMinutes, config.introEndSlide, stopCallsOverlayOpen]);

  const [globalRemainingSeconds, setGlobalRemainingSeconds] = useState<number>(calculateGlobalRemaining);

  // Helper to update active session in sessions array & local storage
  const updateActiveSession = useCallback(
    (updater: (prev: TalkSessionRecord) => TalkSessionRecord) => {
      const activeId = currentSessionIdRef.current;
      if (!activeId) return;

      setSessionsState((prevSessions) => {
        const index = prevSessions.findIndex((s) => s.id === activeId);
        if (index < 0) return prevSessions;
        const updated = [...prevSessions];
        updated[index] = updater(updated[index]!);
        appStorage.saveSessions(updated);
        return updated;
      });
    },
    []
  );

  const logSessionEvent = useCallback(
    (
      type: SessionEventType,
      description: string,
      details?: SessionEvent["details"],
      timestampOverride?: number
    ) => {
      const activeId = currentSessionIdRef.current;
      if (!activeId) return;

      const timestamp = timestampOverride ?? Date.now();
      const newEvent: SessionEvent = {
        id: `evt_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp,
        type,
        description,
        details,
      };

      updateActiveSession((curr) => {
        const existingEvents = curr.events || [];
        return {
          ...curr,
          events: [...existingEvents, newEvent],
        };
      });
    },
    [updateActiveSession]
  );

  // Global timer interval (250ms tick)
  useEffect(() => {
    if (!config.endTimestamp || config.endTimestamp <= 0) {
      setGlobalRemainingSeconds(0);
      return;
    }

    const checkTimer = () => {
      const now = Date.now();
      const conclusionMs = Math.max(0, config.conclusionMinutes ?? 0) * 60 * 1000;
      const gameEndTimestamp = config.endTimestamp - conclusionMs;

      // Trigger "Stop alle telefonate" if game countdown expired and not shown yet AND session is currently active and not ended
      if (now >= gameEndTimestamp) {
        if (
          sessionRef.current.startedAt !== null &&
          !sessionRef.current.stopCallsShown &&
          !sessionRef.current.endedAt
        ) {
          setStopCallsOverlayOpen(true);
          const updatedSession = { ...sessionRef.current, stopCallsShown: true };
          sessionRef.current = updatedSession;
          setSessionState(updatedSession);
          appStorage.saveSession(updatedSession);
          logSessionEvent("STOP_CALLS", 'Comparsa avviso "Stop alle telefonate"', undefined, now);
        }
      }

      const introEndIndex = (config.introEndSlide ? config.introEndSlide - 1 : 10);
      const isPostGameSlides = sessionRef.current.currentSlideIndex > introEndIndex;
      const isPostStopCalls = sessionRef.current.stopCallsShown || stopCallsOverlayOpen || isPostGameSlides;

      const effectiveNow = sessionRef.current.endedAt ?? now;

      if (isPostStopCalls) {
        // Countdown per la fine del talk: prosegue in negativo una volta arrivato a zero
        // finché non si preme la bandierina di fine talk.
        // Math.ceil permette di visualizzare 0 (00:00) per l'intero primo secondo di tolleranza
        // (tra 0 e -999ms) prima di passare a -1 (-00:01).
        const diffMs = config.endTimestamp - effectiveNow;
        const s = Math.ceil(diffMs / 1000);
        setGlobalRemainingSeconds(s === 0 ? 0 : s);
      } else {
        // Countdown per la fine del gioco: non va in negativo, si ferma a 0
        const diffMs = gameEndTimestamp - effectiveNow;
        setGlobalRemainingSeconds(Math.max(0, Math.ceil(diffMs / 1000)));
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 250);
    return () => clearInterval(interval);
  }, [config.endTimestamp, config.conclusionMinutes, config.introEndSlide, stopCallsOverlayOpen]);

  // Periodic heartbeat (every 2.5s) to flush live duration into active session record
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (!currentSessionIdRef.current || sessionRef.current.startedAt === null || sessionRef.current.endedAt) return;

      const now = Date.now();
      const isPresentation = currentModeRef.current === "presentation";
      const currentIdx = currentSlideIndexRef.current;
      const elapsedOnSlide = isPresentation
        ? Math.max(0, (now - slideStartTimeRef.current) / 1000)
        : 0;

      updateActiveSession((curr) => {
        const totalDurationSeconds = curr.startedAt
          ? Math.max(0, Math.round((now - curr.startedAt) / 1000))
          : curr.totalDurationSeconds;

        if (!isPresentation) {
          const activeStatId = currentDiscussionProvStatIdRef.current;
          if (activeStatId && discussionStartTimeRef.current) {
            let discSec = discussionAccumulatedSecondsRef.current;
            if (!isDiscussionPausedRef.current) {
              discSec += (now - discussionStartTimeRef.current) / 1000;
            }
            const cleanDiscSec = Math.min(300, Math.max(1, Math.round(discSec)));
            const updatedProvocations = curr.provocations.map((p) =>
              p.id === activeStatId
                ? { ...p, discussionDurationSeconds: cleanDiscSec }
                : p
            );
            return {
              ...curr,
              totalDurationSeconds,
              provocations: updatedProvocations,
            };
          }
          return { ...curr, totalDurationSeconds };
        }

        const slides = curr.slides.map((s, idx) => {
          if (idx === currentIdx) {
            return {
              ...s,
              durationSeconds: Math.round(s.durationSeconds + elapsedOnSlide),
            };
          }
          return s;
        });

        // Reset slide timer start point to current now so we don't accumulate double
        slideStartTimeRef.current = now;

        return {
          ...curr,
          totalDurationSeconds,
          slides,
        };
      });
    }, 2500);

    return () => clearInterval(heartbeat);
  }, [updateActiveSession]);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    setConfigState((prev) => {
      const updated = { ...prev, theme: newTheme };
      appStorage.saveConfig(updated);
      return updated;
    });
  }, []);

  const updateConfig = useCallback((newConfig: TalkConfig) => {
    setConfigState(newConfig);
    if (newConfig.theme && newConfig.theme !== theme) {
      setThemeState(newConfig.theme);
    }
    appStorage.saveConfig(newConfig);

    // If an active session is currently running, sync the updated config values
    if (currentSessionIdRef.current) {
      updateActiveSession((prev) => ({
        ...prev,
        plannedEndTime: newConfig.endTime,
        plannedEndTimestamp: newConfig.endTimestamp,
        conclusionMinutes: newConfig.conclusionMinutes,
        introEndSlide: newConfig.introEndSlide ?? prev.introEndSlide ?? 11,
      }));
    }

    // Reset stopCallsShown whenever config is updated only if an active session is running
    setSessionState((prev) => {
      const isRunning = Boolean(currentSessionIdRef.current && prev.startedAt && !prev.endedAt);
      const updated = {
        ...prev,
        stopCallsShown: isRunning ? false : prev.stopCallsShown,
      };
      appStorage.saveSession(updated);
      return updated;
    });
  }, [theme, updateActiveSession]);

  // Start new talk: creates a brand new session in storage and begins recording
  const startTalk = useCallback((configOverrides?: Partial<TalkConfig>) => {
    const now = Date.now();
    const activeConfig = { ...appStorage.getConfig(), ...configOverrides };

    // 1. Finalize any ongoing active session
    if (currentSessionIdRef.current) {
      updateActiveSession((prev) => ({
        ...prev,
        endedAt: now,
        totalDurationSeconds: prev.startedAt
          ? Math.max(0, Math.round((now - prev.startedAt) / 1000))
          : prev.totalDurationSeconds,
      }));
    }

    // Clear previous live session, game, and stats from local storage
    appStorage.clearSession();

    // 2. Reset app live session state to beginning
    const updated: AppSessionState = {
      ...DEFAULT_SESSION,
      startedAt: now,
      endedAt: null,
      currentSlideIndex: 0,
      mode: "presentation",
      stopCallsShown: false,
    };
    sessionRef.current = updated;
    setSessionState(updated);
    appStorage.saveSession(updated);

    // Reset game state to clean initial state (equivalent to "Ricomincia da capo")
    const freshGame: GameState = {
      ...DEFAULT_GAME_STATE,
    };
    gameRef.current = freshGame;
    setGameState(freshGame);
    appStorage.saveGame(freshGame);

    // Reset live stats to clean initial state
    const freshStats: AppStats = {
      ...DEFAULT_STATS,
      talkStartedAt: now,
    };
    setStatsState(freshStats);
    appStorage.saveStats(freshStats);

    // Reset overlays
    setStopCallsOverlayOpen(false);

    // 3. Create fresh TalkSessionRecord for history
    const newSessionId = `session_${now}`;
    const newRecord: TalkSessionRecord = {
      id: newSessionId,
      name: `Talk ${formatDateTime(now)}`,
      createdAt: now,
      startedAt: now,
      endedAt: null,
      totalDurationSeconds: 0,
      gameDurationSeconds: 0,
      plannedEndTime: activeConfig.endTime,
      plannedEndTimestamp: activeConfig.endTimestamp,
      conclusionMinutes: activeConfig.conclusionMinutes,
      introEndSlide: activeConfig.introEndSlide ?? 11,
      slides: SLIDES.map((s, idx) => ({
        slideIndex: idx,
        slideId: s.id,
        slideTitle: s.title,
        durationSeconds: 0,
        visits: idx === 0 ? 1 : 0,
      })),
      provocations: [],
      provocationsCount: 0,
      events: [
        {
          id: `evt_${now}_start`,
          timestamp: now,
          type: "SESSION_START",
          description: "Faccio partire la sessione",
        },
        {
          id: `evt_${now}_slide1`,
          timestamp: now,
          type: "SLIDE_VIEW",
          description: `Mostro slide 1${SLIDES[0]?.title ? ` (${SLIDES[0].title})` : ""}`,
          details: {
            slideIndex: 0,
            slideNumber: 1,
            slideTitle: SLIDES[0]?.title,
          },
        },
      ],
    };

    setSessionsState((prev) => {
      const nextList = [newRecord, ...prev];
      appStorage.saveSessions(nextList);
      return nextList;
    });

    setCurrentSessionIdState(newSessionId);
    appStorage.saveCurrentSessionId(newSessionId);
    currentSessionIdRef.current = newSessionId;

    // Reset tracking refs
    slideStartTimeRef.current = now;
    currentSlideIndexRef.current = 0;
    provocationDecisionStartTimeRef.current = null;
    lastAcceptedProvocationIdRef.current = null;
    lastAcceptanceTimeRef.current = 0;
    discussionStartTimeRef.current = null;
    discussionAccumulatedSecondsRef.current = 0;
    isDiscussionPausedRef.current = false;
    currentDiscussionProvStatIdRef.current = null;
  }, [config.endTime, config.endTimestamp, updateActiveSession]);

  const finalizeActiveDiscussion = useCallback(
    (now: number) => {
      const activeStatId = currentDiscussionProvStatIdRef.current;
      if (!activeStatId) return;

      let discussionSec = discussionAccumulatedSecondsRef.current;
      if (!isDiscussionPausedRef.current && discussionStartTimeRef.current) {
        discussionSec += (now - discussionStartTimeRef.current) / 1000;
      }
      discussionSec = Math.min(300, Math.max(1, Math.round(discussionSec)));

      updateActiveSession((curr) => {
        const updatedProvocations = curr.provocations.map((p) => {
          if (p.id === activeStatId) {
            return {
              ...p,
              discussionDurationSeconds: discussionSec,
              completedAt: now,
            };
          }
          return p;
        });

        const totalProvTime = updatedProvocations.reduce(
          (acc, p) =>
            acc + (p.discussionDurationSeconds || 0) + (p.acceptanceTimeSeconds || 0),
          0
        );
        const gameDurationSeconds = Math.max(
          curr.gameDurationSeconds || 0,
          totalProvTime
        );

        return {
          ...curr,
          provocations: updatedProvocations,
          provocationsCount: updatedProvocations.length,
          gameDurationSeconds,
        };
      });

      currentDiscussionProvStatIdRef.current = null;
      provocationDecisionStartTimeRef.current = null;
      lastAcceptedProvocationIdRef.current = null;
      lastAcceptanceTimeRef.current = 0;
      discussionStartTimeRef.current = null;
      discussionAccumulatedSecondsRef.current = 0;
      isDiscussionPausedRef.current = false;
    },
    [updateActiveSession]
  );

  const endTalk = useCallback(() => {
    const now = Date.now();

    logSessionEvent("SESSION_END", "Concluso talk e terminata sessione", undefined, now);

    // Finalize any active provocation discussion
    finalizeActiveDiscussion(now);

    // 1. If currently in presentation, close current slide time
    if (currentModeRef.current === "presentation") {
      const currentIdx = currentSlideIndexRef.current;
      const elapsedOnSlide = Math.max(0, (now - slideStartTimeRef.current) / 1000);
      updateActiveSession((curr) => {
        const slides = curr.slides.map((s, idx) => {
          if (idx === currentIdx) {
            return {
              ...s,
              durationSeconds: Math.round(s.durationSeconds + elapsedOnSlide),
            };
          }
          return s;
        });
        return { ...curr, slides };
      });
    }

    // 2. If in game mode, close game mode time
    if (currentModeRef.current === "game" && gameStartTimeRef.current) {
      const elapsedGame = Math.max(0, (now - gameStartTimeRef.current) / 1000);
      updateActiveSession((curr) => ({
        ...curr,
        gameDurationSeconds: Math.round((curr.gameDurationSeconds || 0) + elapsedGame),
      }));
      gameStartTimeRef.current = null;
    }

    // 3. Finalize active session
    updateActiveSession((curr) => {
      const totalDurationSeconds = curr.startedAt
        ? Math.max(0, Math.round((now - curr.startedAt) / 1000))
        : curr.totalDurationSeconds;
      return {
        ...curr,
        endedAt: now,
        totalDurationSeconds,
      };
    });

    // 4. Mark live session as ended & reset slide and game
    const updated: AppSessionState = {
      ...DEFAULT_SESSION,
      startedAt: sessionRef.current.startedAt,
      endedAt: now,
      currentSlideIndex: 0,
      mode: "presentation",
      stopCallsShown: false,
    };
    sessionRef.current = updated;
    setSessionState(updated);
    appStorage.saveSession(updated);

    // Reset game state to clean initial state
    const freshGame: GameState = {
      ...DEFAULT_GAME_STATE,
    };
    gameRef.current = freshGame;
    setGameState(freshGame);
    appStorage.saveGame(freshGame);

    // Reset live stats to clean initial state
    const freshStats: AppStats = {
      ...DEFAULT_STATS,
    };
    setStatsState(freshStats);
    appStorage.saveStats(freshStats);

    // Reset overlay
    setStopCallsOverlayOpen(false);

    // 5. Clear active session ID & tracking refs
    setCurrentSessionIdState(null);
    appStorage.saveCurrentSessionId(null);
    currentSessionIdRef.current = null;

    currentSlideIndexRef.current = 0;
    currentModeRef.current = "presentation";
    slideStartTimeRef.current = now;
  }, [updateActiveSession, finalizeActiveDiscussion, logSessionEvent]);

  const setSlideIndex = useCallback(
    (index: number) => {
      const now = Date.now();
      const prevIndex = currentSlideIndexRef.current;
      const elapsedSeconds = Math.max(0, (now - slideStartTimeRef.current) / 1000);

      slideStartTimeRef.current = now;
      currentSlideIndexRef.current = index;

      if (prevIndex !== index) {
        const slideTitle = SLIDES[index]?.title;
        logSessionEvent(
          "SLIDE_VIEW",
          `Mostro slide ${index + 1}${slideTitle ? ` (${slideTitle})` : ""}`,
          {
            slideIndex: index,
            slideNumber: index + 1,
            slideTitle,
          },
          now
        );
      }

      // Update slide duration stats in active session
      updateActiveSession((curr) => {
        const slides = curr.slides.map((s, idx) => {
          if (idx === prevIndex) {
            return {
              ...s,
              durationSeconds: Math.round(s.durationSeconds + elapsedSeconds),
            };
          }
          if (idx === index) {
            return { ...s, visits: s.visits + 1 };
          }
          return s;
        });

        const totalDurationSeconds = curr.startedAt
          ? Math.max(0, Math.round((now - curr.startedAt) / 1000))
          : curr.totalDurationSeconds;

        return { ...curr, slides, totalDurationSeconds };
      });

      setSessionState((prev) => {
        const updated = { ...prev, currentSlideIndex: index };
        appStorage.saveSession(updated);
        return updated;
      });
    },
    [updateActiveSession, logSessionEvent]
  );

  const setMode = useCallback(
    (mode: AppMode) => {
      const now = Date.now();
      const currentMode = currentModeRef.current;

      if (currentMode === "presentation" && mode === "game") {
        // Leaving presentation: close current slide timing
        const prevIndex = currentSlideIndexRef.current;
        const elapsedSeconds = Math.max(0, (now - slideStartTimeRef.current) / 1000);

        updateActiveSession((curr) => {
          const slides = curr.slides.map((s, idx) => {
            if (idx === prevIndex) {
              return {
                ...s,
                durationSeconds: Math.round(s.durationSeconds + elapsedSeconds),
              };
            }
            return s;
          });

          const totalDurationSeconds = curr.startedAt
            ? Math.max(0, Math.round((now - curr.startedAt) / 1000))
            : curr.totalDurationSeconds;

          return { ...curr, slides, totalDurationSeconds };
        });

        gameStartTimeRef.current = now;

        const currentProvId = gameRef.current.currentProvocationId;
        if (currentProvId) {
          const provIdx = PROVOCATIONS.findIndex((p) => p.id === currentProvId);
          const provNum = provIdx >= 0 ? provIdx + 1 : 1;
          const provTitle = PROVOCATION_MAP.get(currentProvId)?.title;
          logSessionEvent(
            "MODE_CHANGE",
            `Passo a modalità gioco (e mostro provocazione numero ${provNum}${provTitle ? `: "${provTitle}"` : ""})`,
            {
              mode: "game",
              provocationId: currentProvId,
              provocationNumber: provNum,
              provocationTitle: provTitle,
            },
            now
          );
        } else if (gameRef.current.step === "IDLE") {
          logSessionEvent("MODE_CHANGE", "Passo a modalità gioco (schermata iniziale)", { mode: "game" }, now);
        } else if (gameRef.current.step === "CHALLENGE") {
          logSessionEvent("MODE_CHANGE", "Passo a modalità gioco (sfida 30s)", { mode: "game" }, now);
        } else {
          logSessionEvent("MODE_CHANGE", "Passo a modalità gioco", { mode: "game" }, now);
        }
      } else if (currentMode === "game" && mode === "presentation") {
        // Finalize active provocation discussion if any
        finalizeActiveDiscussion(now);

        // Leaving game mode: record game duration
        if (gameStartTimeRef.current) {
          const elapsedGame = Math.max(0, (now - gameStartTimeRef.current) / 1000);
          updateActiveSession((curr) => ({
            ...curr,
            gameDurationSeconds: Math.round((curr.gameDurationSeconds || 0) + elapsedGame),
          }));
          gameStartTimeRef.current = null;
        }
        slideStartTimeRef.current = now;

        const currentSlideIdx = currentSlideIndexRef.current;
        const slideTitle = SLIDES[currentSlideIdx]?.title;
        logSessionEvent(
          "MODE_CHANGE",
          `Passo a modalità slide (e sono su slide ${currentSlideIdx + 1}${slideTitle ? `: "${slideTitle}"` : ""})`,
          {
            mode: "presentation",
            slideIndex: currentSlideIdx,
            slideNumber: currentSlideIdx + 1,
            slideTitle,
          },
          now
        );
      }

      currentModeRef.current = mode;

      setSessionState((prev) => {
        const updated = { ...prev, mode };
        appStorage.saveSession(updated);
        return updated;
      });
    },
    [updateActiveSession, finalizeActiveDiscussion, logSessionEvent]
  );

  const closeStopCallsOverlay = useCallback(() => {
    setStopCallsOverlayOpen(false);
    const now = Date.now();

    // Finalize active provocation discussion if ongoing
    finalizeActiveDiscussion(now);

    if (gameStartTimeRef.current) {
      const elapsedGame = Math.max(0, (now - gameStartTimeRef.current) / 1000);
      updateActiveSession((curr) => ({
        ...curr,
        gameDurationSeconds: Math.round((curr.gameDurationSeconds || 0) + elapsedGame),
      }));
      gameStartTimeRef.current = null;
    }

    // Pass to slide + 1 after the introEndSlide (1-based introEndSlide corresponds to index introEndSlide)
    const introEnd = config.introEndSlide ?? 11;
    const targetSlideIndex = Math.min(Math.max(sessionRef.current.currentSlideIndex, introEnd), SLIDES.length - 1);

    slideStartTimeRef.current = now;
    currentSlideIndexRef.current = targetSlideIndex;
    currentModeRef.current = "presentation";

    logSessionEvent(
      "STOP_CALLS",
      `Chiuso avviso "Stop alle telefonate" (passo a slide ${targetSlideIndex + 1})`,
      { slideIndex: targetSlideIndex, slideNumber: targetSlideIndex + 1 },
      now
    );

    setSessionState((prev) => {
      const updated: AppSessionState = {
        ...prev,
        mode: "presentation",
        currentSlideIndex: targetSlideIndex,
        stopCallsShown: true,
      };
      appStorage.saveSession(updated);
      return updated;
    });
  }, [config.introEndSlide, updateActiveSession, finalizeActiveDiscussion, logSessionEvent]);

  const dispatchGame = useCallback(
    (action: GameAction) => {
      const prev = gameRef.current;
      const next = gameReducer(prev, action);
      gameRef.current = next;
      setGameState(next);
      appStorage.saveGame(next);

      const now = Date.now();

      // 1. When entering CHALLENGE or PROVOCATION step
      if (action.type === "PLAY") {
        provocationDecisionStartTimeRef.current = now;

        if (prev.step === "IDLE") {
          if (prev.isFirstLoop) {
            const nextId = next.currentProvocationId;
            const provIdx = nextId ? PROVOCATIONS.findIndex((p) => p.id === nextId) : -1;
            const provNum = provIdx >= 0 ? provIdx + 1 : 1;
            const provDef = nextId ? PROVOCATION_MAP.get(nextId) : null;
            logSessionEvent(
              "PROVOCATION_VIEW",
              `Mostro provocazione numero ${provNum}${provDef?.title ? `: "${provDef.title}"` : ""}`,
              {
                provocationId: nextId ?? undefined,
                provocationNumber: provNum,
                provocationTitle: provDef?.title,
              },
              now
            );
          } else {
            logSessionEvent("CHALLENGE_START", "Avviata sfida 30 secondi", undefined, now);
          }
        }
      }

      // 2. When accepting a provocation
      if (action.type === "ACCEPT_PROVOCATION") {
        const wasFromChallenge = prev.step === "CHALLENGE";
        const decisionStart =
          provocationDecisionStartTimeRef.current ?? now - 1000;
        const acceptanceSeconds = Math.max(
          1,
          Math.round((now - decisionStart) / 1000)
        );

        lastAcceptanceTimeRef.current = acceptanceSeconds;
        lastAcceptedProvocationIdRef.current = wasFromChallenge
          ? null
          : next.currentProvocationId ?? null;
        discussionStartTimeRef.current = now;
        discussionAccumulatedSecondsRef.current = 0;
        isDiscussionPausedRef.current = false;

        const provId = wasFromChallenge
          ? `custom_${now}`
          : next.currentProvocationId ?? `prov_${now}`;
        const provDef = wasFromChallenge ? null : PROVOCATION_MAP.get(provId);
        const provIdx = PROVOCATIONS.findIndex((p) => p.id === provId);
        const provNum = provIdx >= 0 ? provIdx + 1 : undefined;

        logSessionEvent(
          "PROVOCATION_ACCEPT",
          wasFromChallenge
            ? "Accetto provocazione (da sfida 30s)"
            : `Accetto provocazione${provNum ? ` numero ${provNum}` : ""}${provDef?.title ? `: "${provDef.title}"` : ""}`,
          {
            provocationId: provId,
            provocationNumber: provNum,
            provocationTitle: provDef?.title,
          },
          now
        );

        const newProvStat: ProvocationStat = {
          id: `prov_${now}`,
          provocationId: provId,
          // If accepted from 30s countdown screen, create without title so user can name it in analytics
          provocationTitle: wasFromChallenge ? "" : provDef?.title ?? "",
          provocationSubtitle: wasFromChallenge ? undefined : provDef?.subtitle,
          acceptanceTimeSeconds: acceptanceSeconds,
          discussionDurationSeconds: 0,
          completedAt: now,
        };

        currentDiscussionProvStatIdRef.current = newProvStat.id;

        updateActiveSession((curr) => {
          if (curr.provocations.some((p) => p.id === newProvStat.id)) {
            return curr;
          }
          const updatedProvocations = [...curr.provocations, newProvStat];
          return {
            ...curr,
            provocations: updatedProvocations,
            provocationsCount: updatedProvocations.length,
          };
        });

        // Legacy stats sync
        setStatsState((prevStats) => {
          const updatedStats: AppStats = {
            ...prevStats,
            discussions: [
              ...prevStats.discussions,
              {
                provocationId: provId,
                startedAt: now,
                endedAt: now + APP_CONFIG.GAME_DISCUSSION_SECONDS * 1000,
                durationSeconds: APP_CONFIG.GAME_DISCUSSION_SECONDS,
              },
            ],
          };
          appStorage.saveStats(updatedStats);
          return updatedStats;
        });
      }

      // 3. Discussion pause / resume
      if (action.type === "TOGGLE_PAUSE_DISCUSSION") {
        if (!isDiscussionPausedRef.current) {
          // Pausing
          if (discussionStartTimeRef.current) {
            discussionAccumulatedSecondsRef.current +=
              (now - discussionStartTimeRef.current) / 1000;
          }
          isDiscussionPausedRef.current = true;
          logSessionEvent("DISCUSSION_PAUSE", "Pausa discussione", undefined, now);
        } else {
          // Resuming
          discussionStartTimeRef.current = now;
          isDiscussionPausedRef.current = false;
          logSessionEvent("DISCUSSION_RESUME", "Ripresa discussione", undefined, now);
        }
      }

      // 4. Finishing discussion -> NEXT_PROVOCATION (only if previous step was DISCUSSION)
      if (action.type === "NEXT_PROVOCATION" && prev.step === "DISCUSSION") {
        finalizeActiveDiscussion(now);
        logSessionEvent("DISCUSSION_END", "Conclusa discussione provocazione", undefined, now);
      }

      if (action.type === "SKIP_PROVOCATION") {
        const nextId = next.currentProvocationId;
        const provIdx = nextId ? PROVOCATIONS.findIndex((p) => p.id === nextId) : -1;
        const provNum = provIdx >= 0 ? provIdx + 1 : undefined;
        const provDef = nextId ? PROVOCATION_MAP.get(nextId) : null;
        logSessionEvent(
          "PROVOCATION_SKIP",
          `Cambio provocazione${provNum ? ` (mostro provocazione numero ${provNum}${provDef?.title ? `: "${provDef.title}"` : ""})` : ""}`,
          {
            provocationId: nextId ?? undefined,
            provocationNumber: provNum,
            provocationTitle: provDef?.title,
          },
          now
        );

        setStatsState((prevStats) => {
          const updatedStats: AppStats = {
            ...prevStats,
            skippedCount: prevStats.skippedCount + 1,
          };
          appStorage.saveStats(updatedStats);
          return updatedStats;
        });
      }

      if (action.type === "CHALLENGE_TIMEOUT") {
        const nextId = next.currentProvocationId;
        const provIdx = nextId ? PROVOCATIONS.findIndex((p) => p.id === nextId) : -1;
        const provNum = provIdx >= 0 ? provIdx + 1 : undefined;
        const provDef = nextId ? PROVOCATION_MAP.get(nextId) : null;
        logSessionEvent(
          "CHALLENGE_TIMEOUT",
          `Tempo sfida scaduto${provNum ? ` (mostro provocazione numero ${provNum}${provDef?.title ? `: "${provDef.title}"` : ""})` : ""}`,
          {
            provocationId: nextId ?? undefined,
            provocationNumber: provNum,
            provocationTitle: provDef?.title,
          },
          now
        );
      }

      if (action.type === "RESET_GAME") {
        logSessionEvent("MODE_CHANGE", "Reset stato gioco", undefined, now);
      }
    },
    [updateActiveSession, finalizeActiveDiscussion, logSessionEvent]
  );

  const resetAll = useCallback(() => {
    // Finalize any ongoing active session before reset
    const now = Date.now();
    if (currentSessionIdRef.current) {
      updateActiveSession((curr) => ({
        ...curr,
        endedAt: now,
        totalDurationSeconds: curr.startedAt
          ? Math.max(0, Math.round((now - curr.startedAt) / 1000))
          : curr.totalDurationSeconds,
      }));
    }

    // Reset live state
    appStorage.clearAll();
    const defaultEndTime = getDefaultEndTime();
    const resetConfig: TalkConfig = {
      endTime: defaultEndTime,
      endTimestamp: 0,
      createdAt: 0,
      theme,
      conclusionMinutes: 5,
    };
    appStorage.saveConfig(resetConfig);
    setConfigState(resetConfig);
    setSessionState(appStorage.getSession());
    setGameState(appStorage.getGame());
    setStatsState(appStorage.getStats());
    setStopCallsOverlayOpen(false);
    setGlobalRemainingSeconds(0);

    // Unset active session ID
    setCurrentSessionIdState(null);
    appStorage.saveCurrentSessionId(null);
    currentSessionIdRef.current = null;

    // Reset tracking refs
    currentSlideIndexRef.current = 0;
    currentModeRef.current = "presentation";
    slideStartTimeRef.current = now;
    provocationDecisionStartTimeRef.current = null;
    lastAcceptedProvocationIdRef.current = null;
    lastAcceptanceTimeRef.current = 0;
    discussionStartTimeRef.current = null;
    discussionAccumulatedSecondsRef.current = 0;
    isDiscussionPausedRef.current = false;
    currentDiscussionProvStatIdRef.current = null;
  }, [theme, updateActiveSession]);

  // Session management handlers
  const updateSessionRecord = useCallback((updated: TalkSessionRecord) => {
    setSessionsState((prev) => {
      const list = prev.map((s) => (s.id === updated.id ? updated : s));
      appStorage.saveSessions(list);
      return list;
    });
  }, []);

  const deleteSessionRecord = useCallback((id: string) => {
    setSessionsState((prev) => {
      const list = prev.filter((s) => s.id !== id);
      appStorage.saveSessions(list);
      return list;
    });
    if (currentSessionIdRef.current === id) {
      setCurrentSessionIdState(null);
      appStorage.saveCurrentSessionId(null);
      currentSessionIdRef.current = null;
    }
  }, []);

  const clearAllSessionsRecords = useCallback(() => {
    setSessionsState([]);
    appStorage.clearAllSessions();
    setCurrentSessionIdState(null);
    currentSessionIdRef.current = null;
  }, []);

  const importSessionsRecords = useCallback((imported: TalkSessionRecord[]) => {
    setSessionsState((prev) => {
      // Merge imported sessions by ID
      const existingIds = new Set(prev.map((s) => s.id));
      const newItems = imported.filter((item) => !existingIds.has(item.id));
      const updatedList = [...newItems, ...prev];
      appStorage.saveSessions(updatedList);
      return updatedList;
    });
  }, []);

  const loadSampleSessions = useCallback(() => {
    const samples = createSampleSessions();
    importSessionsRecords(samples);
  }, [importSessionsRecords]);

  const activeSessionRecord =
    sessions.find((s) => s.id === currentSessionId) ?? null;

  const isSessionActive = Boolean(
    session.startedAt !== null &&
    session.endedAt === null &&
    currentSessionId !== null
  );

  const isGlobalExpired = config.endTimestamp > 0 && Date.now() >= config.endTimestamp;

  return (
    <AppStateContext.Provider
      value={{
        config,
        session,
        game,
        stats,
        theme,
        globalRemainingSeconds,
        isGlobalExpired,
        stopCallsOverlayOpen,
        isSessionActive,
        sessions,
        currentSessionId,
        activeSessionRecord,
        updateConfig,
        setTheme,
        startTalk,
        endTalk,
        setSlideIndex,
        setMode,
        closeStopCallsOverlay,
        dispatchGame,
        resetAll,
        logSessionEvent,
        updateSessionRecord,
        deleteSessionRecord,
        clearAllSessionsRecords,
        importSessionsRecords,
        loadSampleSessions,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}
