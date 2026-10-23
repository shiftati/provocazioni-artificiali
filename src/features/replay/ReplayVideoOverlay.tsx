import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FC,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CloseIcon,
  VideoIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  UploadIcon,
} from "../../components/icons";
import styles from "./ReplayVideoOverlay.module.scss";

export interface ReplayVideoOverlayProps {
  videoUrl: string | null;
  fileName?: string;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  isMuted: boolean;
  hasAudioTrack?: boolean;
  onClose: () => void;
  onLinkVideoFile?: () => void;
}

export const ReplayVideoOverlay: FC<ReplayVideoOverlayProps> = ({
  videoUrl,
  fileName,
  currentTime,
  isPlaying,
  playbackSpeed,
  isMuted,
  hasAudioTrack = false,
  onClose,
  onLinkVideoFile,
}) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Position state: null initially until calculated on client mount
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoAudioMuted, setVideoAudioMuted] = useState<boolean>(() => {
    // If separate high-quality audio track exists, mute video to prevent echo
    return hasAudioTrack;
  });

  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({
    offsetX: 0,
    offsetY: 0,
  });

  // Calculate default bottom-right position on mount
  useEffect(() => {
    const defaultWidth = 320;
    const defaultHeight = 220;
    const rightMargin = 24;
    const bottomMargin = 96; // above the ReplayControlBar dock

    const initialX = Math.max(16, window.innerWidth - defaultWidth - rightMargin);
    const initialY = Math.max(16, window.innerHeight - defaultHeight - bottomMargin);

    setPosition({ x: initialX, y: initialY });

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const currentW = overlayRef.current?.offsetWidth || defaultWidth;
        const currentH = overlayRef.current?.offsetHeight || defaultHeight;
        const clampedX = Math.min(Math.max(10, prev.x), window.innerWidth - currentW - 10);
        const clampedY = Math.min(Math.max(10, prev.y), window.innerHeight - currentH - 10);
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle pointer drag
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Ignore clicks on header buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }

    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };

    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !overlayRef.current) return;

    const overlayWidth = overlayRef.current.offsetWidth;
    const overlayHeight = overlayRef.current.offsetHeight;

    const rawX = e.clientX - dragOffsetRef.current.offsetX;
    const rawY = e.clientY - dragOffsetRef.current.offsetY;

    const clampedX = Math.max(8, Math.min(window.innerWidth - overlayWidth - 8, rawX));
    const clampedY = Math.max(8, Math.min(window.innerHeight - overlayHeight - 8, rawY));

    setPosition({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Sync isPlaying with video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Video playback autoplay blocked or failed:", err);
        });
      }
    } else {
      video.pause();
    }
  }, [isPlaying, videoUrl]);

  // Sync playback speed
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.playbackRate = Math.min(16, playbackSpeed);
    } catch (e) {
      console.warn("Could not set video playback rate:", e);
    }
  }, [playbackSpeed]);

  // Sync muted state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted || videoAudioMuted || playbackSpeed >= 5;
  }, [isMuted, videoAudioMuted, playbackSpeed]);

  // Sync currentTime with tolerance threshold
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const diff = Math.abs(video.currentTime - currentTime);
    if (diff > 0.35) {
      try {
        video.currentTime = currentTime;
      } catch (e) {
        console.warn("Error seeking video:", e);
      }
    }
  }, [currentTime, videoUrl]);

  const toggleVideoAudio = useCallback(() => {
    setVideoAudioMuted((prev) => !prev);
  }, []);

  return (
    <div
      ref={overlayRef}
      className={`${styles.videoOverlay} ${isDragging ? styles.isDragging : ""}`}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
            }
          : {
              right: "24px",
              bottom: "96px",
            }
      }
      role="region"
      aria-label="Registrazione video webcam replay sincronizzata"
    >
      {/* Draggable Header */}
      <div
        className={styles.header}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Trascina per spostare il video nello schermo"
      >
        <div className={styles.titleArea}>
          <span className={styles.liveDot} />
          <VideoIcon size={14} />
          <span>Camera Replay</span>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={onClose}
            title="Nascondi video (V)"
            aria-label="Nascondi video"
          >
            <CloseIcon size={15} />
          </button>
        </div>
      </div>

      {/* Video Content */}
      <div className={styles.videoContainer}>
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              preload="auto"
              className={styles.videoElement}
            />
            <div className={styles.overlayControls}>
              <button
                type="button"
                className={styles.headerBtn}
                onClick={toggleVideoAudio}
                title={
                  videoAudioMuted
                    ? "Attiva audio della webcam"
                    : "Silenzia audio della webcam"
                }
              >
                {videoAudioMuted ? (
                  <VolumeMuteIcon size={14} />
                ) : (
                  <VolumeHighIcon size={14} />
                )}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noFilePrompt}>
            <VideoIcon size={24} style={{ color: "var(--color-brand-cyan, #06b6d4)" }} />
            <div className={styles.promptTitle}>Video della sessione</div>
            {fileName && <div className={styles.promptFileName}>{fileName}</div>}
            {onLinkVideoFile && (
              <button
                type="button"
                className={styles.linkBtn}
                onClick={onLinkVideoFile}
                title="Seleziona il file video salvato su disco"
              >
                <UploadIcon size={14} />
                <span>Collega file video</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
