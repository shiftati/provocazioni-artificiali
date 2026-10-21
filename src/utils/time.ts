import type { SessionEvent } from "../types";

/**
 * Returns a default end time formatted as "HH:mm", calculated as 45 minutes from now.
 */
export function getDefaultEndTime(): string {
  const d = new Date(Date.now() + 45 * 60 * 1000);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}


/**
 * Converts a time string "HH:mm" into an absolute timestamp (epoch milliseconds) for today.
 * Returns the timestamp and a boolean indicating whether the time is already in the past.
 */
export function parseEndTimeToday(timeStr: string): { timestamp: number; isPast: boolean } {
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0] ?? "0", 10);
  const minutes = parseInt(parts[1] ?? "0", 10);

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

  const isPast = target.getTime() <= now.getTime();
  return {
    timestamp: target.getTime(),
    isPast,
  };
}

/**
 * Calculates human duration string in Italian between now and target timestamp.
 */
export function getDurationPreview(targetTimestamp: number): string {
  const diffMs = targetTimestamp - Date.now();
  if (diffMs <= 0) {
    return "Orario già trascorso";
  }

  const totalMinutes = Math.round(diffMs / (1000 * 60));
  if (totalMinutes < 60) {
    return `Durata talk: ${totalMinutes} minut${totalMinutes === 1 ? "o" : "i"}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return `Durata talk: ${hours} or${hours === 1 ? "a" : "e"}`;
  }
  return `Durata talk: ${hours} or${hours === 1 ? "a" : "e"} e ${mins} minut${mins === 1 ? "o" : "i"}`;
}

/**
 * Formats seconds into MM:SS (always two digits each).
 * Supports negative seconds, returning -MM:SS (e.g. -00:05, -01:23).
 */
export function formatSecondsToMMSS(secondsTotal: number): string {
  const isNegative = secondsTotal < 0;
  const abs = Math.abs(secondsTotal);
  const clamped = Math.floor(abs);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${isNegative ? "-" : ""}${mm}:${ss}`;
}

/**
 * Formats seconds into human readable short format: e.g. "25s", "3m 12s", "1h 05m"
 * Supports negative values with a leading minus sign.
 */
export function formatDurationSeconds(secondsTotal: number): string {
  const isNegative = secondsTotal < 0;
  const clamped = Math.max(0, Math.round(Math.abs(secondsTotal)));
  let formatted = "";
  if (clamped < 60) {
    formatted = `${clamped}s`;
  } else {
    const minutes = Math.floor(clamped / 60);
    const seconds = clamped % 60;
    if (minutes < 60) {
      formatted = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remMinutes = minutes % 60;
      formatted = `${hours}h ${String(remMinutes).padStart(2, "0")}m`;
    }
  }
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Formats timestamp into localized Italian date and time string.
 */
export function formatDateTime(timestamp: number): string {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculates total game duration in seconds from chronological session events.
 */
export function calculateGameDurationFromEvents(events?: SessionEvent[]): number | null {
  if (!events || events.length === 0) return null;

  let totalGameSeconds = 0;
  let inGame = false;
  let gameStartTime: number | null = null;

  for (const evt of events) {
    const isGameStart =
      (evt.type === "MODE_CHANGE" && evt.details?.mode === "game") ||
      (!inGame &&
        (evt.type === "PROVOCATION_VIEW" ||
          evt.type === "PROVOCATION_ACCEPT" ||
          evt.type === "CHALLENGE_START"));

    const isGameEnd =
      inGame &&
      ((evt.type === "MODE_CHANGE" && evt.details?.mode === "presentation") ||
        (evt.type === "STOP_CALLS" &&
          (evt.details?.slideIndex !== undefined ||
            evt.description?.toLowerCase().includes("chiuso"))) ||
        evt.type === "SLIDE_VIEW" ||
        evt.type === "SESSION_END");

    if (isGameStart && !inGame) {
      inGame = true;
      gameStartTime = evt.timestamp;
    } else if (isGameEnd && inGame && gameStartTime !== null) {
      const duration = Math.max(0, (evt.timestamp - gameStartTime) / 1000);
      totalGameSeconds += duration;
      inGame = false;
      gameStartTime = null;
    }
  }

  // If session ended while still in game mode
  if (inGame && gameStartTime !== null) {
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.timestamp > gameStartTime) {
      totalGameSeconds += (lastEvent.timestamp - gameStartTime) / 1000;
    }
  }

  return totalGameSeconds > 0 ? Math.round(totalGameSeconds) : null;
}

/**
 * Returns total game duration in seconds for a session.
 * Uses event log ground truth if available, or recorded gameDurationSeconds with corruption guard,
 * or calculates sum of provocations' time.
 */
export function getSessionGameDuration(session: {
  gameDurationSeconds?: number;
  totalDurationSeconds?: number;
  provocations?: { acceptanceTimeSeconds?: number; discussionDurationSeconds?: number }[];
  events?: SessionEvent[];
}): number {
  const totalProvTime = (session.provocations || []).reduce(
    (acc, p) => acc + (p.discussionDurationSeconds || 0) + (p.acceptanceTimeSeconds || 0),
    0
  );

  // 1. Ground truth from events log if present
  if (session.events && session.events.length > 0) {
    const fromEvents = calculateGameDurationFromEvents(session.events);
    if (typeof fromEvents === "number" && fromEvents > 0) {
      return fromEvents;
    }
  }

  const rawGame =
    typeof session.gameDurationSeconds === "number" && session.gameDurationSeconds > 0
      ? session.gameDurationSeconds
      : 0;
  const totalDuration = session.totalDurationSeconds || 0;

  // 2. Detection of double-counting bug: gameDuration cannot exceed total session duration
  if (totalDuration > 0 && rawGame > totalDuration) {
    // When the double counting bug occurred, rawGame was (trueGameDuration + totalProvTime)
    const corrected = rawGame - totalProvTime;
    if (corrected > 0 && corrected <= totalDuration) {
      return corrected;
    }
    if (totalProvTime > 0 && totalProvTime <= totalDuration) {
      return totalProvTime;
    }
    return totalDuration;
  }

  if (rawGame > 0) {
    return rawGame;
  }

  return totalProvTime;
}

/**
 * Deduplicates provocation records by id or identical adjacent entries.
 */
export function deduplicateProvocations<
  T extends {
    id?: string;
    provocationId: string;
    completedAt?: number;
    discussionDurationSeconds?: number;
  }
>(provocations: T[]): T[] {
  if (!provocations || provocations.length <= 1) return provocations || [];
  const seenIds = new Set<string>();
  const result: T[] = [];

  for (const prov of provocations) {
    if (prov.id && seenIds.has(prov.id)) {
      continue;
    }
    // Check for strict-mode immediate duplicates (same provocation within 3.5s)
    const isAdjacentDup = result.some(
      (r) =>
        r.provocationId === prov.provocationId &&
        Math.abs((r.completedAt || 0) - (prov.completedAt || 0)) < 3500 &&
        r.discussionDurationSeconds === prov.discussionDurationSeconds
    );
    if (isAdjacentDup) {
      continue;
    }

    if (prov.id) {
      seenIds.add(prov.id);
    }
    result.push(prov);
  }
  return result;
}

/**
 * Formats epoch timestamp into time string with seconds: "HH:mm:ss".
 */
export function formatTimeWithSeconds(timestamp: number): string {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Formats relative elapsed time from a base timestamp into "+mm:ss" or "+hh:mm:ss".
 */
export function formatRelativeTime(timestamp: number, baseTimestamp: number): string {
  if (!timestamp || !baseTimestamp) return "+00:00";
  const diffSec = Math.max(0, Math.floor((timestamp - baseTimestamp) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;

  if (hours > 0) {
    return `+${hours}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }
  return `+${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

