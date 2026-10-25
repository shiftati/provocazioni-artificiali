import type { FC } from "react";
import type { TalkSessionRecord } from "../../types";
import { formatDurationSeconds } from "../../utils/time";
import {
  ClockIcon,
  CheckIcon,
  PlayIcon,
  ShuffleIcon,
} from "../../components/icons";
import styles from "./AnalyticsView.module.scss";
import { PROVOCATIONS } from "../game/provocations.registry";

interface KPIStatsCardsProps {
  session: TalkSessionRecord;
}

export const KPIStatsCards: FC<KPIStatsCardsProps> = ({ session }) => {
  const { totalDurationSeconds, plannedEndTime, slides, provocations } =
    session;

  // Average time per slide (only counting visited slides)
  const visitedSlides = slides.filter(
    (s) => s.durationSeconds > 0 || s.visits > 0,
  );
  const avgSlideSeconds =
    visitedSlides.length > 0
      ? Math.round(
          visitedSlides.reduce((acc, s) => acc + s.durationSeconds, 0) /
            visitedSlides.length,
        )
      : 0;

  // Slide with longest duration
  const longestSlide = [...slides].sort(
    (a, b) => b.durationSeconds - a.durationSeconds,
  )[0];

  // Average acceptance time
  const avgAcceptanceSec =
    provocations.length > 0
      ? Math.round(
          provocations.reduce((acc, p) => acc + p.acceptanceTimeSeconds, 0) /
            provocations.length,
        )
      : 0;

  // Average discussion duration
  const avgDiscussionSec =
    provocations.length > 0
      ? Math.round(
          provocations.reduce(
            (acc, p) => acc + p.discussionDurationSeconds,
            0,
          ) / provocations.length,
        )
      : 0;

  return (
    <div className={styles.kpiGrid}>
      {/* 1. Durata Totale Talk */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Durata Totale Talk</span>
          <div
            className={styles.kpiIconWrapper}
            style={{ color: "var(--color-accent)" }}
          >
            <ClockIcon size={22} />
          </div>
        </div>
        <div className={styles.kpiValue}>
          {formatDurationSeconds(totalDurationSeconds)}
        </div>
        <div className={styles.kpiSub}>
          {plannedEndTime
            ? `Orario previsto fine: ${plannedEndTime}`
            : "Durata effettiva"}
        </div>
      </div>

      {/* 2. Provocazioni Discusse */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Provocazioni Fatte</span>
          <div
            className={styles.kpiIconWrapper}
            style={{ color: "var(--color-mint)" }}
          >
            <CheckIcon size={22} />
          </div>
        </div>
        <div className={styles.kpiValue}>
          {provocations.length}
          <span className={styles.kpiUnit}> / {PROVOCATIONS.length}</span>
        </div>
        <div className={styles.kpiSub}>
          {provocations.length > 0
            ? `${Math.round((provocations.length / PROVOCATIONS.length) * 100)}% del mazzo discusse`
            : "Nessuna provocazione discussa"}
        </div>
      </div>

      {/* 3. Tempo Medio di Accettazione */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Tempo Accettazione Medio</span>
          <div
            className={styles.kpiIconWrapper}
            style={{ color: "var(--color-brand-yellow)" }}
          >
            <PlayIcon size={22} />
          </div>
        </div>
        <div className={styles.kpiValue}>
          {avgAcceptanceSec > 0 ? `${avgAcceptanceSec}s` : "-"}
        </div>
        <div className={styles.kpiSub}>
          {avgAcceptanceSec > 0
            ? avgAcceptanceSec <= 15
              ? "Decisione molto rapida (<15s)"
              : "Decisione ponderata (>15s)"
            : "Tempo medio decisione"}
        </div>
      </div>

      {/* 4. Tempo Medio di Discussione */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Discussione Media</span>
          <div
            className={styles.kpiIconWrapper}
            style={{ color: "var(--color-brand-blue)" }}
          >
            <ShuffleIcon size={22} />
          </div>
        </div>
        <div className={styles.kpiValue}>
          {avgDiscussionSec > 0 ? formatDurationSeconds(avgDiscussionSec) : "-"}
        </div>
        <div className={styles.kpiSub}>Max consentito 5m (300s)</div>
      </div>

      {/* 5. Slide Più Lunga & Media per Slide */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Slide Più Lunga</span>
          <span className={styles.kpiBadge}>
            Media {formatDurationSeconds(avgSlideSeconds)}
          </span>
        </div>
        <div className={styles.kpiValueSmall}>
          {longestSlide && longestSlide.durationSeconds > 0
            ? `${longestSlide.slideTitle}`
            : "-"}
        </div>
        <div className={styles.kpiSub}>
          {longestSlide && longestSlide.durationSeconds > 0
            ? `Durata: ${formatDurationSeconds(longestSlide.durationSeconds)}`
            : "Nessuna slide visualizzata"}
        </div>
      </div>
    </div>
  );
};
