import { useRef, useEffect, useCallback } from "react";

const CHANNEL_NAME = "rasbora-speaker";
const STORAGE_KEY = "rasbora_speaker_last_state";

export interface SpeakerMessagePayload {
  mode: "presentation" | "game";
  slideIndex: number;
  slideId: string;
  slideTitle: string;
  totalSlides: number;
  gameStep: "IDLE" | "CHALLENGE" | "PROVOCATION" | "DISCUSSION";
  provocationId: string | null;
  provocationTitle: string | null;
  provocationSubtitle?: string | null;
  timestamp: number;
}

export type SpeakerMessage =
  | {
      type: "STATE_UPDATE";
      payload: SpeakerMessagePayload;
    }
  | {
      type: "REQUEST_SYNC";
    }
  | {
      type: "NAV_NEXT";
    }
  | {
      type: "NAV_PREV";
    };

export function getCachedSpeakerState(): SpeakerMessagePayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SpeakerMessagePayload;
  } catch {
    return null;
  }
}

export function saveCachedSpeakerState(state: SpeakerMessagePayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage write errors
  }
}

export function useSpeakerChannel(onMessage?: (msg: SpeakerMessage) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      onMessageRef.current?.(event.data as SpeakerMessage);
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const send = useCallback((msg: SpeakerMessage) => {
    if (msg.type === "STATE_UPDATE") {
      saveCachedSpeakerState(msg.payload);
    }
    channelRef.current?.postMessage(msg);
  }, []);

  return { send };
}
