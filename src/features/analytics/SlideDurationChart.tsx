import { useState, type FC } from "react";
import type { SlideStat } from "../../types";
import { formatDurationSeconds } from "../../utils/time";
import styles from "./AnalyticsView.module.scss";

interface SlideDurationChartProps {
  slides: SlideStat[];
}

export const SlideDurationChart: FC<SlideDurationChartProps> = ({ slides }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxDuration = Math.max(
    ...slides.map((s) => s.durationSeconds),
    30 // minimum scale 30s
  );

  const totalSlideTime = slides.reduce((acc, s) => acc + s.durationSeconds, 0);
  const avgDuration =
    slides.filter((s) => s.durationSeconds > 0).length > 0
      ? Math.round(
          totalSlideTime / slides.filter((s) => s.durationSeconds > 0).length
        )
      : 0;

  // Chart dimensions
  const svgWidth = 860;
  const svgHeight = 240;
  const paddingBottom = 40;
  const paddingTop = 25;
  const chartHeight = svgHeight - paddingBottom - paddingTop;
  const barWidth = 36;
  const gap = (svgWidth - slides.length * barWidth) / (slides.length + 1);

  // Y coordinate for average line
  const avgY =
    svgHeight - paddingBottom - (avgDuration / maxDuration) * chartHeight;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>Durata di Ogni Slide</h3>
          <p className={styles.chartSubtitle}>
            Tempo totale speso su ciascuna delle 14 slide (passa il cursore per i dettagli)
          </p>
        </div>
        <div className={styles.chartLegend}>
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
              style={{ background: "var(--color-mint)" }}
            />
            Slide nei tempi
          </span>
          {avgDuration > 0 && (
            <span className={styles.legendItem}>
              <span
                className={styles.legendLine}
                style={{ borderColor: "var(--color-brand-yellow)" }}
              />
              Media ({formatDurationSeconds(avgDuration)})
            </span>
          )}
        </div>
      </div>

      <div className={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.chartSvg}
          role="img"
          aria-label="Grafico a barre della durata delle slide"
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

          {/* Average Line */}
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
                x={svgWidth - 85}
                y={avgY - 6}
                fill="var(--color-brand-yellow)"
                fontSize="11"
                fontFamily="var(--font-mono)"
                fontWeight="bold"
              >
                Media: {formatDurationSeconds(avgDuration)}
              </text>
            </g>
          )}

          {/* Bars */}
          {slides.map((slide, idx) => {
            const x = gap + idx * (barWidth + gap);
            const height =
              maxDuration > 0
                ? Math.max(4, (slide.durationSeconds / maxDuration) * chartHeight)
                : 4;
            const y = svgHeight - paddingBottom - height;
            const isHovered = hoveredIndex === idx;
            const isAboveAvg = slide.durationSeconds > avgDuration * 1.35;
            const fill = isHovered
              ? "url(#barGradientHover)"
              : isAboveAvg
              ? "url(#barGradientAccent)"
              : "url(#barGradientMint)";

            return (
              <g
                key={slide.slideId}
                className={styles.barGroup}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`Slide ${idx + 1}: ${slide.slideTitle}, durata ${formatDurationSeconds(slide.durationSeconds)}`}
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
                  stroke={isHovered ? "var(--color-brand-white)" : "none"}
                  strokeWidth={isHovered ? 2 : 0}
                />

                {/* Duration text above bar */}
                {slide.durationSeconds > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fill={isHovered ? "var(--color-accent)" : "var(--color-text-muted)"}
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fontWeight={isHovered ? "bold" : "normal"}
                  >
                    {formatDurationSeconds(slide.durationSeconds)}
                  </text>
                )}

                {/* Slide index label at bottom */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - paddingBottom + 18}
                  textAnchor="middle"
                  fill={isHovered ? "var(--color-text)" : "var(--color-text-muted)"}
                  fontSize="12"
                  fontFamily="var(--font-display)"
                  fontWeight={isHovered ? "bold" : "normal"}
                >
                  #{idx + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating or docked tooltip */}
      <div className={styles.chartTooltipArea}>
        {hoveredIndex !== null && slides[hoveredIndex] ? (
          <div className={styles.activeSlideTooltip}>
            <span className={styles.tooltipBadge}>
              Slide {hoveredIndex + 1} di {slides.length}
            </span>
            <strong className={styles.tooltipTitle}>
              {slides[hoveredIndex].slideTitle}
            </strong>
            <div className={styles.tooltipStatsRow}>
              <span>
                Durata:{" "}
                <strong>
                  {formatDurationSeconds(slides[hoveredIndex].durationSeconds)}
                </strong>
              </span>
              <span>
                Visite: <strong>{slides[hoveredIndex].visits}</strong>
              </span>
              <span>
                Quota sul totale:{" "}
                <strong>
                  {totalSlideTime > 0
                    ? `${Math.round(
                        (slides[hoveredIndex].durationSeconds / totalSlideTime) *
                          100
                      )}%`
                    : "0%"}
                </strong>
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.tooltipHint}>
            Passa il mouse su una barra per visualizzare il titolo della slide, il numero di visite e la percentuale sul totale.
          </div>
        )}
      </div>
    </div>
  );
};
