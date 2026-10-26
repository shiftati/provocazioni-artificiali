import { useRef, useCallback, useEffect, useState } from "react";
import {
  useSpeakerChannel,
  saveCachedSpeakerState,
  type SpeakerMessagePayload,
  type SpeakerMessage,
} from "./useSpeakerChannel";
import { SLIDES } from "../presentation/slides.registry";
import { PROVOCATION_MAP } from "../game/provocations.registry";
import type { AppSessionState, GameState } from "../../types";

export interface UseSpeakerWindowOptions {
  onUiNext?: () => void;
  onUiPrev?: () => void;
  onKeyNext?: () => void;
  onKeyPrev?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSetMode?: (mode: "presentation" | "game") => void;
  disableNavHandling?: boolean;
  isSessionActive?: boolean;
}

interface WindowBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

function calculateSpeakerWindowBounds(screenDetails: any): WindowBounds {
  const defaultWidth = 850;
  const defaultHeight = 650;

  // 1. Check Window Management API (window.getScreenDetails())
  if (screenDetails && screenDetails.screens && screenDetails.screens.length > 1) {
    const currentScreen = screenDetails.currentScreen;

    // Filter out the screen where the presentation is currently running
    const otherScreens = screenDetails.screens.filter((s: any) => {
      if (s === currentScreen) return false;
      if (
        typeof currentScreen?.availLeft === "number" &&
        typeof s?.availLeft === "number" &&
        s.availLeft === currentScreen.availLeft &&
        s.availTop === currentScreen.availTop
      ) {
        return false;
      }
      if (s.id && currentScreen?.id && s.id === currentScreen.id) {
        return false;
      }
      return true;
    });

    if (otherScreens.length > 0) {
      // Pick the non-active screen.
      // If currentScreen is external (not primary), prefer primary display (laptop) for speaker notes.
      // If currentScreen is primary, prefer external display.
      let targetScreen = otherScreens[0];
      if (otherScreens.length > 1) {
        if (!currentScreen?.isPrimary) {
          const primaryOther = otherScreens.find((s: any) => s.isPrimary);
          if (primaryOther) targetScreen = primaryOther;
        } else {
          const secondaryOther = otherScreens.find((s: any) => !s.isPrimary);
          if (secondaryOther) targetScreen = secondaryOther;
        }
      }

      const screenLeft = targetScreen.availLeft ?? targetScreen.left ?? 0;
      const screenTop = targetScreen.availTop ?? targetScreen.top ?? 0;
      const screenW = targetScreen.availWidth ?? targetScreen.width ?? 1280;
      const screenH = targetScreen.availHeight ?? targetScreen.height ?? 800;

      const width = Math.min(880, Math.max(650, screenW - 60));
      const height = Math.min(700, Math.max(480, screenH - 80));
      const left = Math.round(screenLeft + Math.max(0, (screenW - width) / 2));
      const top = Math.round(screenTop + 40);

      return { left, top, width, height };
    }
  }

  // 2. Fallback heuristic: check if Chromium reports extended displays via window.screen.isExtended
  const isExtended = Boolean(
    typeof window !== "undefined" &&
      (window.screen as any)?.isExtended &&
      window.screen.availWidth
  );
  if (isExtended) {
    const currentX = window.screenX ?? window.screenLeft ?? 0;
    // If the presentation is on the first screen (left), position popup on the extended screen (right)
    if (currentX >= 0 && currentX < window.screen.availWidth) {
      return {
        left: Math.round(window.screen.availWidth + 40),
        top: 60,
        width: defaultWidth,
        height: defaultHeight,
      };
    } else {
      // Presentation is on the extended right screen, position popup on left screen
      return {
        left: 40,
        top: 60,
        width: defaultWidth,
        height: defaultHeight,
      };
    }
  }

  // 3. Single display fallback: place on the right side of the current screen
  const width = defaultWidth;
  const height = defaultHeight;
  const left = Math.max(0, Math.round(window.screen.availWidth - width - 40));
  const top = 60;
  return { left, top, width, height };
}

