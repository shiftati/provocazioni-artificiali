import { useState, useEffect, useCallback } from "react";
import {
  getPrecacheProgress,
  subscribePrecacheProgress,
  precacheAllAssets,
  verifyCachedAssets,
  type PrecacheProgress,
} from "../utils/precacheAllAssets";

export interface OfflineCacheState extends PrecacheProgress {
  recache: () => Promise<void>;
  isOnline: boolean;
}

export function useOfflineCache(): OfflineCacheState {
  const [progress, setProgress] = useState<PrecacheProgress>(getPrecacheProgress());
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const unsubscribe = subscribePrecacheProgress((next) => {
      setProgress(next);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check on mount
    verifyCachedAssets().then(({ cachedCount, totalCount }) => {
      if (cachedCount === totalCount && totalCount > 0) {
        setProgress((prev) => ({
          ...prev,
          completed: cachedCount,
          total: totalCount,
          percent: 100,
          isComplete: true,
        }));
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const recache = useCallback(async () => {
    await precacheAllAssets(true);
  }, []);

  return {
    ...progress,
    recache,
    isOnline,
  };
}
