import { useState, useEffect, useCallback } from "react";

export interface FullscreenResult {
  isFullscreen: boolean;
  requestFullscreen: (element?: HTMLElement | null) => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: (element?: HTMLElement | null) => Promise<void>;
}

export function useFullscreen(): FullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    typeof document !== "undefined" && !!document.fullscreenElement
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const requestFullscreen = useCallback(async (element?: HTMLElement | null) => {
    try {
      const target = element ?? document.documentElement;
      if (target && !document.fullscreenElement && target.requestFullscreen) {
        await target.requestFullscreen();
      }
    } catch {
      // Silent degradation when denied or unsupported
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Silent degradation
    }
  }, []);

  const toggleFullscreen = useCallback(
    async (element?: HTMLElement | null) => {
      if (document.fullscreenElement) {
        await exitFullscreen();
      } else {
        await requestFullscreen(element);
      }
    },
    [exitFullscreen, requestFullscreen]
  );

  return {
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
