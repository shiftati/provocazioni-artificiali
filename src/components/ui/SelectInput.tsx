import type { SelectHTMLAttributes, FC, ReactNode } from "react";
import styles from "./SelectInput.module.scss";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectInputProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: SelectOption[];
  icon?: ReactNode;
  error?: string;
  hint?: string;
}

export const SelectInput: FC<SelectInputProps> = ({
  label,
  options,
  icon,
  error,
  hint,
  id = "select-input",
  className = "",
  ...props
}) => {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={`${styles.inputGroup} ${error ? styles.hasError : ""}`}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <select
          id={id}
          className={styles.select}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
