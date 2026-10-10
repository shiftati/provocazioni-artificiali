import type { FC } from "react";
import type { TalkSessionRecord } from "../../types";
import { formatDurationSeconds, formatDateTime } from "../../utils/time";
import styles from "./AnalyticsView.module.scss";

interface MultiSessionChartProps {
  sessions: TalkSessionRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const MultiSessionChart: FC<MultiSessionChartProps> = ({
  sessions,
  selectedId,
  onSelect,
}) => {
  if (sessions.length < 2) return null;

  // Show up to the latest 6 sessions in chronological order (oldest to newest)
  const displaySessions = [...sessions].slice(0, 6).reverse();

  const maxDuration = Math.max(
    ...displaySessions.map((s) => s.totalDurationSeconds),
    60
  );

  const svgWidth = 800;
  const svgHeight = 200;
  const paddingBottom = 40;
  const paddingTop = 25;
  const chartHeight = svgHeight - paddingBottom - paddingTop;
  const barWidth = 44;
  const gap = (svgWidth - displaySessions.length * barWidth) / (displaySessions.length + 1);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>Confronto tra Sessioni</h3>
          <p className={styles.chartSubtitle}>
            Evoluzione della durata totale e del numero di provocazioni affrontate nelle varie sessioni
          </p>
        </div>
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: "var(--color-accent)" }}
            />
            Sessione selezionata
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: "var(--color-surface-active)" }}
            />
            Altre sessioni
          </span>
        </div>
      </div>

      <div className={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.chartSvg}
          role="img"
          aria-label="Confronto durata delle varie sessioni"
        >
          {/* Grid lines */}
          {[0.33, 0.66, 1].map((pct) => {
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

          {/* Session Bars */}
          {displaySessions.map((s, idx) => {
            const x = gap + idx * (barWidth + gap);
            const height = Math.max(
              8,
              (s.totalDurationSeconds / maxDuration) * chartHeight
            );
            const y = svgHeight - paddingBottom - height;
            const isSelected = s.id === selectedId;

            return (
              <g
                key={s.id}
                onClick={() => onSelect(s.id)}
                style={{ cursor: "pointer" }}
                className={styles.barGroup}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={6}
                  ry={6}
                  fill={
                    isSelected
                      ? "var(--color-accent)"
                      : "var(--color-surface-active)"
                  }
                  stroke={isSelected ? "var(--color-brand-white)" : "var(--color-border)"}
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Duration text */}
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill={isSelected ? "var(--color-accent)" : "var(--color-text-muted)"}
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {formatDurationSeconds(s.totalDurationSeconds)}
                </text>

                {/* Provocations badge badge inside or below bar */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - paddingBottom + 16}
                  textAnchor="middle"
                  fill="var(--color-text)"
                  fontSize="10"
                  fontFamily="var(--font-display)"
                  fontWeight="bold"
                >
                  {s.provocationsCount} prov.
                </text>

                {/* Date snippet */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - paddingBottom + 30}
                  textAnchor="middle"
                  fill="var(--color-text-subtle)"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                >
                  {formatDateTime(s.startedAt).split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
