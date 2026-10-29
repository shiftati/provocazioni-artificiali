import { useState, useEffect, useRef, type FC, type ChangeEvent } from "react";
import type { StoredAudioRecording } from "../../utils/audioStorage";
import type { TalkSessionRecord } from "../../types";
import { formatDurationSeconds } from "../../utils/time";
import { Button } from "../../components/ui/Button";
import {
  PlayIcon,
  PauseIcon,
  StepBackIcon,
  StepForwardIcon,
  DownloadIcon,
  TrashIcon,
  MicIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
} from "../../components/icons";
import styles from "./TalkAudioPlayer.module.scss";

export interface TalkAudioPlayerProps {
  audioUrl: string;
  audioRecording: StoredAudioRecording;
  session: TalkSessionRecord;
  onDownload: () => void;
  onDelete: () => void;
  onLaunchReplay?: (startAtSeconds?: number) => void;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2];

export const TalkAudioPlayer: FC<TalkAudioPlayerProps> = ({
  audioUrl,
  audioRecording,
  session,
  onDownload,
  onDelete,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationFromElement, setDurationFromElement] = useState<number | null>(
    null,
  );
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);

  // Derive stable total duration (never Infinity or 0)
  const totalDuration =
    audioRecording.durationSeconds && audioRecording.durationSeconds > 0
      ? audioRecording.durationSeconds
      : durationFromElement &&
          Number.isFinite(durationFromElement) &&
          durationFromElement > 0
        ? durationFromElement
        : session.totalDurationSeconds > 0
          ? session.totalDurationSeconds
          : 1;

  // Handle audio element metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (Number.isFinite(d) && d > 0) {
        setDurationFromElement(d);
      }
    }
  };

  // Sync state on playback updates
  const handleTimeUpdate = () => {
    if (!isSeeking && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(totalDuration);
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= totalDuration) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio play prevented:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeekChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newSec = Number(e.target.value);
    setCurrentTime(newSec);
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = newSec;
      } catch (err) {
        console.warn("Error seeking in audio:", err);
      }
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = currentTime;
      } catch (err) {
        console.warn("Error seeking on end:", err);
      }
    }
  };

  const handleStep = (delta: number) => {
    const target = Math.min(totalDuration, Math.max(0, currentTime + delta));
    setCurrentTime(target);
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = target;
      } catch (err) {
        console.warn("Error stepping audio:", err);
      }
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const handleSetSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      try {
        audioRef.current.playbackRate = speed;
      } catch (err) {
        console.warn("Error setting playback rate:", err);
      }
    }
  };

  // Reset when audioUrl changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioUrl]);

  const progressPct =
    totalDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
      : 0;

  return (
    <div className={styles.audioPlayerCard}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header with Title, Meta and File Actions */}
      <div className={styles.audioHeader}>
        <div className={styles.audioTitleWrapper}>
          <MicIcon size={20} style={{ color: "var(--color-mint)" }} />
          <h3 className={styles.audioTitle}>Registrazione Audio del Talk</h3>
          <span className={styles.audioMeta}>
            {audioRecording?.blob
              ? `${(audioRecording.blob.size / (1024 * 1024)).toFixed(2)} MB`
              : ""}
            {totalDuration > 0
              ? ` • ${formatDurationSeconds(totalDuration)}`
              : ""}
          </span>
        </div>
        <div className={styles.audioActions}>
          <Button
            variant="secondary"
            size="md"
            onClick={onDownload}
            leftIcon={<DownloadIcon size={16} />}
            title="Scarica file audio sul computer"
          >
            Scarica
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={onDelete}
            leftIcon={<TrashIcon size={16} />}
            title="Elimina traccia audio registrata dalla memoria del browser"
            style={{ color: "var(--color-danger)" }}
          >
            Elimina
          </Button>
        </div>
      </div>

      {/* Linear Timeline Scrubber Bar */}
      <div className={styles.timelineScrubberContainer}>
        <div className={styles.timelineTrack}>
          <div
            className={styles.timelineProgress}
            style={{ width: `${progressPct}%` }}
          />
          <div
            className={styles.timelineThumb}
            style={{ left: `${progressPct}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(1, totalDuration)}
          step={0.1}
          value={currentTime}
          onChange={handleSeekChange}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
          className={styles.rangeInput}
          aria-label="Posizione traccia audio del talk"
        />
      </div>

      {/* Main Playback Controls Bar */}
      <div className={styles.controlsRow}>
        {/* Left: Play/Pause, Step -5s, +5s, and Time display */}
        <div className={styles.leftGroup}>
          <button
            type="button"
            className={styles.playPauseBtn}
            onClick={handleTogglePlay}
            title={isPlaying ? "Pausa (Spazio)" : "Riproduci (Spazio)"}
            aria-label={isPlaying ? "Pausa" : "Play"}
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>

          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => handleStep(-5)}
            title="Indietro di 5 secondi"
            aria-label="Indietro 5 secondi"
          >
            <StepBackIcon size={16} />
            <span className={styles.stepLabel}>5s</span>
          </button>

          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => handleStep(5)}
            title="Avanti di 5 secondi"
            aria-label="Avanti 5 secondi"
          >
            <StepForwardIcon size={16} />
            <span className={styles.stepLabel}>5s</span>
          </button>

          <div className={styles.timeDisplay}>
            <span className={styles.timeCurrent}>
              {formatDurationSeconds(Math.floor(currentTime))}
            </span>
            <span className={styles.timeDivider}> / </span>
            <span className={styles.timeTotal}>
              {formatDurationSeconds(Math.floor(totalDuration))}
            </span>
          </div>
        </div>

        {/* Right: Volume & Speed controls */}
        <div className={styles.rightGroup}>
          {/* Volume Group */}
          <div className={styles.volumeGroup}>
            <button
              type="button"
              className={styles.volumeBtn}
              onClick={handleToggleMute}
              title={isMuted ? "Attiva audio" : "Silenzia"}
              aria-label={isMuted ? "Attiva audio" : "Silenzia"}
            >
              {isMuted || volume === 0 ? (
                <VolumeMuteIcon size={16} />
              ) : (
                <VolumeHighIcon size={16} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className={styles.volumeSlider}
              aria-label="Volume audio"
            />
          </div>

          {/* Speed Group */}
          <div
            className={styles.speedGroup}
            role="group"
            aria-label="Velocità riproduzione audio"
          >
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                type="button"
                className={`${styles.speedBtn} ${
                  playbackSpeed === speed ? styles.activeSpeed : ""
                }`}
                onClick={() => handleSetSpeed(speed)}
                title={`Velocità ${speed}x`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
