import { useState, type FC } from "react";
import type { TalkSessionRecord } from "../../types";
import { formatDurationSeconds, getSessionGameDuration } from "../../utils/time";
import styles from "./AnalyticsView.module.scss";

interface SessionDurationChartProps {
  session: TalkSessionRecord;
  introEndSlide?: number;
}

interface PhaseItem {
  id: "intro" | "game" | "conclusion";
  label: string;
  title: string;
  rangeBadge: string;
  durationSeconds: number;
  percentage: number;
  details: string;
  gradientId: string;
  hoverGradientId: string;
  strokeColor: string;
}

export const SessionDurationChart: FC<SessionDurationChartProps> = ({
  session,
  introEndSlide = 11,
}) => {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  const endSlide = session.introEndSlide ?? introEndSlide ?? 11;
  const totalSlidesCount = session.slides.length || 14;

  const introSlides = session.slides.slice(0, endSlide);
  const conclusionSlides = session.slides.slice(endSlide);

  const introDuration = introSlides.reduce((acc, s) => acc + s.durationSeconds, 0);
  const gameDuration = getSessionGameDuration(session);
  const conclusionDuration = conclusionSlides.reduce(
    (acc, s) => acc + s.durationSeconds,
    0
  );

  const totalSessionTime = introDuration + gameDuration + conclusionDuration;

  const introPct =
    totalSessionTime > 0
      ? Math.round((introDuration / totalSessionTime) * 100)
      : 0;
  const gamePct =
    totalSessionTime > 0
      ? Math.round((gameDuration / totalSessionTime) * 100)
      : 0;
  const conclusionPct =
    totalSessionTime > 0
      ? Math.round((conclusionDuration / totalSessionTime) * 100)
      : 0;

  const introVisits = introSlides.reduce((acc, s) => acc + s.visits, 0);
  const conclusionVisits = conclusionSlides.reduce(
    (acc, s) => acc + s.visits,
    0
  );

  const items: PhaseItem[] = [
    {
      id: "intro",
      label: "Intro",
      title: `Introduzione (Slide 1 - ${endSlide})`,
      rangeBadge: `Slide 1-${endSlide}`,
      durationSeconds: introDuration,
      percentage: introPct,
      details: `${introSlides.length} slide complessive • ${introVisits} cambi slide registrati`,
      gradientId: "phaseGradientIntro",
      hoverGradientId: "phaseGradientIntroHover",
      strokeColor: "var(--color-mint)",
    },
    {
      id: "game",
      label: "Gioco",
      title: "Sessione di Gioco (Provocazioni)",
      rangeBadge: "Gioco interattivo",
      durationSeconds: gameDuration,
      percentage: gamePct,
      details: `${session.provocationsCount ?? 0} provocazioni discusse con la platea`,
      gradientId: "phaseGradientGame",
      hoverGradientId: "phaseGradientGameHover",
      strokeColor: "#8b5cf6",
    },
    {
      id: "conclusion",
      label: "Conclusione",
      title: `Conclusione (Slide ${endSlide + 1} - ${totalSlidesCount})`,
      rangeBadge: `Slide ${endSlide + 1}-${totalSlidesCount}`,
      durationSeconds: conclusionDuration,
      percentage: conclusionPct,
      details: `${conclusionSlides.length} slide conclusive • ${conclusionVisits} cambi slide registrati`,
      gradientId: "phaseGradientConclusion",
      hoverGradientId: "phaseGradientConclusionHover",
      strokeColor: "var(--color-accent)",
    },
  ];

  const maxDuration = Math.max(
    introDuration,
    gameDuration,
    conclusionDuration,
    60 // minimum scale 60s
  );

  // SVG Dimensions
  const svgWidth = 860;
  const svgHeight = 240;
  const paddingBottom = 45;
  const paddingTop = 30;
  const chartHeight = svgHeight - paddingBottom - paddingTop;
  const barWidth = 150;
  const gap = (svgWidth - items.length * barWidth) / (items.length + 1);

  const activeItem = items.find((it) => it.id === hoveredPhase) ?? null;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.chartTitleRow}>
            <h3 className={styles.chartTitle}>Durata delle sessioni</h3>
            <span className={styles.gamePhaseBadge}>
              ⏱️ Totale: <strong>{formatDurationSeconds(totalSessionTime)}</strong>
            </span>
          </div>
          <p className={styles.chartSubtitle}>
            Ripartizione del tempo tra l'introduzione (slide 1-{endSlide}), la sessione di gioco e la conclusione (slide {endSlide + 1}-{totalSlidesCount})
          </p>
        </div>
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: "var(--color-mint)" }}
            />
            Intro (Slide 1-{endSlide})
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              }}
            />
            Gioco (Provocazioni)
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: "var(--color-accent)" }}
            />
            Conclusione (Slide {endSlide + 1}-{totalSlidesCount})
          </span>
        </div>
      </div>

      <div className={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.chartSvg}
          role="img"
          aria-label="Grafico a barre della durata delle tre macro fasi del talk: Intro, Gioco e Conclusione"
        >
          <defs>
            <linearGradient id="phaseGradientIntro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-mint)" />
              <stop offset="100%" stopColor="rgba(94, 242, 184, 0.4)" />
            </linearGradient>
            <linearGradient id="phaseGradientIntroHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="var(--color-mint)" />
            </linearGradient>

            <linearGradient id="phaseGradientGame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.5)" />
            </linearGradient>
            <linearGradient id="phaseGradientGameHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>

            <linearGradient id="phaseGradientConclusion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="rgba(255, 85, 0, 0.4)" />
            </linearGradient>
            <linearGradient id="phaseGradientConclusionHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const y = svgHeight - paddingBottom - pct * chartHeight;
            const val = Math.round(pct * maxDuration);
            return (
              <g key={pct}>
                <line
                  x1={30}
                  y1={y}
                  x2={svgWidth - 30}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={35}
                  y={y - 4}
                  fill="var(--color-text-subtle)"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                >
                  {formatDurationSeconds(val)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {items.map((item, idx) => {
            const x = gap + idx * (barWidth + gap);
            const isHovered = hoveredPhase === item.id;

            const height =
              maxDuration > 0
                ? Math.max(
                    item.durationSeconds > 0 ? 8 : 4,
                    (item.durationSeconds / maxDuration) * chartHeight
                  )
                : 4;
            const y = svgHeight - paddingBottom - height;

            const fill = isHovered
              ? `url(#${item.hoverGradientId})`
              : `url(#${item.gradientId})`;

            return (
              <g
                key={item.id}
                className={styles.barGroup}
                onMouseEnter={() => setHoveredPhase(item.id)}
                onMouseLeave={() => setHoveredPhase(null)}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${item.label}: ${item.title}, durata ${formatDurationSeconds(item.durationSeconds)} (${item.percentage}%)`}
              >
                {/* Main Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={8}
                  ry={8}
                  fill={fill}
                  className={styles.barRect}
                  stroke={isHovered ? "#ffffff" : item.strokeColor}
                  strokeWidth={isHovered ? 2.5 : 1}
                />

                {/* Duration text and percentage above bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 10}
                  textAnchor="middle"
                  fill={isHovered ? "#ffffff" : "var(--color-text)"}
                  fontSize="13"
                  fontFamily="var(--font-mono)"
                  fontWeight="bold"
                >
                  {formatDurationSeconds(item.durationSeconds)}{" "}
                  <tspan
                    fill="var(--color-text-muted)"
                    fontSize="11"
                    fontWeight="normal"
                  >
                    ({item.percentage}%)
                  </tspan>
                </text>

                {/* Bottom label */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - paddingBottom + 20}
                  textAnchor="middle"
                  fill={isHovered ? "var(--color-text)" : "var(--color-text)"}
                  fontSize="15"
                  fontFamily="var(--font-display)"
                  fontWeight="bold"
                >
                  {item.label}
                </text>

                {/* Sub badge label */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - paddingBottom + 36}
                  textAnchor="middle"
                  fill="var(--color-text-muted)"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                >
                  {item.rangeBadge}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail Tooltip Card */}
      <div className={styles.chartTooltipArea}>
        {activeItem ? (
          <div className={styles.activeSlideTooltip}>
            <span
              className={styles.tooltipBadge}
              style={{
                background:
                  activeItem.id === "intro"
                    ? "var(--color-mint)"
                    : activeItem.id === "game"
                    ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                    : "var(--color-accent)",
                color: activeItem.id === "intro" ? "#000000" : "#ffffff",
              }}
            >
              FASE: {activeItem.label.toUpperCase()}
            </span>
            <strong className={styles.tooltipTitle}>{activeItem.title}</strong>
            <div className={styles.tooltipStatsRow}>
              <span>
                Durata:{" "}
                <strong style={{ color: activeItem.strokeColor }}>
                  {formatDurationSeconds(activeItem.durationSeconds)}
                </strong>
              </span>
              <span>
                Quota sul Talk: <strong>{activeItem.percentage}%</strong>
              </span>
              <span>
                Dettagli: <strong>{activeItem.details}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.tooltipHint}>
            Passa il mouse sulle tre macro-fasi (Intro, Gioco, Conclusione) per analizzare la ripartizione del tempo della sessione.
          </div>
        )}
      </div>
    </div>
  );
};
