import { useState, type FC } from "react";
import type { SlideStat } from "../../types";
import { formatDurationSeconds } from "../../utils/time";
import styles from "./AnalyticsView.module.scss";

interface SlideDurationChartProps {
  slides: SlideStat[];
  gameDurationSeconds?: number;
  provocationsCount?: number;
}

interface ChartItem {
  type: "slide" | "game";
  id: string;
  label: string;
  title: string;
  durationSeconds: number;
  slideIndex?: number;
  visits?: number;
  provocationsCount?: number;
}

export const SlideDurationChart: FC<SlideDurationChartProps> = ({
  slides,
  gameDurationSeconds = 0,
  provocationsCount = 0,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Construct chart items, placing the Game session right between Slide 11 and Slide 12
  const items: ChartItem[] = [];
  slides.forEach((slide, idx) => {
    items.push({
      type: "slide",
      id: slide.slideId,
      label: `#${idx + 1}`,
      title: slide.slideTitle,
      durationSeconds: slide.durationSeconds,
      slideIndex: idx,
      visits: slide.visits,
    });

    // Between Slide 11 (index 10 or id klippy-matrix) and Slide 12, insert Game session
    if (idx === 10 || slide.slideId === "klippy-matrix") {
      items.push({
        type: "game",
        id: "game-session",
        label: "🎮 Gioco",
        title: "Sessione di Gioco (Provocazioni)",
        durationSeconds: gameDurationSeconds,
        provocationsCount,
      });
    }
  });

  const maxDuration = Math.max(
    ...slides.map((s) => s.durationSeconds),
    gameDurationSeconds,
    30 // minimum scale 30s
  );

  const totalSlideTime = slides.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalSessionTime = totalSlideTime + gameDurationSeconds;

  const activeSlides = slides.filter((s) => s.durationSeconds > 0);
  const avgDuration =
    activeSlides.length > 0
      ? Math.round(totalSlideTime / activeSlides.length)
      : 0;

  // Chart dimensions
  const svgWidth = 860;
  const svgHeight = 240;
  const paddingBottom = 40;
  const paddingTop = 25;
  const chartHeight = svgHeight - paddingBottom - paddingTop;
  const barWidth = 32;
  const gap = (svgWidth - items.length * barWidth) / (items.length + 1);

  // Y coordinate for average line
  const avgY =
    svgHeight - paddingBottom - (avgDuration / maxDuration) * chartHeight;

  const hoveredItem = hoveredIndex !== null ? items[hoveredIndex] : null;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.chartTitleRow}>
            <h3 className={styles.chartTitle}>Durata di Ogni Slide</h3>
            <span className={styles.gamePhaseBadge}>
              🎮 Tempo di gioco tra slide 11 e 12:{" "}
              <strong>{formatDurationSeconds(gameDurationSeconds)}</strong>
            </span>
          </div>
          <p className={styles.chartSubtitle}>
            Tempo totale speso su ciascuna delle 14 slide e durante la sessione di gioco tra slide 11 e 12
          </p>
        </div>
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: "var(--color-mint)" }}
            />
            Slide nei tempi
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: "var(--color-accent)" }}
            />
            Slide con tempo elevato
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              }}
            />
            🎮 Tempo di Gioco (tra #11 e #12)
          </span>
          {avgDuration > 0 && (
            <span className={styles.legendItem}>
              <span
                className={styles.legendLine}
                style={{ borderColor: "var(--color-brand-yellow)" }}
              />
              Media slide ({formatDurationSeconds(avgDuration)})
            </span>
          )}
        </div>
      </div>

      <div className={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.chartSvg}
          role="img"
          aria-label="Grafico a barre della durata delle slide e del tempo di gioco"
        >
          <defs>
            <linearGradient id="barGradientMint" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-mint)" />
              <stop offset="100%" stopColor="rgba(94, 242, 184, 0.4)" />
            </linearGradient>
            <linearGradient id="barGradientAccent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="rgba(255, 85, 0, 0.4)" />
            </linearGradient>
            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
            <linearGradient id="barGradientGame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.5)" />
            </linearGradient>
            <linearGradient id="barGradientGameHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>

          {/* Background horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const y = svgHeight - paddingBottom - pct * chartHeight;
            const val = Math.round(pct * maxDuration);
            return (
              <g key={pct}>
                <line
                  x1={20}
                  y1={y}
                  x2={svgWidth - 20}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={25}
                  y={y - 4}
                  fill="var(--color-text-subtle)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {formatDurationSeconds(val)}
                </text>
              </g>
            );
          })}

          {/* Average Line for slides */}
          {avgDuration > 0 && (
            <g>
              <line
                x1={20}
                y1={avgY}
                x2={svgWidth - 20}
                y2={avgY}
                stroke="var(--color-brand-yellow)"
                strokeDasharray="6 4"
                strokeWidth="1.5"
              />
              <text
                x={svgWidth - 110}
                y={avgY - 6}
                fill="var(--color-brand-yellow)"
                fontSize="11"
                fontFamily="var(--font-mono)"
                fontWeight="bold"
              >
                Media slide: {formatDurationSeconds(avgDuration)}
              </text>
            </g>
          )}

          {/* Bars */}
          {items.map((item, idx) => {
            const x = gap + idx * (barWidth + gap);
            const isHovered = hoveredIndex === idx;
            const isGame = item.type === "game";

            const height =
              maxDuration > 0
                ? Math.max(
                    item.durationSeconds > 0 ? 6 : 4,
                    (item.durationSeconds / maxDuration) * chartHeight
                  )
                : 4;
            const y = svgHeight - paddingBottom - height;

            let fill = "url(#barGradientMint)";
            if (isGame) {
              fill = isHovered
                ? "url(#barGradientGameHover)"
                : "url(#barGradientGame)";
            } else {
              const isAboveAvg = item.durationSeconds > avgDuration * 1.35;
              fill = isHovered
                ? "url(#barGradientHover)"
                : isAboveAvg
                ? "url(#barGradientAccent)"
                : "url(#barGradientMint)";
            }

            return (
              <g
                key={item.id}
                className={styles.barGroup}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={
                  isGame
                    ? `Fase di Gioco tra slide 11 e 12, durata ${formatDurationSeconds(item.durationSeconds)}`
                    : `Slide ${item.label}: ${item.title}, durata ${formatDurationSeconds(item.durationSeconds)}`
                }
              >
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={isGame ? 6 : 4}
                  ry={isGame ? 6 : 4}
                  fill={fill}
                  className={`${styles.barRect} ${isGame ? styles.gameBarRect : ""}`}
                  stroke={
                    isHovered
                      ? "#ffffff"
                      : isGame
                      ? "rgba(139, 92, 246, 0.8)"
                      : "none"
                  }
                  strokeWidth={isHovered ? 2 : isGame ? 1.5 : 0}
                  strokeDasharray={
                    isGame && item.durationSeconds === 0 ? "3 3" : undefined
                  }
                />

                {/* Duration text above bar */}
                {item.durationSeconds > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fill={
                      isHovered
                        ? isGame
                          ? "#c084fc"
                          : "var(--color-accent)"
                        : isGame
                        ? "var(--color-brand-blue)"
                        : "var(--color-text-muted)"
                    }
                    fontSize={isGame ? "10" : "10"}
                    fontFamily="var(--font-mono)"
                    fontWeight={isHovered || isGame ? "bold" : "normal"}
                  >
                    {formatDurationSeconds(item.durationSeconds)}
                  </text>
                )}

                {/* Item label at bottom */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - paddingBottom + (isGame ? 19 : 18)}
                  textAnchor="middle"
                  fill={
                    isHovered
                      ? isGame
                        ? "#a855f7"
                        : "var(--color-text)"
                      : isGame
                      ? "var(--color-brand-blue)"
                      : "var(--color-text-muted)"
                  }
                  fontSize={isGame ? "10" : "12"}
                  fontFamily={isGame ? "var(--font-body)" : "var(--font-display)"}
                  fontWeight={isHovered || isGame ? "bold" : "normal"}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating or docked tooltip */}
      <div className={styles.chartTooltipArea}>
        {hoveredItem ? (
          hoveredItem.type === "game" ? (
            <div className={styles.activeSlideTooltip}>
              <span
                className={styles.tooltipBadge}
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                  color: "#fff",
                }}
              >
                🎮 FASE INTERATTIVA • TRA SLIDE 11 E 12
              </span>
              <strong className={styles.tooltipTitle}>
                {hoveredItem.title}
              </strong>
              <div className={styles.tooltipStatsRow}>
                <span>
                  Tempo totale di gioco:{" "}
                  <strong style={{ color: "var(--color-brand-blue)" }}>
                    {formatDurationSeconds(hoveredItem.durationSeconds)}
                  </strong>
                </span>
                <span>
                  Provocazioni completate:{" "}
                  <strong>{hoveredItem.provocationsCount ?? 0}</strong>
                </span>
                <span>
                  Quota sul talk:{" "}
                  <strong>
                    {totalSessionTime > 0
                      ? `${Math.round(
                          (hoveredItem.durationSeconds / totalSessionTime) * 100
                        )}%`
                      : "0%"}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.activeSlideTooltip}>
              <span className={styles.tooltipBadge}>
                Slide {(hoveredItem.slideIndex ?? 0) + 1} di {slides.length}
              </span>
              <strong className={styles.tooltipTitle}>
                {hoveredItem.title}
              </strong>
              <div className={styles.tooltipStatsRow}>
                <span>
                  Durata:{" "}
                  <strong>
                    {formatDurationSeconds(hoveredItem.durationSeconds)}
                  </strong>
                </span>
                <span>
                  Visite: <strong>{hoveredItem.visits ?? 1}</strong>
                </span>
                <span>
                  Quota sulle slide:{" "}
                  <strong>
                    {totalSlideTime > 0
                      ? `${Math.round(
                          (hoveredItem.durationSeconds / totalSlideTime) * 100
                        )}%`
                      : "0%"}
                  </strong>
                </span>
              </div>
            </div>
          )
        ) : (
          <div className={styles.tooltipHint}>
            Passa il mouse sulle barre per visualizzare i dettagli di ciascuna slide e il tempo di gioco tra slide 11 e 12.
          </div>
        )}
      </div>
    </div>
  );
};
