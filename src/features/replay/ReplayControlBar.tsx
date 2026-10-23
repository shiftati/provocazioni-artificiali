import { type FC, useMemo } from "react";
import type { SessionEvent } from "../../types";
import { formatDurationSeconds } from "../../utils/time";
import {
  PlayIcon,
  PauseIcon,
  StepBackIcon,
  StepForwardIcon,
  CloseIcon,
  MicIcon,
  VideoIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
} from "../../components/icons";
import styles from "./ReplayControlBar.module.scss";

export interface ReplayControlBarProps {
  currentTime: number;
  totalDurationSeconds: number;
  isPlaying: boolean;
  playbackSpeed: number;
  activeEvent: SessionEvent | null;
  events: SessionEvent[];
  sessionStartTime: number;
  hasAudio?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  hasVideo?: boolean;
  isVideoVisible?: boolean;
  onToggleVideo?: () => void;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSetSpeed: (speed: number) => void;
  onPrevEvent: () => void;
  onNextEvent: () => void;
  onExit: () => void;
  isIdle?: boolean;
}

const SPEED_OPTIONS = [1, 2, 5, 10, 30];

export const ReplayControlBar: FC<ReplayControlBarProps> = ({
  currentTime,
  totalDurationSeconds,
  isPlaying,
  playbackSpeed,
  activeEvent,
  events,
  sessionStartTime,
  hasAudio = false,
  isMuted = false,
  onToggleMute,
  hasVideo = false,
  isVideoVisible = true,
  onToggleVideo,
  onTogglePlay,
  onSeek,
  onSetSpeed,
  onPrevEvent,
  onNextEvent,
  onExit,
  isIdle = false,
}) => {
  const progressPct =
    totalDurationSeconds > 0
      ? Math.min(100, Math.max(0, (currentTime / totalDurationSeconds) * 100))
      : 0;

  // Markers on the timeline
  const timelineMarkers = useMemo(() => {
    if (!totalDurationSeconds || events.length === 0) return [];
    return events.map((evt) => {
      const relSec = Math.max(0, (evt.timestamp - sessionStartTime) / 1000);
      const pct = Math.min(100, Math.max(0, (relSec / totalDurationSeconds) * 100));

      let typeClass = styles.markerSlide;
      if (
        evt.type.startsWith("PROVOCATION_") ||
        evt.type.startsWith("CHALLENGE_") ||
        evt.type.startsWith("DISCUSSION_") ||
        (evt.type === "MODE_CHANGE" && evt.details?.mode === "game")
      ) {
        typeClass = styles.markerGame;
      } else if (evt.type === "STOP_CALLS") {
        typeClass = styles.markerStopCalls;
      }

      return {
        id: evt.id,
        pct,
        timeSec: relSec,
        title: `[${formatDurationSeconds(relSec)}] ${evt.description}`,
        typeClass,
      };
    });
  }, [events, sessionStartTime, totalDurationSeconds]);

  return (
    <div
      className={`${styles.controlBarWrapper} ${isIdle ? styles.idleHidden : ""}`}
      role="region"
      aria-label="Controlli Replay"
    >
      {/* Timeline Scrubber */}
      <div className={styles.timelineScrubberContainer}>
        <div className={styles.timelineTrack}>
          <div
            className={styles.timelineProgress}
            style={{ width: `${progressPct}%` }}
          />
          {timelineMarkers.map((marker) => (
            <div
              key={marker.id}
              className={`${styles.timelineMarker} ${marker.typeClass}`}
              style={{ left: `${marker.pct}%` }}
              title={marker.title}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(marker.timeSec);
              }}
            />
          ))}
          <div
            className={styles.timelineThumb}
            style={{ left: `${progressPct}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(1, totalDurationSeconds)}
          step={0.5}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className={styles.rangeInput}
          aria-label="Avanzamento riproduzione talk"
        />
      </div>

      {/* Controls Row */}
      <div className={styles.controlsRow}>
        {/* Left: Playback buttons & Time */}
        <div className={styles.leftControls}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onPrevEvent}
            title="Evento precedente (Shift + Freccia Sinistra)"
            aria-label="Evento precedente"
          >
            <StepBackIcon size={16} />
          </button>

          <button
            type="button"
            className={styles.playPauseBtn}
            onClick={onTogglePlay}
            title={isPlaying ? "Metti in pausa (Spazio)" : "Riproduci (Spazio)"}
            aria-label={isPlaying ? "Pausa" : "Play"}
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={onNextEvent}
            title="Prossimo evento (Shift + Freccia Destra)"
            aria-label="Prossimo evento"
          >
            <StepForwardIcon size={16} />
          </button>

          <div className={styles.timeDisplay}>
            <span className={styles.timeCurrent}>
              {formatDurationSeconds(Math.floor(currentTime))}
            </span>
            <span className={styles.timeTotal}>
              {" "}
              / {formatDurationSeconds(Math.floor(totalDurationSeconds))}
            </span>
          </div>

          {hasAudio && (
            <div className={styles.audioControlsGroup}>
              {onToggleMute && (
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={onToggleMute}
                  title={isMuted ? "Attiva audio talk (M)" : "Silenzia audio talk (M)"}
                  aria-label={isMuted ? "Attiva audio talk" : "Silenzia audio talk"}
                >
                  {isMuted ? <VolumeMuteIcon size={16} /> : <VolumeHighIcon size={16} />}
                </button>
              )}
              <span className={styles.audioBadge} title="Traccia audio registrata sincronizzata al replay">
                <MicIcon size={12} />
                <span>AUDIO SYNC</span>
              </span>
            </div>
          )}

          {hasVideo && (
            <button
              type="button"
              className={`${styles.videoBadge} ${!isVideoVisible ? styles.inactiveBadge : ""}`}
              onClick={onToggleVideo}
              title={
                isVideoVisible
                  ? "Nascondi video webcam sincronizzato (V)"
                  : "Mostra video webcam sincronizzato (V)"
              }
              aria-label={
                isVideoVisible
                  ? "Nascondi riquadro video webcam"
                  : "Mostra riquadro video webcam"
              }
            >
              <VideoIcon size={12} />
              <span>{isVideoVisible ? "VIDEO ON" : "VIDEO OFF"}</span>
            </button>
          )}
        </div>

        {/* Center: Current active event pill */}
        <div className={styles.centerInfo}>
          {activeEvent && (
            <div
              className={styles.currentEventPill}
              title={activeEvent.description}
            >
              <span className={styles.eventIcon}>
                {activeEvent.type === "SLIDE_VIEW"
                  ? "🖼️"
                  : activeEvent.type === "SLIDE_ANIMATION"
                  ? "✨"
                  : activeEvent.type.startsWith("PROVOCATION_")
                  ? "💡"
                  : activeEvent.type.startsWith("CHALLENGE_")
                  ? "⏱️"
                  : activeEvent.type.startsWith("DISCUSSION_")
                  ? "💬"
                  : activeEvent.type === "STOP_CALLS"
                  ? "🔔"
                  : "📌"}
              </span>
              <span className={styles.eventText}>{activeEvent.description}</span>
            </div>
          )}
        </div>

        {/* Right: Speed controls & Exit */}
        <div className={styles.rightControls}>
          <div className={styles.speedGroup} role="group" aria-label="Velocità riproduzione">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                type="button"
                className={`${styles.speedBtn} ${
                  playbackSpeed === speed ? styles.activeSpeed : ""
                }`}
                onClick={() => onSetSpeed(speed)}
                title={`Velocità ${speed}x`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.exitBtn}
            onClick={onExit}
            title="Esci dal Replay e torna ad Analytics (Esc)"
          >
            <CloseIcon size={14} />
            <span>Esci</span>
          </button>
        </div>
      </div>
    </div>
  );
};
