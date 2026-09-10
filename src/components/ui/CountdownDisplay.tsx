import type { FC } from "react";
import { formatSecondsToMMSS } from "../../utils/time";
import { APP_CONFIG } from "../../config/app.config";
import styles from "./CountdownDisplay.module.scss";

export type CountdownSize = "sm" | "md" | "lg" | "xl";

export interface CountdownDisplayProps {
  remainingSeconds: number;
  size?: CountdownSize;
  warningThresholdSeconds?: number;
  dangerThresholdSeconds?: number;
  pulseOnDanger?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const CountdownDisplay: FC<CountdownDisplayProps> = ({
  remainingSeconds,
  size = "sm",
  warningThresholdSeconds = APP_CONFIG.WARNING_THRESHOLD_SECONDS,
  dangerThresholdSeconds = APP_CONFIG.DANGER_THRESHOLD_SECONDS,
  pulseOnDanger = true,
  className = "",
  ariaLabel = "Tempo rimanente",
}) => {
  const isDanger = remainingSeconds <= dangerThresholdSeconds;
  const isWarning = !isDanger && remainingSeconds <= warningThresholdSeconds;

  const sizeClass =
    size === "sm"
      ? styles.sizeSm
      : size === "md"
      ? styles.sizeMd
      : size === "lg"
      ? styles.sizeLg
      : styles.sizeXl;

  const stateClass = isDanger
    ? `${styles.danger} ${pulseOnDanger ? styles.pulsing : ""}`
    : isWarning
    ? styles.warning
    : "";

  return (
    <div
      role="timer"
      aria-label={ariaLabel}
      aria-live="polite"
      className={`${styles.container} ${sizeClass} ${stateClass} ${className}`}
    >
      <span>{formatSecondsToMMSS(remainingSeconds)}</span>
    </div>
  );
};
