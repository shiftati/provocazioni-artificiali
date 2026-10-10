import { useState, type FC } from "react";
import type { ProvocationStat } from "../../types";
import { formatDurationSeconds, formatDateTime, deduplicateProvocations } from "../../utils/time";
import { CheckIcon, ClockIcon, EditIcon } from "../../components/icons";
import { ProvocationEditorModal } from "./ProvocationEditorModal";
import styles from "./AnalyticsView.module.scss";

interface ProvocationsChartProps {
  provocations: ProvocationStat[];
  onUpdateProvocation?: (updated: ProvocationStat) => void;
  onDeleteProvocation?: (id: string) => void;
}

export const ProvocationsChart: FC<ProvocationsChartProps> = ({
  provocations,
  onUpdateProvocation,
  onDeleteProvocation,
}) => {
  const [editingProv, setEditingProv] = useState<{
    prov: ProvocationStat;
    index: number;
  } | null>(null);

  const cleanProvocations = deduplicateProvocations(provocations);

  if (cleanProvocations.length === 0) {
    return (
      <div className={styles.emptyProvocations}>
        <div className={styles.emptyIcon}>🃏</div>
        <h4>Nessuna provocazione discussa in questa sessione</h4>
        <p>
          Durante il gioco, quando accetti una provocazione viene registrato il tempo impiegato per decidere e la durata effettiva della discussione.
        </p>
      </div>
    );
  }

  const MAX_ACCEPTANCE_SECONDS = 30;
  const MAX_DISCUSSION_SECONDS = 300; // 5 minutes

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>Dettaglio Provocazioni</h3>
          <p className={styles.chartSubtitle}>
            Una card per ogni provocazione (sessione di gioco da "Inizia il gioco" al termine dei 5m o cambio provocazione). Puoi modificare o aggiungere il titolo di ciascuna card.
          </p>
        </div>
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: "var(--color-brand-yellow)" }}
            />
            Tempo Accettazione (max 30s)
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: "var(--color-brand-blue)" }}
            />
            Tempo Discussione (max 5m)
          </span>
        </div>
      </div>

      <div className={styles.provocationsList}>
        {cleanProvocations.map((prov, index) => {
          const acceptancePct = Math.min(
            100,
            Math.round((prov.acceptanceTimeSeconds / MAX_ACCEPTANCE_SECONDS) * 100)
          );
          const discussionPct = Math.min(
            100,
            Math.round((prov.discussionDurationSeconds / MAX_DISCUSSION_SECONDS) * 100)
          );

          // Acceptance speed classification
          const speedLabel =
            prov.acceptanceTimeSeconds <= 12
              ? "⚡ Fulminea"
              : prov.acceptanceTimeSeconds <= 22
              ? "⏱️ Rapida"
              : "⏳ Riflessiva";

          const hasCustomTitle = Boolean(
            prov.provocationTitle &&
              prov.provocationTitle.trim() &&
              prov.provocationTitle !== "Provocazione"
          );

          return (
            <div key={prov.id || index} className={styles.provocationCard}>
              <div className={styles.provocationTop}>
                <div className={styles.provocationBadgeGroup}>
                  <span className={styles.provocationIndexBadge}>
                    #{index + 1}
                  </span>
                  <span className={styles.provocationSpeedBadge}>
                    {speedLabel}
                  </span>
                </div>
                <div className={styles.provocationTopRight}>
                  {prov.completedAt && (
                    <span className={styles.provocationMeta}>
                      {formatDateTime(prov.completedAt)}
                    </span>
                  )}
                  {onUpdateProvocation && (
                    <button
                      type="button"
                      className={styles.editCardBtn}
                      onClick={() => setEditingProv({ prov, index })}
                      title="Modifica o aggiungi titolo alla provocazione"
                      aria-label={`Modifica titolo provocazione ${index + 1}`}
                    >
                      <EditIcon size={13} />
                      <span>Modifica</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Title area (editable) */}
              <div
                className={`${styles.provocationTitleWrapper} ${
                  !hasCustomTitle ? styles.untitledWrapper : ""
                }`}
                onClick={() =>
                  onUpdateProvocation && setEditingProv({ prov, index })
                }
                role={onUpdateProvocation ? "button" : undefined}
                tabIndex={onUpdateProvocation ? 0 : undefined}
                onKeyDown={(e) => {
                  if (
                    onUpdateProvocation &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    e.preventDefault();
                    setEditingProv({ prov, index });
                  }
                }}
                title={
                  onUpdateProvocation
                    ? "Clicca per modificare o aggiungere il titolo"
                    : undefined
                }
              >
                <h4
                  className={
                    hasCustomTitle
                      ? styles.provocationCardTitle
                      : styles.provocationCardPlaceholder
                  }
                >
                  {hasCustomTitle
                    ? prov.provocationTitle
                    : "+ Aggiungi titolo provocazione..."}
                </h4>
                {onUpdateProvocation && (
                  <span className={styles.inlineEditIcon}>
                    <EditIcon size={14} />
                  </span>
                )}
              </div>

              {prov.provocationSubtitle && (
                <p className={styles.provocationCardSubtitle}>
                  {prov.provocationSubtitle}
                </p>
              )}

              <div className={styles.metricsComparisonGrid}>
                {/* 1. Tempo di accettazione */}
                <div className={styles.metricGauge}>
                  <div className={styles.gaugeHeader}>
                    <span className={styles.gaugeLabel}>
                      <ClockIcon size={16} /> Tempo Accettazione
                    </span>
                    <strong
                      className={styles.gaugeValue}
                      style={{ color: "var(--color-brand-yellow)" }}
                    >
                      {prov.acceptanceTimeSeconds}s{" "}
                      <span className={styles.gaugeMax}>
                        / {MAX_ACCEPTANCE_SECONDS}s
                      </span>
                    </strong>
                  </div>
                  <div className={styles.gaugeTrack}>
                    <div
                      className={styles.gaugeFillYellow}
                      style={{ width: `${acceptancePct}%` }}
                    />
                  </div>
                </div>

                {/* 2. Tempo di discussione */}
                <div className={styles.metricGauge}>
                  <div className={styles.gaugeHeader}>
                    <span className={styles.gaugeLabel}>
                      <CheckIcon size={16} /> Durata Discussione
                    </span>
                    <strong
                      className={styles.gaugeValue}
                      style={{ color: "var(--color-brand-blue)" }}
                    >
                      {formatDurationSeconds(prov.discussionDurationSeconds)}{" "}
                      <span className={styles.gaugeMax}>/ 5m 00s</span>
                    </strong>
                  </div>
                  <div className={styles.gaugeTrack}>
                    <div
                      className={styles.gaugeFillBlue}
                      style={{ width: `${discussionPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Provocation Editor Modal */}
      <ProvocationEditorModal
        provocation={editingProv?.prov ?? null}
        provocationIndex={editingProv?.index ?? 0}
        isOpen={editingProv !== null}
        onClose={() => setEditingProv(null)}
        onSave={(updated) => {
          if (onUpdateProvocation) {
            onUpdateProvocation(updated);
          }
        }}
        onDelete={onDeleteProvocation}
      />
    </div>
  );
};
