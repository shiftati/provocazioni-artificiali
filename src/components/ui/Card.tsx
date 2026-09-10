import type { HTMLAttributes, ReactNode, FC } from "react";
import styles from "./Card.module.scss";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  clickable?: boolean;
  children: ReactNode;
}

export const Card: FC<CardProps> = ({
  raised = false,
  clickable = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`${styles.card} ${raised ? styles.raised : ""} ${clickable ? styles.clickable : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
