import { useEffect, useRef } from "react";
import type { SlideDefinition } from "../../../types";
import { resolveAssetUrl, getCachedBlobUrl } from "../../../utils/precacheAllAssets";

/**
 * Precarica e decodifica in anticipo le immagini delle slide adiacenti (corrente, successiva,
 * successiva ancora e precedente) direttamente nella memoria GPU/bitmap del browser.
 * In questo modo, quando l'utente naviga sulla slide successiva, l'immagine è già pronta e decodificata al 100%.
 */
export function useSlideImagePreload(
  currentIndex: number,
  slides: readonly SlideDefinition[]
): void {
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!slides || slides.length === 0) return;

    // Seleziona gli indici delle slide da precaricare:
    // Corrente (0), Prossima (+1), Quella dopo (+2) e Precedente (-1)
    const indicesToPreload = [
      currentIndex,
      currentIndex + 1,
      currentIndex + 2,
      currentIndex - 1,
    ].filter((idx) => idx >= 0 && idx < slides.length);

    indicesToPreload.forEach((idx) => {
      const slide = slides[idx];
      if (!slide?.assets) return;

      slide.assets.forEach((assetPath) => {
        const resolvedUrl = resolveAssetUrl(assetPath);
        const cachedBlob = getCachedBlobUrl(resolvedUrl);
        const effectiveUrl = cachedBlob || resolvedUrl;

        if (preloadedUrlsRef.current.has(effectiveUrl)) {
          return;
        }

        preloadedUrlsRef.current.add(effectiveUrl);

        const img = new Image();
        img.src = effectiveUrl;
        if (typeof img.decode === "function") {
          img.decode().catch(() => {
            // Se fallisce il decode sincrono/asincrono, il browser la caricherà normalmente
          });
        }
      });
    });
  }, [currentIndex, slides]);
}
