import { useState, useEffect, useRef } from "react";

export interface CountdownOptions {
  targetTimestamp: number | null; // absolute timestamp in ms
  isPaused?: boolean;
  remainingWhenPaused?: number | null; // seconds when paused
  onExpire?: () => void;
}

export interface CountdownResult {
  remainingSeconds: number;
  isExpired: boolean;
  isRunning: boolean;
}

export function useCountdown({
  targetTimestamp,
  isPaused = false,
  remainingWhenPaused = null,
  onExpire,
}: CountdownOptions): CountdownResult {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const hasFiredExpireRef = useRef<boolean>(false);

  const calculateRemaining = (): number => {
    if (isPaused && remainingWhenPaused !== null) {
      return Math.max(0, remainingWhenPaused);
    }
    if (!targetTimestamp || targetTimestamp <= 0) {
      return 0;
    }
    const diffMs = targetTimestamp - Date.now();
    return Math.max(0, Math.ceil(diffMs / 1000));
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemaining);

  useEffect(() => {
    // Reset hasFired when targetTimestamp changes and is in future
    if (targetTimestamp && targetTimestamp > Date.now()) {
      hasFiredExpireRef.current = false;
    }
  }, [targetTimestamp]);

  useEffect(() => {
    // Immediate calculation on any prop change
    const initial = calculateRemaining();
    setRemainingSeconds(initial);

    if (isPaused || !targetTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const current = calculateRemaining();
      setRemainingSeconds(current);

      if (current <= 0 && !hasFiredExpireRef.current) {
        hasFiredExpireRef.current = true;
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [targetTimestamp, isPaused, remainingWhenPaused]);

  const isExpired = targetTimestamp !== null && remainingSeconds <= 0;
  const isRunning = targetTimestamp !== null && !isPaused && remainingSeconds > 0;

  return {
    remainingSeconds,
    isExpired,
    isRunning,
  };
}
