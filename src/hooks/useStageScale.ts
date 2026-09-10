import { useState, useEffect, useRef } from "react";
import { APP_CONFIG } from "../config/app.config";

export interface StageScaleResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  width: number;
  height: number;
}

export function useStageScale(
  designWidth: number = APP_CONFIG.STAGE_WIDTH,
  designHeight: number = APP_CONFIG.STAGE_HEIGHT
): StageScaleResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = (entries?: ResizeObserverEntry[]) => {
      const rect = entries?.[0]?.contentRect ?? el.getBoundingClientRect();
      const containerW = rect.width;
      const containerH = rect.height;

      if (containerW === 0 || containerH === 0) return;

      const computedScale = Math.min(containerW / designWidth, containerH / designHeight);
      setScale(computedScale);
      el.style.setProperty("--stage-scale", String(computedScale));
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(el);

    window.addEventListener("resize", () => updateScale());

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", () => updateScale());
    };
  }, [designWidth, designHeight]);

  return {
    containerRef,
    scale,
    width: designWidth,
    height: designHeight,
  };
}
