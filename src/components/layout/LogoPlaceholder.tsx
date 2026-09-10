import type { FC } from "react";

export const LogoPlaceholder: FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        userSelect: "none",
      }}
    >
      {/* Codemotion Monogram SVG */}
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Logo Codemotion"
      >
        <rect width="40" height="40" rx="8" fill="var(--color-surface)" />
        <path
          d="M26 12H17C14.2386 12 12 14.2386 12 17V23C12 25.7614 14.2386 28 17 28H26"
          stroke="var(--color-accent)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="26" cy="20" r="3" fill="var(--color-brand-white)" />
      </svg>

      {/* Divider */}
      <span
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "var(--color-border)",
        }}
        aria-hidden="true"
      />

      {/* "Shiftati di Testa" Badge Logo */}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: "-0.02em",
            color: "var(--color-brand-white)",
            textTransform: "uppercase",
          }}
        >
          Shiftati <span style={{ color: "var(--color-accent)" }}>di Testa</span>
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            marginTop: "2px",
          }}
        >
          Codemotion Talk
        </span>
      </div>
    </div>
  );
};
