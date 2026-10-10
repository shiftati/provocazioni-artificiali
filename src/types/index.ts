import type { ComponentType } from "react";

export type AppMode = "presentation" | "game";
export type AppTheme = "dark" | "light";

export interface TalkConfig {
  endTime: string;        // e.g. "16:30"
  endTimestamp: number;   // epoch millis
  createdAt: number;
  theme?: AppTheme;
  conclusionMinutes?: number; // minuti dedicati alla conclusione
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

export interface SlideStat {
  slideIndex: number;
  slideId: string;
  slideTitle: string;
  durationSeconds: number; // cumulative duration in seconds
  visits: number;
}

export interface ProvocationStat {
  id: string; // unique record id
  provocationId: string;
  provocationTitle: string;
  provocationSubtitle?: string;
  acceptanceTimeSeconds: number; // e.g. 16, 25, 32
  discussionDurationSeconds: number; // actual time spent in discussion (up to 300s)
  completedAt: number; // epoch ms
  wasSkippedFirst?: boolean;
}

export interface TalkSessionRecord {
  id: string;
  name: string;
  createdAt: number;
  startedAt: number;
  endedAt: number | null;
  totalDurationSeconds: number;
  plannedEndTime: string;
  plannedEndTimestamp: number;
  slides: SlideStat[];
  provocations: ProvocationStat[];
  provocationsCount: number;
  notes?: string;
  conclusionMinutes?: number;
}
