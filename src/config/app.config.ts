export const APP_CONFIG = {
  STOP_CALLS_TARGET_SLIDE_INDEX: 3,   // Slide index to jump to after "Prosegui" (0-based: 4th slide)
  GAME_CHALLENGE_SECONDS: 30,         // Countdown for "Accetta provocazione" (Step 2)
  GAME_DISCUSSION_SECONDS: 5 * 60,    // Discussion countdown (Step 3) - 5 minutes
  STAGE_WIDTH: 1920,
  STAGE_HEIGHT: 1080,
  WARNING_THRESHOLD_SECONDS: 300,     // < 5 min triggers warning color
  DANGER_THRESHOLD_SECONDS: 60,       // < 1 min triggers danger color
} as const;
