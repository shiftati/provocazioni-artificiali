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
 */
export function formatSecondsToMMSS(secondsTotal: number): string {
  const clamped = Math.max(0, Math.floor(secondsTotal));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Formats seconds into human readable short format: e.g. "25s", "3m 12s", "1h 05m"
 */
export function formatDurationSeconds(secondsTotal: number): string {
  const clamped = Math.max(0, Math.round(secondsTotal));
  if (clamped < 60) {
    return `${clamped}s`;
  }
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${String(remMinutes).padStart(2, "0")}m`;
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
 * Returns total game duration in seconds for a session.
 * Uses recorded gameDurationSeconds if available, or calculates sum of provocations' time.
 */
export function getSessionGameDuration(session: {
  gameDurationSeconds?: number;
  provocations?: { acceptanceTimeSeconds?: number; discussionDurationSeconds?: number }[];
}): number {
  if (typeof session.gameDurationSeconds === "number" && session.gameDurationSeconds > 0) {
    return session.gameDurationSeconds;
  }
  return (session.provocations || []).reduce(
    (acc, p) => acc + (p.discussionDurationSeconds || 0) + (p.acceptanceTimeSeconds || 0),
    0
  );
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
