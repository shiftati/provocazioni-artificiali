import type { FC } from "react";
import type { TalkSessionRecord } from "../../types";
import { formatDurationSeconds } from "../../utils/time";
import styles from "./AnalyticsView.module.scss";

interface TalkDistributionChartProps {
  session: TalkSessionRecord;
}

export const TalkDistributionChart: FC<TalkDistributionChartProps> = ({ session }) => {
  const { slides, provocations, totalDurationSeconds } = session;

  const totalSlideSeconds = slides.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalDiscussionSeconds = provocations.reduce(
    (acc, p) => acc + p.discussionDurationSeconds,
    0
  );
  const totalAcceptanceSeconds = provocations.reduce(
    (acc, p) => acc + p.acceptanceTimeSeconds,
    0
  );

  const calculatedSum =
    totalSlideSeconds + totalDiscussionSeconds + totalAcceptanceSeconds;
  const grandTotal = Math.max(totalDurationSeconds, calculatedSum, 1);

  const slidePct = Math.round((totalSlideSeconds / grandTotal) * 100);
  const discPct = Math.round((totalDiscussionSeconds / grandTotal) * 100);
  const acceptPct = Math.round((totalAcceptanceSeconds / grandTotal) * 100);
  const otherPct = Math.max(0, 100 - slidePct - discPct - acceptPct);

  // SVG circle calculations
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Segment stroke offsets
  const slideStroke = (slidePct / 100) * circumference;
  const discStroke = (discPct / 100) * circumference;
  const acceptStroke = (acceptPct / 100) * circumference;
  const otherStroke = (otherPct / 100) * circumference;

  let currentOffset = 0;
  const offsetSlide = currentOffset;
  currentOffset += slideStroke;
  const offsetDisc = currentOffset;
  currentOffset += discStroke;
  const offsetAccept = currentOffset;
  currentOffset += acceptStroke;
  const offsetOther = currentOffset;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>Ripartizione del Talk</h3>
          <p className={styles.chartSubtitle}>
            Suddivisione del tempo tra slide teoriche, discussioni e momenti di scelta
          </p>
        </div>
      </div>

      <div className={styles.distributionLayout}>
        {/* Donut Chart */}
        <div className={styles.donutWrapper}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={styles.donutSvg}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--color-surface-raised)"
              strokeWidth={strokeWidth}
            />

            {/* Slide segment */}
            {slideStroke > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="var(--color-mint)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${slideStroke} ${circumference}`}
                strokeDashoffset={-offsetSlide}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )}

            {/* Discussion segment */}
            {discStroke > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="var(--color-brand-blue)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${discStroke} ${circumference}`}
                strokeDashoffset={-offsetDisc}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )}

            {/* Acceptance segment */}
            {acceptStroke > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="var(--color-brand-yellow)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${acceptStroke} ${circumference}`}
                strokeDashoffset={-offsetAccept}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )}

            {/* Other / Transitions segment */}
            {otherStroke > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="var(--color-text-subtle)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${otherStroke} ${circumference}`}
                strokeDashoffset={-offsetOther}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )}
          </svg>
          <div className={styles.donutCenter}>
            <span className={styles.donutTotal}>
              {formatDurationSeconds(totalDurationSeconds)}
            </span>
            <span className={styles.donutLabel}>Totale</span>
          </div>
        </div>

        {/* Legend with numbers */}
        <div className={styles.distributionDetails}>
          <div className={styles.distRow}>
            <div className={styles.distLabelGroup}>
              <span
                className={styles.legendColor}
                style={{ background: "var(--color-mint)" }}
              />
              <span>Slide Presentazione</span>
            </div>
            <strong className={styles.distVal}>
              {formatDurationSeconds(totalSlideSeconds)} ({slidePct}%)
            </strong>
          </div>

          <div className={styles.distRow}>
            <div className={styles.distLabelGroup}>
              <span
                className={styles.legendColor}
                style={{ background: "var(--color-brand-blue)" }}
              />
              <span>Discussione Provocazioni</span>
            </div>
            <strong className={styles.distVal}>
              {formatDurationSeconds(totalDiscussionSeconds)} ({discPct}%)
            </strong>
          </div>

          <div className={styles.distRow}>
            <div className={styles.distLabelGroup}>
              <span
                className={styles.legendColor}
                style={{ background: "var(--color-brand-yellow)" }}
              />
              <span>Tempo di Scelta / Accettazione</span>
            </div>
            <strong className={styles.distVal}>
              {formatDurationSeconds(totalAcceptanceSeconds)} ({acceptPct}%)
            </strong>
          </div>

          {otherPct > 0 && (
            <div className={styles.distRow}>
              <div className={styles.distLabelGroup}>
                <span
                  className={styles.legendColor}
                  style={{ background: "var(--color-text-subtle)" }}
                />
                <span>Pause & Transizioni</span>
              </div>
              <strong className={styles.distVal}>
                {formatDurationSeconds(Math.max(0, totalDurationSeconds - calculatedSum))} ({otherPct}%)
              </strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
