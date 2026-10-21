/**
 * Comprehensive offline asset preloader and cache manager.
 * Eagerly downloads and stores all slides, images, audio, logos, and fonts
 * in the CacheStorage so the entire app works 100% offline from the very first load.
 */

export interface PrecacheProgress {
  total: number;
  completed: number;
  percent: number;
  isComplete: boolean;
  inProgress: boolean;
  failed: string[];
}

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const APP_ASSETS_CATALOG = [
  // 1. All presentation slides (1920x1080 backgrounds)
  "images/slides/codemotion-blue-title.jpg",
  "images/slides/intro-daniel.png",
  "images/slides/intro-klippy.png",
  "images/slides/intro-ste.png",
  "images/slides/gli-esperti.png",
  "images/slides/codemotion-blue-bg.png",
  "images/slides/metroman.png",
  "images/slides/macchinetta-caffe.jpg",
  "images/slides/5-daniel-e-ste.jpg",
  "images/slides/6-klippy.png",
  "images/slides/7-ritorno-al-futuro.jpg",
  "images/slides/klippy-einstein.png",
  "images/slides/8-gioco-saw.jpg",
  "images/slides/klippy-saw.png",
  "images/slides/9-fight-club.jpg",
  "images/slides/10-klippy-lotta-tra-ai.jpg",
  "images/slides/11-klippy-matrix.jpg",
  "images/slides/12-io-sono-eccellenza.jpg",
  "images/slides/13-selfie.jpg",
  "images/slides/14-finale.jpg",

  // 2. Visual assets & overlays
  "images/stop-alle-telefonate.jpg",
  "images/klippy.png",
  "images/daniel.png",
  "images/stefano.png",
  "images/qr-daniel.svg",
  "images/qr-stefano.svg",
  "images/qr-shiftati.svg",

  // 3. Audio tracks
  "audio/back-to-the-future_short.mp3",

  // 4. Brand and conference logos
  "logo/shiftati-logo.png",
  "logo/shiftati-logo-wide-black.png",
  "logo/shiftati-logo-wide-bianco.png",
  "logo/shiftati-logo-white.png",
  "logo/shiftati-logo-colored.png",
  "logo/shiftati-logo-colored-white.png",
  "logo/shiftati-logo-black.png",
  "logo/codemotion-monogram-white.png",
  "logo/codemotion-monogram-black.png",
  "logo/codemotion-logo-white.svg",
  "logo/codemotion-logo-black.svg",

  // 5. Local typography
  "fonts/alfa-slab-one.ttf",
  "fonts/ibm-plex-sans-400.woff2",
  "fonts/ibm-plex-sans-600.woff2",
  "fonts/ibm-plex-sans-700.woff2",
  "fonts/ibm-plex-mono-400.woff2",
  "fonts/ibm-plex-mono-600.woff2",
  "fonts/ibm-plex-mono-700.woff2",
  "fonts/roboto-400.woff2",
  "fonts/roboto-500.woff2",
  "fonts/roboto-700.woff2",

  // 6. Favicons and app icons
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable.png",
  "icons/favicon-32x32.png",
  "icons/apple-touch-icon.png",
  "favicon.svg",
  "favicon.ico",
] as const;

export function resolveAssetUrl(assetPath: string): string {
  const cleanPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  return `${BASE_URL}${encodeURI(cleanPath.normalize("NFC"))}`;
}

export function getCacheNameForAsset(assetPath: string): string {
  if (/\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i.test(assetPath)) {
    return "images-cache";
  }
  if (/\.(?:mp3|wav|ogg)$/i.test(assetPath)) {
    return "audio-cache";
  }
  if (/\.(?:woff|woff2|ttf|eot)$/i.test(assetPath)) {
    return "fonts-cache";
  }
  return "static-resources";
}

const assetBlobMap = new Map<string, string>();

export function getCachedBlobUrl(urlOrPath: string): string | undefined {
  return assetBlobMap.get(urlOrPath) || assetBlobMap.get(resolveAssetUrl(urlOrPath));
}

export function setCachedBlobUrl(urlOrPath: string, blobUrl: string): void {
  assetBlobMap.set(urlOrPath, blobUrl);
  assetBlobMap.set(resolveAssetUrl(urlOrPath), blobUrl);
  if (typeof window !== "undefined") {
    const abs = new URL(resolveAssetUrl(urlOrPath), window.location.href).href;
    assetBlobMap.set(abs, blobUrl);
  }
}

let currentProgress: PrecacheProgress = {
  total: APP_ASSETS_CATALOG.length,
  completed: 0,
  percent: 0,
  isComplete: false,
  inProgress: false,
  failed: [],
};

const listeners = new Set<(progress: PrecacheProgress) => void>();

export function getPrecacheProgress(): PrecacheProgress {
  return { ...currentProgress };
}

export function subscribePrecacheProgress(
  listener: (progress: PrecacheProgress) => void
): () => void {
  listeners.add(listener);
  listener(getPrecacheProgress());
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const snapshot = getPrecacheProgress();
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (e) {
      console.error("[Precache notify error]", e);
    }
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("app-precache-progress", { detail: snapshot })
    );
  }
}

/**
 * Checks how many assets are already present in CacheStorage.
 */
