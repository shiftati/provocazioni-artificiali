import type { TalkConfig, AppSessionState, GameState, AppStats } from "../types";

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
} as const;

const CURRENT_VERSION = 1;

export const DEFAULT_CONFIG: TalkConfig = {
  endTime: "",
  endTimestamp: 0,
  createdAt: 0,
  theme: "dark",
};

export const DEFAULT_SESSION: AppSessionState = {
  currentSlideIndex: 0,
  mode: "presentation",
  stopCallsShown: false,
  startedAt: null,
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
    return readItem<TalkConfig>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
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
