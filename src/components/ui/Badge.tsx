import type { HTMLAttributes, ReactNode, FC } from "react";
import styles from "./Badge.module.scss";

export type BadgeVariant = "default" | "accent" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export const Badge: FC<BadgeProps> = ({
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const variantClass =
    variant === "accent"
      ? styles.variantAccent
      : variant === "danger"
      ? styles.variantDanger
      : styles.variantDefault;

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
};
