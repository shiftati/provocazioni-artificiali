import type { ButtonHTMLAttributes, ReactNode, FC } from "react";
import styles from "./IconButton.module.scss";

export type IconButtonSize = "sm" | "md" | "lg" | "xl";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  size?: IconButtonSize;
  children: ReactNode;
}

export const IconButton: FC<IconButtonProps> = ({
  size = "md",
  className = "",
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

  return (
    <button
      type="button"
      className={`${styles.iconButton} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
