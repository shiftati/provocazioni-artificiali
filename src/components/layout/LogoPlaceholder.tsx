import type { FC } from "react";
import { useAppState } from "../../state/AppStateContext";
import styles from "./LogoPlaceholder.module.scss";

export interface LogoPlaceholderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const LogoPlaceholder: FC<LogoPlaceholderProps> = ({
  className,
  size = "md",
}) => {
  const { theme } = useAppState();
  const isLight = theme === "light";

  const codemotionHeight = size === "sm" ? 22 : size === "lg" ? 40 : 28;
  const shiftatiHeight = size === "sm" ? 26 : size === "lg" ? 46 : 32;
  const dividerHeight = size === "sm" ? 18 : size === "lg" ? 34 : 24;

  const codemotionSrc = isLight
    ? `${BASE_URL}logo/codemotion-logo-black.svg`
    : `${BASE_URL}logo/codemotion-logo-white.svg`;

  const shiftatiSrc = isLight
    ? `${BASE_URL}logo/shiftati-logo-wide-black.png`
    : `${BASE_URL}logo/shiftati-logo-wide-bianco.png`;

  return (
    <div
      className={`${styles.logoContainer} ${className ?? ""}`.trim()}
    >
      {/* Codemotion Logo */}
      <img
        src={codemotionSrc}
        alt="Codemotion"
        height={codemotionHeight}
        className={styles.codemotionLogo}
        style={{
          height: `${codemotionHeight}px`,
        }}
      />

      {/* Divider */}
      <span
        className={styles.logoDivider}
        style={{
          height: `${dividerHeight}px`,
        }}
        aria-hidden="true"
      />

      {/* Shiftati di Testa Logo */}
      <img
        src={shiftatiSrc}
        alt="Shiftati di Testa"
        height={shiftatiHeight}
        className={styles.shiftatiLogo}
        style={{
          height: `${shiftatiHeight}px`,
        }}
      />
    </div>
  );
};
