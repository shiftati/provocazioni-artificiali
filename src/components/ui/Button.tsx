import type { ButtonHTMLAttributes, ReactNode, FC } from "react";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = "",
  children,
  ...props
}) => {
  const variantClass =
    variant === "secondary"
      ? styles.variantSecondary
      : variant === "ghost"
      ? styles.variantGhost
      : variant === "danger"
      ? styles.variantDanger
      : styles.variantPrimary;

  const sizeClass =
    size === "lg" ? styles.sizeLg : size === "xl" ? styles.sizeXl : styles.sizeMd;

  return (
    <button
      type="button"
      className={`${styles.button} ${variantClass} ${sizeClass} ${loading ? styles.loading : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
};
