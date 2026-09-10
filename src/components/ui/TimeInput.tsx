import type { InputHTMLAttributes, FC } from "react";
import { ClockIcon } from "../icons";
import styles from "./TimeInput.module.scss";

export interface TimeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  hint?: string;
}

export const TimeInput: FC<TimeInputProps> = ({
  label,
  error,
  hint,
  id = "talk-end-time",
  className = "",
  ...props
}) => {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={`${styles.inputGroup} ${error ? styles.hasError : ""}`}>
        <span className={styles.icon} aria-hidden="true">
          <ClockIcon size={24} />
        </span>
        <input
          id={id}
          type="time"
          required
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
      </div>
      {error && (
        <span id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${id}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
};
