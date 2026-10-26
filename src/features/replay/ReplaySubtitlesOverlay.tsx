import {
  useState,
  useRef,
  useEffect,
  type FC,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { formatDurationSeconds } from "../../utils/time";
import { CloseIcon, RefreshIcon } from "../../components/icons";
import styles from "./ReplaySubtitlesOverlay.module.scss";

export interface SubtitleChunk {
  timestamp: [number, number | null];
  text: string;
}

export interface ReplaySubtitlesOverlayProps {
  chunk: SubtitleChunk | null;
  onClose?: () => void;
}

const STORAGE_KEY = "rasbora_replay_subtitles_position";

const GripIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

export const ReplaySubtitlesOverlay: FC<ReplaySubtitlesOverlayProps> = ({
  chunk,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastChunkRef = useRef<SubtitleChunk | null>(chunk);

  if (chunk) {
    lastChunkRef.current = chunk;
  }

  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({
    offsetX: 0,
    offsetY: 0,
  });

  // Calculate default position or load from localStorage
  useEffect(() => {
    let initialX = Math.round(window.innerWidth / 2);
    let initialY = Math.max(40, window.innerHeight - 100);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed?.x === "number" &&
          typeof parsed?.y === "number" &&
          !isNaN(parsed.x) &&
          !isNaN(parsed.y)
        ) {
          initialX = Math.min(Math.max(60, parsed.x), window.innerWidth - 60);
          initialY = Math.min(Math.max(30, parsed.y), window.innerHeight - 30);
        }
      }
    } catch {
      // ignore
    }

    setPosition({ x: initialX, y: initialY });

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const currentW = overlayRef.current?.offsetWidth || 300;
        const currentH = overlayRef.current?.offsetHeight || 44;
        const halfW = currentW / 2;
        const halfH = currentH / 2;
        const clampedX = Math.min(Math.max(halfW + 12, prev.x), window.innerWidth - halfW - 12);
        const clampedY = Math.min(Math.max(halfH + 12, prev.y), window.innerHeight - halfH - 12);
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When text changes, adjust position if it now exceeds boundaries
  useEffect(() => {
    if (!position || !overlayRef.current) return;
    const currentW = overlayRef.current.offsetWidth;
    const currentH = overlayRef.current.offsetHeight;
    const halfW = currentW / 2;
    const halfH = currentH / 2;

    const clampedX = Math.min(Math.max(halfW + 12, position.x), window.innerWidth - halfW - 12);
    const clampedY = Math.min(Math.max(halfH + 12, position.y), window.innerHeight - halfH - 12);

    if (clampedX !== position.x || clampedY !== position.y) {
      setPosition({ x: clampedX, y: clampedY });
    }
  }, [chunk?.text, position]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }

    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const currentCenterX = rect.left + rect.width / 2;
    const currentCenterY = rect.top + rect.height / 2;

    dragOffsetRef.current = {
      offsetX: e.clientX - currentCenterX,
      offsetY: e.clientY - currentCenterY,
    };

    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !overlayRef.current) return;

    const rawX = e.clientX - dragOffsetRef.current.offsetX;
    const rawY = e.clientY - dragOffsetRef.current.offsetY;

    const currentW = overlayRef.current.offsetWidth;
    const currentH = overlayRef.current.offsetHeight;
    const halfW = currentW / 2;
    const halfH = currentH / 2;

    const clampedX = Math.max(halfW + 12, Math.min(window.innerWidth - halfW - 12, rawX));
    const clampedY = Math.max(halfH + 12, Math.min(window.innerHeight - halfH - 12, rawY));

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

      if (position) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        } catch {
          // ignore
        }
      }
    }
  };

  const handleResetPosition = (e: ReactMouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    const defaultX = Math.round(window.innerWidth / 2);
    const defaultY = Math.max(40, window.innerHeight - 100);
    setPosition({ x: defaultX, y: defaultY });
  };

  const displayedChunk = chunk || (isDragging ? lastChunkRef.current : null);
  const isShown = Boolean(displayedChunk);

  return (
    <div
      ref={overlayRef}
      className={`${styles.subtitlesOverlay} ${!isShown ? styles.hidden : ""} ${
        isDragging ? styles.isDragging : ""
      }`}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: "translate(-50%, -50%)",
            }
          : {
              left: "50%",
              bottom: "100px",
              transform: "translate(-50%, 0)",
            }
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      title="Trascina per spostare i sottotitoli nello schermo"
      role="region"
      aria-label="Sottotitoli sincronizzati replay"
    >
      {displayedChunk && (
        <div className={styles.captionPill}>
          <span className={styles.dragHandle} title="Trascina per spostare">
            <GripIcon />
          </span>

          <span className={styles.captionTime}>
            {formatDurationSeconds(displayedChunk.timestamp[0])}
          </span>

          <span className={styles.captionText}>{displayedChunk.text}</span>

          <div className={styles.actionsGroup}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleResetPosition}
              onPointerDown={(e) => e.stopPropagation()}
              title="Ripristina posizione in basso al centro"
              aria-label="Ripristina posizione sottotitoli"
            >
              <RefreshIcon size={12} />
            </button>

            {onClose && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Nascondi sottotitoli (C)"
                aria-label="Nascondi sottotitoli"
              >
                <CloseIcon size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
