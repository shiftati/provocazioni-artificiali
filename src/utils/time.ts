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
