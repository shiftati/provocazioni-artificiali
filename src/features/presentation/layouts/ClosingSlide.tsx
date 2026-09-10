import type { FC } from "react";
import styles from "./SlideLayout.module.scss";

export interface ClosingSlideProps {
  title?: string;
  subtitle?: string;
  links?: Array<{ label: string; url: string }>;
  speakerInfo?: {
    name: string;
    role: string;
  };
}

export const ClosingSlide: FC<ClosingSlideProps> = ({
  title = "Grazie a tutti!",
  subtitle = "Domande, riflessioni o altre provocazioni?",
  links = [
    { label: "Codice & Slide", url: "github.com/danielzotti/provocazioni-shiftate-codemotion-antigravity" },
    { label: "Community", url: "codemotion.com" },
  ],
  speakerInfo = {
    name: "Shiftati di Testa",
    role: "Codemotion Live Session",
  },
}) => {
  return (
    <div className={styles.slideContainer}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Q&A / Conclusioni</span>
        <span className={styles.talkMeta}>Codemotion 2026</span>
      </header>

      <div className={`${styles.body} ${styles.closingGrid}`}>
        <div>
          <h2 className={styles.titleBig} style={{ fontSize: "5rem" }}>
            {title}
          </h2>
          <p className={styles.subtitleBig}>{subtitle}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <p style={{ fontSize: "1.8rem", color: "var(--color-accent)", fontWeight: 700 }}>
              {speakerInfo.name}
            </p>
            <p style={{ fontSize: "1.4rem", color: "var(--color-text-muted)" }}>
              {speakerInfo.role}
            </p>
          </div>
        </div>

        <div className={styles.qrContainer}>
          <div
            style={{
              width: "220px",
              height: "220px",
              backgroundColor: "var(--color-brand-white)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-2)",
            }}
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              {/* Stylish QR code mockup using brand tokens */}
              <rect width="100" height="100" fill="var(--color-brand-white)" />
              <rect x="10" y="10" width="30" height="30" fill="var(--color-brand-navy)" />
              <rect x="15" y="15" width="20" height="20" fill="var(--color-brand-white)" />
              <rect x="20" y="20" width="10" height="10" fill="var(--color-brand-navy)" />

              <rect x="60" y="10" width="30" height="30" fill="var(--color-brand-navy)" />
              <rect x="65" y="15" width="20" height="20" fill="var(--color-brand-white)" />
              <rect x="70" y="20" width="10" height="10" fill="var(--color-brand-navy)" />

              <rect x="10" y="60" width="30" height="30" fill="var(--color-brand-navy)" />
              <rect x="15" y="65" width="20" height="20" fill="var(--color-brand-white)" />
              <rect x="20" y="70" width="10" height="10" fill="var(--color-brand-navy)" />

              <rect x="45" y="45" width="15" height="15" fill="var(--color-brand-orange)" />
              <rect x="45" y="15" width="8" height="18" fill="var(--color-brand-navy)" />
              <rect x="45" y="70" width="18" height="8" fill="var(--color-brand-navy)" />
              <rect x="70" y="45" width="18" height="20" fill="var(--color-brand-navy)" />
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            {links.map((link) => (
              <p key={link.label} style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>
                <strong>{link.label}:</strong> {link.url}
              </p>
            ))}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <span>Feedback & Applausi</span>
        <span>Buon proseguimento a Codemotion!</span>
      </footer>
    </div>
  );
};