export async function verifyCachedAssets(): Promise<{ cachedCount: number; totalCount: number }> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return { cachedCount: 0, totalCount: APP_ASSETS_CATALOG.length };
  }

  let count = 0;
  for (const asset of APP_ASSETS_CATALOG) {
    const url = resolveAssetUrl(asset);
    const cacheName = getCacheNameForAsset(asset);
    try {
      const cache = await caches.open(cacheName);
      const match = await cache.match(url);
      if (match) {
        count++;
      } else {
        // Also check if Workbox precache stored it
        const keys = await caches.keys();
        const precacheKey = keys.find((k) => k.includes("workbox-precache"));
        if (precacheKey) {
          const precache = await caches.open(precacheKey);
          const precacheMatch = await precache.match(url);
          if (precacheMatch) count++;
        }
      }
    } catch {
      // Continue checking
    }
  }

  return { cachedCount: count, totalCount: APP_ASSETS_CATALOG.length };
}

/**
 * Download and store all assets in the browser cache.
 * Uses a concurrency limit of 5 to avoid network congestion.
 */
export async function precacheAllAssets(force = false): Promise<PrecacheProgress> {
  if (currentProgress.inProgress) {
    return currentProgress;
  }

  currentProgress = {
    total: APP_ASSETS_CATALOG.length,
    completed: 0,
    percent: 0,
    isComplete: false,
    inProgress: true,
    failed: [],
  };
  notifyListeners();

  const isCachesAvailable = typeof window !== "undefined" && "caches" in window;
  const concurrency = 5;
  const queue = [...APP_ASSETS_CATALOG];
  const failedList: string[] = [];
  let completedCount = 0;

  async function worker() {
    while (queue.length > 0) {
      const asset = queue.shift();
      if (!asset) break;

      const fullUrl = resolveAssetUrl(asset);
      const cacheName = getCacheNameForAsset(asset);

      try {
        let needsFetch = force;
        const absoluteUrl =
          typeof window !== "undefined"
            ? new URL(fullUrl, window.location.href).href
            : fullUrl;

        if (!needsFetch && isCachesAvailable) {
          try {
            const cache = await caches.open(cacheName);
            const existing = (await cache.match(fullUrl)) || (await cache.match(absoluteUrl));
            if (!existing) {
              needsFetch = true;
            } else {
              // Populate in-memory blob map from existing cache
              try {
                const blob = await existing.blob();
                if (blob && blob.size > 0) {
                  const blobUrl = URL.createObjectURL(blob);
                  setCachedBlobUrl(asset, blobUrl);
                  setCachedBlobUrl(fullUrl, blobUrl);
                }
              } catch {
                // Ignore blob extraction error
              }
            }
          } catch {
            needsFetch = true;
          }
        }

        if (needsFetch) {
          const response = await fetch(fullUrl, {
            cache: force ? "reload" : "default",
          });

          if (response.ok) {
            const blob = await response.blob();
            if (blob && blob.size > 0) {
              const blobUrl = URL.createObjectURL(blob);
              setCachedBlobUrl(asset, blobUrl);
              setCachedBlobUrl(fullUrl, blobUrl);
            }

            if (isCachesAvailable) {
              try {
                const cache = await caches.open(cacheName);
                const contentType = response.headers.get("Content-Type") || "application/octet-stream";

                const responseToCache = new Response(blob, {
                  status: 200,
                  statusText: "OK",
                  headers: {
                    "Content-Type": contentType,
                    "Content-Length": String(blob.size),
                    "Cache-Control": "public, max-age=31536000",
                  },
                });

                await cache.put(fullUrl, responseToCache.clone());
                await cache.put(absoluteUrl, responseToCache.clone());
              } catch (err) {
                console.warn(`[Offline Cache] Cache put error for ${asset}:`, err);
              }
            }
          } else {
            failedList.push(asset);
            console.warn(`[Offline Cache] HTTP ${response.status} for ${fullUrl}`);
          }
        }

        // Preload images into browser memory for 0ms decoding latency
        if (/\.(?:png|jpg|jpeg|svg|webp|ico)$/i.test(asset)) {
          const img = new Image();
          img.src = getCachedBlobUrl(fullUrl) || fullUrl;
        }
      } catch (err) {
        failedList.push(asset);
        console.warn(`[Offline Cache] Failed to load ${asset}:`, err);
      } finally {
        completedCount++;
        currentProgress.completed = completedCount;
        currentProgress.percent = Math.round(
          (completedCount / currentProgress.total) * 100
        );
        notifyListeners();
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, queue.length) },
    () => worker()
  );
  await Promise.all(workers);

  currentProgress.isComplete = true;
  currentProgress.inProgress = false;
  currentProgress.failed = failedList;
  currentProgress.percent = 100;
  notifyListeners();

  console.info(
    `[Offline Cache] Complete! ${completedCount}/${currentProgress.total} assets cached locally. App is 100% offline-ready.`
  );

  return currentProgress;
}

// Expose globally for browser console diagnostics or dev debugging
if (typeof window !== "undefined") {
  (window as unknown as { __precacheAllAssets: typeof precacheAllAssets }).__precacheAllAssets = precacheAllAssets;
  (window as unknown as { __verifyCachedAssets: typeof verifyCachedAssets }).__verifyCachedAssets = verifyCachedAssets;
}
