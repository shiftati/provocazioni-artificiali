import type { InputHTMLAttributes, FC } from "react";
import { ClockIcon } from "../icons";
import styles from "./NumberInput.module.scss";

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  hint?: string;
  suffix?: string;
}

export const NumberInput: FC<NumberInputProps> = ({
  label,
  error,
  hint,
  suffix,
  id = "number-input",
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
          type="number"
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
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
