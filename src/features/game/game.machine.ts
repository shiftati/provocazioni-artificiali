import { APP_CONFIG } from "../../config/app.config";
import type { GameState } from "../../types";

export type GameAction =
  | { type: "PLAY"; allProvocationIds: string[] }
  | { type: "CHALLENGE_TIMEOUT"; allProvocationIds: string[] }
  | { type: "ACCEPT_PROVOCATION"; allProvocationIds: string[] }
  | { type: "SKIP_PROVOCATION"; allProvocationIds: string[] }
  | { type: "TOGGLE_PAUSE_DISCUSSION" }
  | { type: "NEXT_PROVOCATION" }
  | { type: "RESET_GAME" };

export function getAvailableProvocations(
  allIds: string[],
  used: string[],
  skipped: string[]
): string[] {
  const excluded = new Set([...used, ...skipped]);
  return allIds.filter((id) => !excluded.has(id));
}

export function getFirstUnusedProvocation(
  allIds: string[],
  used: string[],
  skipped: string[]
): string | null {
  const available = getAvailableProvocations(allIds, used, skipped);
  return available[0] ?? null;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLAY": {
      if (state.step !== "IDLE") return state;

      // FIRST LOOP EXCEPTION:
      // On the first loop, CHALLENGE is skipped and we transition directly to PROVOCATION (Step 2A).
      if (state.isFirstLoop) {
        const nextId = getFirstUnusedProvocation(
          action.allProvocationIds,
          state.usedProvocationIds,
          state.skippedProvocationIds
        );
        return {
          ...state,
          step: "PROVOCATION",
          timerDeadline: null,
          isTimerPaused: false,
          remainingWhenPaused: null,
          currentProvocationId: nextId,
          isFirstLoop: false,
        };
      }

      // Subsequent loops: enter CHALLENGE with 30s timer
      const challengeDeadline = Date.now() + APP_CONFIG.GAME_CHALLENGE_SECONDS * 1000;
      return {
        ...state,
        step: "CHALLENGE",
        timerDeadline: challengeDeadline,
        isTimerPaused: false,
        remainingWhenPaused: null,
      };
    }

    case "CHALLENGE_TIMEOUT": {
      if (state.step !== "CHALLENGE") return state;

      const nextId = getFirstUnusedProvocation(
        action.allProvocationIds,
        state.usedProvocationIds,
        state.skippedProvocationIds
      );

      return {
        ...state,
        step: "PROVOCATION",
        timerDeadline: null,
        isTimerPaused: false,
        remainingWhenPaused: null,
        currentProvocationId: nextId,
      };
    }

    case "ACCEPT_PROVOCATION": {
      if (state.step !== "CHALLENGE" && state.step !== "PROVOCATION") return state;

      let acceptedId = state.currentProvocationId;

      // If accepted from CHALLENGE without a pre-selected provocation, pick the first unused
      if (!acceptedId) {
        acceptedId = getFirstUnusedProvocation(
          action.allProvocationIds,
          state.usedProvocationIds,
          state.skippedProvocationIds
        );
      }

      const nextUsed = acceptedId
        ? Array.from(new Set([...state.usedProvocationIds, acceptedId]))
        : state.usedProvocationIds;

      const discussionDeadline = Date.now() + APP_CONFIG.GAME_DISCUSSION_SECONDS * 1000;

      return {
        ...state,
        step: "DISCUSSION",
        timerDeadline: discussionDeadline,
        isTimerPaused: false,
        remainingWhenPaused: null,
        currentProvocationId: acceptedId,
        usedProvocationIds: nextUsed,
        discussedCount: state.discussedCount + 1,
      };
    }

    case "SKIP_PROVOCATION": {
      if (state.step !== "PROVOCATION") return state;

      const currentId = state.currentProvocationId;
      const nextSkipped = currentId
        ? Array.from(new Set([...state.skippedProvocationIds, currentId]))
        : state.skippedProvocationIds;

      const nextId = getFirstUnusedProvocation(
        action.allProvocationIds,
        state.usedProvocationIds,
        nextSkipped
      );

      return {
        ...state,
        currentProvocationId: nextId,
        skippedProvocationIds: nextSkipped,
      };
    }

    case "TOGGLE_PAUSE_DISCUSSION": {
      if (state.step !== "DISCUSSION") return state;

      if (!state.isTimerPaused) {
        // Pausing: calculate remaining seconds and store
        const remaining = state.timerDeadline
          ? Math.max(0, Math.ceil((state.timerDeadline - Date.now()) / 1000))
          : 0;
        return {
          ...state,
          isTimerPaused: true,
          remainingWhenPaused: remaining,
        };
      } else {
        // Resuming: set new deadline based on saved remaining seconds
        const remaining = state.remainingWhenPaused ?? 0;
        const newDeadline = Date.now() + remaining * 1000;
        return {
          ...state,
          isTimerPaused: false,
          remainingWhenPaused: null,
          timerDeadline: newDeadline,
        };
      }
    }

    case "NEXT_PROVOCATION": {
      if (state.step !== "DISCUSSION") return state;

      return {
        ...state,
        step: "IDLE",
        timerDeadline: null,
        isTimerPaused: false,
        remainingWhenPaused: null,
        currentProvocationId: null,
      };
    }

    case "RESET_GAME": {
      return {
        step: "IDLE",
        timerDeadline: null,
        isTimerPaused: false,
        remainingWhenPaused: null,
        currentProvocationId: null,
        usedProvocationIds: [],
        skippedProvocationIds: [],
        discussedCount: 0,
        isFirstLoop: true,
      };
    }

    default:
      return state;
  }
}
