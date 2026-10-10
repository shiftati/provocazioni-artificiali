import type { ComponentType } from "react";

export type AppMode = "presentation" | "game";
export type AppTheme = "dark" | "light";

export interface TalkConfig {
  endTime: string;        // e.g. "16:30"
  endTimestamp: number;   // epoch millis
  createdAt: number;
  theme?: AppTheme;
}

export interface AppSessionState {
  currentSlideIndex: number;
  mode: AppMode;
  stopCallsShown: boolean;
  startedAt: number | null;
}

export type GameStep = "IDLE" | "CHALLENGE" | "PROVOCATION" | "DISCUSSION";

export interface DiscussionRecord {
  provocationId: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
}

export interface GameState {
  step: GameStep;
  timerDeadline: number | null;
  isTimerPaused: boolean;
  remainingWhenPaused: number | null;
  currentProvocationId: string | null;
  usedProvocationIds: string[];
  skippedProvocationIds: string[];
  discussedCount: number;
  isFirstLoop: boolean;
}

export interface AppStats {
  talkStartedAt: number | null;
  discussions: DiscussionRecord[];
  skippedCount: number;
}

export interface SlideDefinition {
  id: string;
  title: string;
  component: ComponentType;
}

export interface ProvocationDefinition {
  id: string;
  title: string;
  subtitle?: string;
  component: ComponentType;
}
