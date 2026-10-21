import type { TalkConfig, AppSessionState, GameState, AppStats, TalkSessionRecord } from "../types";
import { deduplicateProvocations, getSessionGameDuration } from "../utils/time";

interface VersionedEnvelope<T> {
  version: number;
  data: T;
}

const STORAGE_KEYS = {
  CONFIG: "codemotion-app:config",
  SESSION: "codemotion-app:session",
  GAME: "codemotion-app:game",
  STATS: "codemotion-app:stats",
  HEADER_COLLAPSED: "codemotion-app:header-collapsed",
  NAV_ON_SLIDE: "codemotion-app:nav-on-slide",
  SESSIONS: "codemotion-app:sessions-history",
  CURRENT_SESSION_ID: "codemotion-app:current-session-id",
} as const;

const CURRENT_VERSION = 1;

export const DEFAULT_CONFIG: TalkConfig = {
  endTime: "",
  endTimestamp: 0,
  createdAt: 0,
  theme: "dark",
  conclusionMinutes: 5,
  introEndSlide: 10,
  navOnSlide: true,
};

export const DEFAULT_SESSION: AppSessionState = {
  currentSlideIndex: 0,
  mode: "presentation",
  stopCallsShown: false,
  startedAt: null,
  endedAt: null,
};

export const DEFAULT_GAME_STATE: GameState = {
  step: "IDLE",
  timerDeadline: null,
  isTimerPaused: false,
  remainingWhenPaused: null,
  currentProvocationId: null,
  usedProvocationIds: [],
  skippedProvocationIds: [],
  discussedCount: 0,
  isFirstLoop: true,
};

export const DEFAULT_STATS: AppStats = {
  talkStartedAt: null,
  discussions: [],
  skippedCount: 0,
};

function readItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return defaultValue;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "version" in parsed && "data" in parsed) {
      // Future schema migration logic can go here if parsed.version < CURRENT_VERSION
      return (parsed as VersionedEnvelope<T>).data;
    }
    if (typeof parsed === typeof defaultValue) {
      return parsed as T;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeItem<T>(key: string, data: T): void {
  try {
    const envelope: VersionedEnvelope<T> = {
      version: CURRENT_VERSION,
      data,
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Defensive silent catch for full storage / private mode restrictions
  }
}

export const appStorage = {
  // Config
  getConfig(): TalkConfig {
    const cfg = readItem<TalkConfig>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    return {
      ...DEFAULT_CONFIG,
      ...cfg,
      conclusionMinutes:
        typeof cfg.conclusionMinutes === "number" ? cfg.conclusionMinutes : 5,
      navOnSlide:
        typeof cfg.navOnSlide === "boolean" ? cfg.navOnSlide : true,
    };
  },
  saveConfig(config: TalkConfig): void {
    writeItem(STORAGE_KEYS.CONFIG, config);
  },
  getTheme(): "dark" | "light" {
    const cfg = this.getConfig();
    return cfg.theme || "dark";
  },
  saveTheme(theme: "dark" | "light"): void {
    const cfg = this.getConfig();
    this.saveConfig({ ...cfg, theme });
  },
  getNavOnSlide(): boolean {
    const raw = readItem<boolean | null>(STORAGE_KEYS.NAV_ON_SLIDE, null);
    if (raw !== null) {
      return raw;
    }
    const cfg = this.getConfig();
    return typeof cfg.navOnSlide === "boolean" ? cfg.navOnSlide : true;
  },
  saveNavOnSlide(navOnSlide: boolean): void {
    writeItem(STORAGE_KEYS.NAV_ON_SLIDE, navOnSlide);
    const cfg = this.getConfig();
    this.saveConfig({ ...cfg, navOnSlide });
  },
  hasConfig(): boolean {
    const cfg = this.getConfig();
    return cfg.endTimestamp > 0;
  },

  // Session
  getSession(): AppSessionState {
    return readItem<AppSessionState>(STORAGE_KEYS.SESSION, DEFAULT_SESSION);
  },
  saveSession(session: AppSessionState): void {
    writeItem(STORAGE_KEYS.SESSION, session);
  },

  // Game
  getGame(): GameState {
    return readItem<GameState>(STORAGE_KEYS.GAME, DEFAULT_GAME_STATE);
  },
  saveGame(game: GameState): void {
    writeItem(STORAGE_KEYS.GAME, game);
  },

  // Stats
  getStats(): AppStats {
    return readItem<AppStats>(STORAGE_KEYS.STATS, DEFAULT_STATS);
  },
  saveStats(stats: AppStats): void {
    writeItem(STORAGE_KEYS.STATS, stats);
  },

  // Header collapsed state
  getHeaderCollapsed(): boolean {
    return readItem<boolean>(STORAGE_KEYS.HEADER_COLLAPSED, true);
  },
  saveHeaderCollapsed(collapsed: boolean): void {
    writeItem(STORAGE_KEYS.HEADER_COLLAPSED, collapsed);
  },

  // Sessions History (Analytics)
  getSessions(): TalkSessionRecord[] {
    const raw = readItem<TalkSessionRecord[]>(STORAGE_KEYS.SESSIONS, []);
    let needsResave = false;
    const sanitized = raw.map((session) => {
      const cleanProvocations = deduplicateProvocations(session.provocations || []);
      const trueGameDuration = getSessionGameDuration(session);
      const isCorrupted =
        typeof session.gameDurationSeconds === "number" &&
        session.gameDurationSeconds !== trueGameDuration &&
        (session.gameDurationSeconds > (session.totalDurationSeconds || 0) ||
          Boolean(session.events && session.events.length > 0));

      if (isCorrupted) {
        needsResave = true;
      }

      return {
        ...session,
        provocations: cleanProvocations,
        provocationsCount: cleanProvocations.length,
        gameDurationSeconds: isCorrupted
          ? trueGameDuration
          : (session.gameDurationSeconds ?? trueGameDuration),
      };
    });

    if (needsResave) {
      writeItem(STORAGE_KEYS.SESSIONS, sanitized);
    }

    return sanitized;
  },
  saveSessions(sessions: TalkSessionRecord[]): void {
    writeItem(STORAGE_KEYS.SESSIONS, sessions);
  },
  getCurrentSessionId(): string | null {
    return readItem<string | null>(STORAGE_KEYS.CURRENT_SESSION_ID, null);
  },
  saveCurrentSessionId(id: string | null): void {
    writeItem(STORAGE_KEYS.CURRENT_SESSION_ID, id);
  },
  getSessionById(id: string): TalkSessionRecord | undefined {
    const list = this.getSessions();
    return list.find((s) => s.id === id);
  },
  upsertSession(session: TalkSessionRecord): void {
    const list = this.getSessions();
    const index = list.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      list[index] = session;
    } else {
      list.unshift(session); // Latest on top
    }
    this.saveSessions(list);
  },
  deleteSession(id: string): void {
    const list = this.getSessions().filter((s) => s.id !== id);
    this.saveSessions(list);
    if (this.getCurrentSessionId() === id) {
      this.saveCurrentSessionId(null);
    }
  },
  clearAllSessions(): void {
    this.saveSessions([]);
    this.saveCurrentSessionId(null);
  },

  // Reset methods
  clearConfig(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
    } catch {
      // Ignore
    }
  },
  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.GAME);
      localStorage.removeItem(STORAGE_KEYS.STATS);
    } catch {
      // Ignore
    }
  },
  clearAll(): void {
    this.clearConfig();
    this.clearSession();
  },
};
