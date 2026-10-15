import { useState, useEffect } from "react";
import { getCachedBlobUrl, setCachedBlobUrl } from "../utils/precacheAllAssets";

/**
 * Returns an offline-ready URL for an asset.
 * If the asset is stored in CacheStorage or in-memory Blob URL, it returns
 * the local blob: URL so the asset renders instantly with 0ms network latency
 * and never fails with 404 when offline.
 */
export function useCachedAsset(originalUrl: string): string {
  const [src, setSrc] = useState<string>(() => {
    return getCachedBlobUrl(originalUrl) || originalUrl;
  });

  useEffect(() => {
    let active = true;

    // Check if in-memory blob URL is already available
    const existingBlob = getCachedBlobUrl(originalUrl);
    if (existingBlob) {
      setSrc(existingBlob);
      return;
    }

    // Otherwise check CacheStorage
    async function loadFromCache() {
      if (typeof window === "undefined" || !("caches" in window)) return;

      try {
        const cleanPath = originalUrl.replace(window.location.origin, "");
        const match =
          (await caches.match(originalUrl)) ||
          (await caches.match(cleanPath));

        if (match && active) {
          const blob = await match.blob();
          if (blob && blob.size > 0 && active) {
            const blobUrl = URL.createObjectURL(blob);
            setCachedBlobUrl(originalUrl, blobUrl);
            setSrc(blobUrl);
          }
        }
      } catch {
        // Fall back to originalUrl
      }
    }

    loadFromCache();

    return () => {
      active = false;
    };
  }, [originalUrl]);

  return src;
}
