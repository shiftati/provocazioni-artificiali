import { useState, useMemo, type FC } from "react";
import type { TalkSessionRecord, SessionEvent } from "../../types";
import { formatTimeWithSeconds, formatRelativeTime } from "../../utils/time";
import { Button } from "../../components/ui/Button";
import { CopyIcon, DownloadIcon } from "../../components/icons";
import styles from "./SessionTimeline.module.scss";

export interface SessionTimelineProps {
  session: TalkSessionRecord;
  onToast: (msg: string) => void;
}

type FilterCategory = "all" | "slides" | "game" | "nav";

function getEventBadgeInfo(event: SessionEvent): { icon: string; styleClass: string } {
  switch (event.type) {
    case "SESSION_START":
      return { icon: "🚀", styleClass: styles.typeStart ?? "" };
    case "SESSION_END":
      return { icon: "🏁", styleClass: styles.typeEnd ?? "" };
    case "SLIDE_VIEW":
      return { icon: "🖼️", styleClass: styles.typeSlide ?? "" };
    case "MODE_CHANGE":
      if (event.details?.mode === "game") {
        return { icon: "🎮", styleClass: styles.typeGame ?? "" };
      }
      return { icon: "🖼️", styleClass: styles.typeSlide ?? "" };
    case "NAVIGATION":
      return { icon: "🧭", styleClass: styles.typeNavigation ?? "" };
    case "PROVOCATION_VIEW":
      return { icon: "💡", styleClass: styles.typeGame ?? "" };
    case "PROVOCATION_ACCEPT":
      return { icon: "✅", styleClass: styles.typeGame ?? "" };
    case "PROVOCATION_SKIP":
      return { icon: "🔀", styleClass: styles.typeGame ?? "" };
    case "CHALLENGE_START":
    case "CHALLENGE_TIMEOUT":
      return { icon: "⏱️", styleClass: styles.typeGame ?? "" };
    case "DISCUSSION_PAUSE":
      return { icon: "⏸️", styleClass: styles.typeGame ?? "" };
    case "DISCUSSION_RESUME":
      return { icon: "▶️", styleClass: styles.typeGame ?? "" };
    case "DISCUSSION_END":
      return { icon: "💬", styleClass: styles.typeGame ?? "" };
    case "STOP_CALLS":
      return { icon: "🔔", styleClass: styles.typeStopCalls ?? "" };
    default:
      return { icon: "📌", styleClass: styles.typeNavigation ?? "" };
  }
}