export function useSpeakerWindow(
  session: AppSessionState,
  game: GameState,
  options?: UseSpeakerWindowOptions
) {
  const windowRef = useRef<Window | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const optionsRef = useRef(options);
  const screenDetailsRef = useRef<any>(null);

  // Pre-load screen details if permission is already granted, and listen for screen changes
  useEffect(() => {
    if (typeof window === "undefined" || !("getScreenDetails" in window)) return;

    let isMounted = true;
    const checkPermissionAndInit = async () => {
      try {
        if ("permissions" in navigator && navigator.permissions.query) {
          const perm = await navigator.permissions
            .query({ name: "window-management" as any })
            .catch(() =>
              navigator.permissions.query({ name: "window-placement" as any })
            )
            .catch(() => null);

          if (perm && perm.state === "granted") {
            const details = await (window as any).getScreenDetails();
            if (isMounted) {
              screenDetailsRef.current = details;
              details.addEventListener("screenschange", () => {
                screenDetailsRef.current = details;
              });
              details.addEventListener("currentscreenchange", () => {
                screenDetailsRef.current = details;
              });
            }
          }
        }
      } catch {
        // Ignore permission check failures
      }
    };

    checkPermissionAndInit();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const getCurrentPayload = useCallback((): SpeakerMessagePayload => {
    const totalSlides = SLIDES.length;
    const currentIdx = Math.min(Math.max(0, session.currentSlideIndex), totalSlides - 1);
    const slide = SLIDES[currentIdx];
    const provocation = game.currentProvocationId
      ? PROVOCATION_MAP.get(game.currentProvocationId) ?? null
      : null;

    const isSessionActive =
      optionsRef.current?.isSessionActive ??
      Boolean(session.startedAt !== null && !session.endedAt);

    return {
      mode: session.mode,
      slideIndex: currentIdx,
      slideId: slide?.id ?? "",
      slideTitle: slide?.title ?? `Slide ${currentIdx + 1}`,
      totalSlides,
      gameStep: game.step,
      provocationId: game.currentProvocationId,
      provocationTitle: provocation?.title ?? null,
      provocationSubtitle: provocation?.subtitle ?? null,
      isSessionActive,
      timestamp: Date.now(),
    };
  }, [session.currentSlideIndex, session.mode, session.startedAt, session.endedAt, game.step, game.currentProvocationId]);

  // Handle messages received from the speaker window
  const handleMessage = useCallback(
    (msg: SpeakerMessage) => {
      if (msg.type === "REQUEST_SYNC") {
        const payload = getCurrentPayload();
        send({
          type: "STATE_UPDATE",
          payload,
        });
      } else if (msg.type === "NAV_NEXT") {
        if (optionsRef.current?.disableNavHandling) return;
        if (msg.source === "ui") {
          if (optionsRef.current?.onUiNext) {
            optionsRef.current.onUiNext();
          } else if (optionsRef.current?.onNext) {
            optionsRef.current.onNext();
          }
        } else {
          if (optionsRef.current?.onKeyNext) {
            optionsRef.current.onKeyNext();
          } else {
            window.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "ArrowRight",
                code: "ArrowRight",
                bubbles: true,
                cancelable: true,
              })
            );
          }
        }
      } else if (msg.type === "NAV_PREV") {
        if (optionsRef.current?.disableNavHandling) return;
        if (msg.source === "ui") {
          if (optionsRef.current?.onUiPrev) {
            optionsRef.current.onUiPrev();
          } else if (optionsRef.current?.onPrev) {
            optionsRef.current.onPrev();
          }
        } else {
          if (optionsRef.current?.onKeyPrev) {
            optionsRef.current.onKeyPrev();
          } else {
            window.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "ArrowLeft",
                code: "ArrowLeft",
                bubbles: true,
                cancelable: true,
              })
            );
          }
        }
      } else if (msg.type === "SET_MODE") {
        if (optionsRef.current?.disableNavHandling) return;
        optionsRef.current?.onSetMode?.(msg.mode);
      }
    },
    [getCurrentPayload]
  );

  const { send } = useSpeakerChannel(handleMessage);

  // Keep checking if the popup window is still open
  useEffect(() => {
    const interval = setInterval(() => {
      const open = Boolean(windowRef.current && !windowRef.current.closed);
      setIsWindowOpen(open);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Broadcast state whenever slide, mode or game changes & update cache
  useEffect(() => {
    const payload = getCurrentPayload();
    saveCachedSpeakerState(payload);

    send({
      type: "STATE_UPDATE",
      payload,
    });
  }, [
    session.currentSlideIndex,
    session.mode,
    session.startedAt,
    session.endedAt,
    game.step,
    game.currentProvocationId,
    options?.isSessionActive,
    getCurrentPayload,
    send,
  ]);

  const openSpeakerWindow = useCallback(async () => {
    // If we have getScreenDetails API available, ensure we have the screen details
    let screenDetails = screenDetailsRef.current;
    if (!screenDetails && typeof window !== "undefined" && "getScreenDetails" in window) {
      try {
        screenDetails = await (window as any).getScreenDetails();
        screenDetailsRef.current = screenDetails;
        screenDetails.addEventListener("screenschange", () => {
          screenDetailsRef.current = screenDetails;
        });
        screenDetails.addEventListener("currentscreenchange", () => {
          screenDetailsRef.current = screenDetails;
        });
      } catch (err) {
        console.warn("Screen Details permission denied or unavailable:", err);
      }
    }

    const { left, top, width, height } = calculateSpeakerWindowBounds(screenDetails);

    // If already open, reposition if needed and bring to focus
    if (windowRef.current && !windowRef.current.closed) {
      try {
        windowRef.current.moveTo(left, top);
        windowRef.current.resizeTo(width, height);
      } catch {
        // ignore
      }
      windowRef.current.focus();
      return;
    }

    const payload = getCurrentPayload();
    saveCachedSpeakerState(payload);

    // Build URL pointing to hash route /speaker
    const baseUrl = window.location.href.split("#")[0]?.replace(/\/$/, "");
    const url = `${baseUrl}/#/speaker`;

    const win = window.open(
      url,
      "rasbora-speaker-window",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`
    );

    if (win) {
      windowRef.current = win;
      setIsWindowOpen(true);

      try {
        win.moveTo(left, top);
        win.resizeTo(width, height);
      } catch {
        // ignore
      }

      // Send initial payload after popup initializes
      setTimeout(() => {
        send({
          type: "STATE_UPDATE",
          payload: getCurrentPayload(),
        });
      }, 300);
    }
  }, [getCurrentPayload, send]);

  return {
    openSpeakerWindow,
    isWindowOpen,
  };
}
