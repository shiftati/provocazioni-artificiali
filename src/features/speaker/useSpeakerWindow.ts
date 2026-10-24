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
}

export function useSpeakerWindow(
  session: AppSessionState,
  game: GameState,
  options?: UseSpeakerWindowOptions
) {
  const windowRef = useRef<Window | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const optionsRef = useRef(options);

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
      timestamp: Date.now(),
    };
  }, [session.currentSlideIndex, session.mode, game.step, game.currentProvocationId]);

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
    game.step,
    game.currentProvocationId,
    getCurrentPayload,
    send,
  ]);

  const openSpeakerWindow = useCallback(() => {
    // If already open, bring to focus
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.focus();
      return;
    }

    const payload = getCurrentPayload();
    saveCachedSpeakerState(payload);

    // Build URL pointing to hash route /speaker
    const baseUrl = window.location.href.split("#")[0]?.replace(/\/$/, "");
    const url = `${baseUrl}/#/speaker`;

    // Window sizing suitable for speaker notes
    const width = 850;
    const height = 650;
    const left = Math.max(0, Math.round(window.screen.availWidth - width - 40));
    const top = 60;

    const win = window.open(
      url,
      "rasbora-speaker-window",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`
    );

    if (win) {
      windowRef.current = win;
      setIsWindowOpen(true);

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
