import type { ButtonHTMLAttributes, ReactNode, FC } from "react";
import styles from "./IconButton.module.scss";

export type IconButtonSize = "sm" | "md" | "lg" | "xl";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  size?: IconButtonSize;
  isActive?: boolean;
  children: ReactNode;
}

export const IconButton: FC<IconButtonProps> = ({
  size = "md",
  className = "",
  isActive,
  children,
  ...props
}) => {
  const sizeClass =
    size === "sm"
      ? styles.sizeSm
      : size === "lg"
      ? styles.sizeLg
      : size === "xl"
      ? styles.sizeXl
      : styles.sizeMd;

  const activeClass = isActive ? styles.active : "";

  return (
    <button
      type="button"
      aria-pressed={isActive}
      className={`${styles.iconButton} ${sizeClass} ${activeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
