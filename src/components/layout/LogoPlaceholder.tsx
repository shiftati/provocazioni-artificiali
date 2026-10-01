import type { FC } from "react";

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
  const codemotionHeight = size === "sm" ? 22 : size === "lg" ? 40 : 28;
  const shiftatiHeight = size === "sm" ? 26 : size === "lg" ? 46 : 32;
  const dividerHeight = size === "sm" ? 18 : size === "lg" ? 34 : 24;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        userSelect: "none",
      }}
    >
      {/* Codemotion Logo */}
      <img
        src={`${BASE_URL}logo/codemotion-logo-white.svg`}
        alt="Codemotion"
        height={codemotionHeight}
        style={{
          height: `${codemotionHeight}px`,
          width: "auto",
          display: "block",
          objectFit: "contain",
        }}
      />

      {/* Divider */}
      <span
        style={{
          width: "1px",
          height: `${dividerHeight}px`,
          backgroundColor: "var(--color-border)",
        }}
        aria-hidden="true"
      />

      {/* Shiftati di Testa Logo */}
      <img
        src={`${BASE_URL}logo/shiftati-logo-wide-bianco.png`}
        alt="Shiftati di Testa"
        height={shiftatiHeight}
        style={{
          height: `${shiftatiHeight}px`,
          width: "auto",
          display: "block",
          objectFit: "contain",
        }}
      />
    </div>
  );
};