export const SessionTimeline: FC<SessionTimelineProps> = ({ session, onToast }) => {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const events = useMemo(() => {
    return session.events || [];
  }, [session.events]);

  const counts = useMemo(() => {
    const all = events.length;
    let slides = 0;
    let game = 0;
    let nav = 0;

    for (const evt of events) {
      if (evt.type === "SLIDE_VIEW") slides++;
      if (
        evt.type.startsWith("PROVOCATION_") ||
        evt.type.startsWith("CHALLENGE_") ||
        evt.type.startsWith("DISCUSSION_") ||
        (evt.type === "MODE_CHANGE" && evt.details?.mode === "game")
      ) {
        game++;
      }
      if (evt.type === "NAVIGATION" || evt.type === "MODE_CHANGE") {
        nav++;
      }
    }

    return { all, slides, game, nav };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Category filter
      if (filter === "slides" && evt.type !== "SLIDE_VIEW") {
        return false;
      }
      if (
        filter === "game" &&
        !(
          evt.type.startsWith("PROVOCATION_") ||
          evt.type.startsWith("CHALLENGE_") ||
          evt.type.startsWith("DISCUSSION_") ||
          (evt.type === "MODE_CHANGE" && evt.details?.mode === "game")
        )
      ) {
        return false;
      }
      if (
        filter === "nav" &&
        evt.type !== "NAVIGATION" &&
        evt.type !== "MODE_CHANGE"
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = evt.description.toLowerCase().includes(query);
        const matchesSlideTitle =
          typeof evt.details?.slideTitle === "string" &&
          evt.details.slideTitle.toLowerCase().includes(query);
        const matchesProvTitle =
          typeof evt.details?.provocationTitle === "string" &&
          evt.details.provocationTitle.toLowerCase().includes(query);
        const matchesPath =
          typeof evt.details?.path === "string" &&
          evt.details.path.toLowerCase().includes(query);

        return matchesDesc || matchesSlideTitle || matchesProvTitle || matchesPath;
      }

      return true;
    });
  }, [events, filter, searchQuery]);

  const handleCopyText = async () => {
    if (events.length === 0) {
      onToast("Nessun evento da copiare.");
      return;
    }

    const textLines = events.map((e) => {
      const time = formatTimeWithSeconds(e.timestamp);
      const rel = formatRelativeTime(e.timestamp, session.startedAt);
      return `[${time}] (${rel}) ${e.description}`;
    });

    const output = `--- STORICO SESSIONE: ${session.name} ---\n` + textLines.join("\n");

    try {
      await navigator.clipboard.writeText(output);
      onToast("Storico eventi copiato negli appunti!");
    } catch {
      onToast("Errore durante la copia dello storico.");
    }
  };

  const handleExportJson = () => {
    if (events.length === 0) {
      onToast("Nessun evento da esportare.");
      return;
    }

    const filename = `eventi_sessione_${session.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date(session.startedAt).toISOString().slice(0, 10)}.json`;
    const jsonStr = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onToast("File JSON eventi esportato con successo!");
  };

  return (
    <div className={styles.timelineContainer}>
      {/* Header bar */}
      <div className={styles.timelineHeader}>
        <div className={styles.timelineHeaderLeft}>
          <div className={styles.timelineTitleRow}>
            <h3 className={styles.timelineTitle}>Cronologia & Storico Eventi</h3>
            <span className={styles.eventsCountBadge}>
              {events.length} {events.length === 1 ? "evento" : "eventi"}
            </span>
          </div>
          <p className={styles.timelineSubtitle}>
            Tracciamento dettagliato di tutti i passaggi eseguiti durante la sessione
            con timestamp assoluto e relativo.
          </p>
        </div>

        <div className={styles.timelineHeaderActions}>
          <Button
            variant="ghost"
            size="md"
            onClick={handleCopyText}
            leftIcon={<CopyIcon size={16} />}
            title="Copia l'intero storico in formato testo negli appunti"
          >
            Copia Storico
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportJson}
            leftIcon={<DownloadIcon size={16} />}
            title="Esporta solo la lista eventi in un file JSON"
          >
            Esporta Eventi JSON
          </Button>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className={styles.filterBar}>
        <div className={styles.filterChips} role="tablist" aria-label="Filtro categoria eventi">
          <button
            type="button"
            className={`${styles.filterChip} ${filter === "all" ? styles.active : ""}`}
            onClick={() => setFilter("all")}
          >
            Tutti gli eventi <span className={styles.chipCount}>{counts.all}</span>
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${filter === "slides" ? styles.active : ""}`}
            onClick={() => setFilter("slides")}
          >
            🖼️ Slide <span className={styles.chipCount}>{counts.slides}</span>
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${filter === "game" ? styles.active : ""}`}
            onClick={() => setFilter("game")}
          >
            🎮 Gioco & Provocazioni <span className={styles.chipCount}>{counts.game}</span>
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${filter === "nav" ? styles.active : ""}`}
            onClick={() => setFilter("nav")}
          >
            🧭 Navigazione <span className={styles.chipCount}>{counts.nav}</span>
          </button>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Cerca evento o slide..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cerca eventi"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearchQuery("")}
              aria-label="Cancella ricerca"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Event Timeline List */}
      {filteredEvents.length === 0 ? (
        <div className={styles.emptyTimeline}>
          <div className={styles.emptyIcon}>⏱️</div>
          <h4>Nessun evento trovato</h4>
          <p>
            {events.length === 0
              ? "Non ci sono ancora eventi registrati per questa sessione. Gli eventi vengono salvati automaticamente ad ogni cambio slide, passaggio al gioco, provocazione o navigazione."
              : "Nessun evento corrisponde ai filtri di ricerca impostati. Prova a selezionare un'altra categoria o cancella il termine di ricerca."}
          </p>
        </div>
      ) : (
        <div className={styles.timelineList}>
          {filteredEvents.map((evt, idx) => {
            const badge = getEventBadgeInfo(evt);
            const timeFormatted = formatTimeWithSeconds(evt.timestamp);
            const relFormatted = formatRelativeTime(evt.timestamp, session.startedAt);

            return (
              <div key={evt.id || `evt_${idx}`} className={styles.timelineItem}>
                <div
                  className={`${styles.eventIconNode} ${badge.styleClass}`}
                  title={evt.type}
                  aria-hidden="true"
                >
                  {badge.icon}
                </div>

                <div className={styles.eventTimeCol}>
                  <span className={styles.exactTime}>{timeFormatted}</span>
                  <span
                    className={styles.relativeTimeBadge}
                    title="Tempo trascorso dall'avvio del talk"
                  >
                    {relFormatted}
                  </span>
                </div>

                <div className={styles.eventBody}>
                  <p className={styles.eventDescription}>{evt.description}</p>

                  {/* Contextual tags if available */}
                  <div className={styles.eventMetaTags}>
                    {typeof evt.details?.slideNumber === "number" && (
                      <span className={styles.metaTag}>
                        Slide #{evt.details.slideNumber}
                      </span>
                    )}
                    {typeof evt.details?.provocationNumber === "number" && (
                      <span className={styles.metaTag}>
                        Provocazione #{evt.details.provocationNumber}
                      </span>
                    )}
                    {evt.details?.path && (
                      <span className={styles.metaTag}>
                        Percorso: {String(evt.details.path)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
