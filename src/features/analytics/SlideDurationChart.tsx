import { useState, type FC } from "react";
import type { SlideStat } from "../../types";
import { formatDurationSeconds } from "../../utils/time";
import styles from "./AnalyticsView.module.scss";

interface SlideDurationChartProps {
  slides: SlideStat[];
}

interface ChartItem {
  id: string;
  label: string;
  title: string;
  durationSeconds: number;
  slideIndex: number;
  visits: number;
}

export const SlideDurationChart: FC<SlideDurationChartProps> = ({ slides }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Construct chart items for slides
  const items: ChartItem[] = slides.map((slide, idx) => ({
    id: slide.slideId,
    label: `#${idx + 1}`,
    title: slide.slideTitle,
    durationSeconds: slide.durationSeconds,
    slideIndex: idx,
    visits: slide.visits,
  }));

  const maxDuration = Math.max(
    ...slides.map((s) => s.durationSeconds),
    30 // minimum scale 30s
  );

  const totalSlideTime = slides.reduce((acc, s) => acc + s.durationSeconds, 0);

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
  const barWidth = 34;
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
          </div>
          <p className={styles.chartSubtitle}>
            Tempo totale speso su ciascuna delle {slides.length} slide della presentazione
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
          aria-label="Grafico a barre della durata delle singole slide"
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

            const height =
              maxDuration > 0
                ? Math.max(
                    item.durationSeconds > 0 ? 6 : 4,
                    (item.durationSeconds / maxDuration) * chartHeight
                  )
                : 4;
            const y = svgHeight - paddingBottom - height;

            const isAboveAvg = item.durationSeconds > avgDuration * 1.35;
            const fill = isHovered
              ? "url(#barGradientHover)"
              : isAboveAvg
              ? "url(#barGradientAccent)"
              : "url(#barGradientMint)";

            return (
              <g
                key={item.id}
                className={styles.barGroup}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`Slide ${item.label}: ${item.title}, durata ${formatDurationSeconds(item.durationSeconds)}`}
              >
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={4}
                  ry={4}
                  fill={fill}
                  className={styles.barRect}
                  stroke={isHovered ? "#ffffff" : "none"}
                  strokeWidth={isHovered ? 2 : 0}
                />

                {/* Duration text above bar */}
                {item.durationSeconds > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fill={isHovered ? "var(--color-accent)" : "var(--color-text-muted)"}
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fontWeight={isHovered ? "bold" : "normal"}
                  >
                    {formatDurationSeconds(item.durationSeconds)}
                  </text>
                )}

                {/* Item label at bottom */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - paddingBottom + 18}
                  textAnchor="middle"
                  fill={isHovered ? "var(--color-text)" : "var(--color-text-muted)"}
                  fontSize="12"
                  fontFamily="var(--font-display)"
                  fontWeight={isHovered ? "bold" : "normal"}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Docked tooltip */}
      <div className={styles.chartTooltipArea}>
        {hoveredItem ? (
          <div className={styles.activeSlideTooltip}>
            <span className={styles.tooltipBadge}>
              Slide {hoveredItem.slideIndex + 1} di {slides.length}
            </span>
            <strong className={styles.tooltipTitle}>{hoveredItem.title}</strong>
            <div className={styles.tooltipStatsRow}>
              <span>
                Durata:{" "}
                <strong>{formatDurationSeconds(hoveredItem.durationSeconds)}</strong>
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
        ) : (
          <div className={styles.tooltipHint}>
            Passa il mouse sulle barre per visualizzare i dettagli di ciascuna slide.
          </div>
        )}
      </div>
    </div>
  );
};
