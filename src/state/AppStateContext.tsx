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
import { appStorage } from "./storage";
import { APP_CONFIG } from "../config/app.config";
import { gameReducer, type GameAction } from "../features/game/game.machine";
import { PROVOCATIONS } from "../features/game/provocations.registry";
import type {
  TalkConfig,
  AppSessionState,
  GameState,
  AppStats,
  AppMode,
} from "../types";

export interface AppStateContextValue {
  config: TalkConfig;
  session: AppSessionState;
  game: GameState;
  stats: AppStats;
  globalRemainingSeconds: number;
  isGlobalExpired: boolean;
  stopCallsOverlayOpen: boolean;
  updateConfig: (cfg: TalkConfig) => void;
  startTalk: () => void;
  setSlideIndex: (index: number) => void;
  setMode: (mode: AppMode) => void;
  closeStopCallsOverlay: () => void;
  dispatchGame: (action: GameAction) => void;
  resetAll: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export const AppStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<TalkConfig>(() => appStorage.getConfig());
  const [session, setSessionState] = useState<AppSessionState>(() => appStorage.getSession());
  const [game, setGameState] = useState<GameState>(() => appStorage.getGame());
  const [stats, setStatsState] = useState<AppStats>(() => appStorage.getStats());
  const [stopCallsOverlayOpen, setStopCallsOverlayOpen] = useState<boolean>(false);

  // Global Countdown calculation without drift
  const calculateGlobalRemaining = useCallback((): number => {
    if (!config.endTimestamp || config.endTimestamp <= 0) return 0;
    const diffMs = config.endTimestamp - Date.now();
    return Math.max(0, Math.ceil(diffMs / 1000));
  }, [config.endTimestamp]);

  const [globalRemainingSeconds, setGlobalRemainingSeconds] = useState<number>(calculateGlobalRemaining);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Global timer interval (250ms tick)
  useEffect(() => {
    if (!config.endTimestamp || config.endTimestamp <= 0) {
      setGlobalRemainingSeconds(0);
      return;
    }

    const checkTimer = () => {
      const remaining = calculateGlobalRemaining();
      setGlobalRemainingSeconds(remaining);

      // Trigger "Stop alle telefonate" if expired and not shown yet
      if (remaining <= 0) {
        if (!sessionRef.current.stopCallsShown) {
          setStopCallsOverlayOpen(true);
          const updatedSession = { ...sessionRef.current, stopCallsShown: true };
          setSessionState(updatedSession);
          appStorage.saveSession(updatedSession);
        }
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 250);
    return () => clearInterval(interval);
  }, [config.endTimestamp, calculateGlobalRemaining]);

  const updateConfig = useCallback((newConfig: TalkConfig) => {
    setConfigState(newConfig);
    appStorage.saveConfig(newConfig);
  }, []);

  const startTalk = useCallback(() => {
    const updated: AppSessionState = {
      ...session,
      startedAt: Date.now(),
      currentSlideIndex: 0,
      mode: "presentation",
    };
    setSessionState(updated);
    appStorage.saveSession(updated);

    const updatedStats: AppStats = {
      ...stats,
      talkStartedAt: Date.now(),
    };
    setStatsState(updatedStats);
    appStorage.saveStats(updatedStats);
  }, [session, stats]);

  const setSlideIndex = useCallback((index: number) => {
    setSessionState((prev) => {
      const updated = { ...prev, currentSlideIndex: index };
      appStorage.saveSession(updated);
      return updated;
    });
  }, []);

  const setMode = useCallback((mode: AppMode) => {
    setSessionState((prev) => {
      const updated = { ...prev, mode };
      appStorage.saveSession(updated);
      return updated;
    });
  }, []);

  const closeStopCallsOverlay = useCallback(() => {
    setStopCallsOverlayOpen(false);
    // Jump to STOP_CALLS_TARGET_SLIDE_INDEX in presentation mode
    setSessionState((prev) => {
      const updated: AppSessionState = {
        ...prev,
        mode: "presentation",
        currentSlideIndex: APP_CONFIG.STOP_CALLS_TARGET_SLIDE_INDEX,
        stopCallsShown: true,
      };
      appStorage.saveSession(updated);
      return updated;
    });
  }, []);

  const allProvocationIds = PROVOCATIONS.map((p) => p.id);

  const dispatchGame = useCallback(
    (action: GameAction) => {
      setGameState((prev) => {
        const next = gameReducer(prev, action);
        appStorage.saveGame(next);

        // Update stats if needed (discussions count / skipped)
        if (action.type === "ACCEPT_PROVOCATION" && next.currentProvocationId) {
          setStatsState((prevStats) => {
            const updatedStats: AppStats = {
              ...prevStats,
              discussions: [
                ...prevStats.discussions,
                {
                  provocationId: next.currentProvocationId ?? "",
                  startedAt: Date.now(),
                  endedAt: Date.now() + APP_CONFIG.GAME_DISCUSSION_SECONDS * 1000,
                  durationSeconds: APP_CONFIG.GAME_DISCUSSION_SECONDS,
                },
              ],
            };
            appStorage.saveStats(updatedStats);
            return updatedStats;
          });
        } else if (action.type === "SKIP_PROVOCATION") {
          setStatsState((prevStats) => {
            const updatedStats: AppStats = {
              ...prevStats,
              skippedCount: prevStats.skippedCount + 1,
            };
            appStorage.saveStats(updatedStats);
            return updatedStats;
          });
        }

        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allProvocationIds]
  );

  const resetAll = useCallback(() => {
    appStorage.clearSession();
    setSessionState(appStorage.getSession());
    setGameState(appStorage.getGame());
    setStatsState(appStorage.getStats());
    setStopCallsOverlayOpen(false);
  }, []);

  const isGlobalExpired = config.endTimestamp > 0 && globalRemainingSeconds <= 0;

  return (
    <AppStateContext.Provider
      value={{
        config,
        session,
        game,
        stats,
        globalRemainingSeconds,
        isGlobalExpired,
        stopCallsOverlayOpen,
        updateConfig,
        startTalk,
        setSlideIndex,
        setMode,
        closeStopCallsOverlay,
        dispatchGame,
        resetAll,
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
