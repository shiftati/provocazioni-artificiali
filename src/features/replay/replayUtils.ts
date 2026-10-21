import type { TalkSessionRecord, SessionEvent } from "../../types";
import { SLIDES } from "../presentation/slides.registry";
import { PROVOCATIONS } from "../game/provocations.registry";

export interface ReplayState {
  mode: "presentation" | "game";
  slideIndex: number;
  slideStep: number;
  gameStep: "IDLE" | "CHALLENGE" | "PROVOCATION" | "DISCUSSION";
  currentProvocationId: string | null;
  challengeSecondsRemaining: number;
  discussionSecondsRemaining: number;
  isDiscussionPaused: boolean;
  stopCallsShown: boolean;
  activeEvent: SessionEvent | null;
  activeEventIndex: number;
}

/**
 * Ensures session events exist. If the session has no recorded events
 * (e.g. older legacy session), this synthesizes a realistic sequence
 * matching session.slides and session.provocations.
 */
function enrichSlideAnimationEvents(events: SessionEvent[], defaultEndTime: number): SessionEvent[] {
  const result: SessionEvent[] = [];

  for (let i = 0; i < events.length; i++) {
    const evt = events[i]!;
    result.push(evt);

    if (evt.type === "SLIDE_VIEW") {
      const slideIdx =
        typeof evt.details?.slideIndex === "number"
          ? evt.details.slideIndex
          : typeof evt.details?.slideNumber === "number"
          ? evt.details.slideNumber - 1
          : -1;

      // Slide 4 is "Daniel e Ste" (5th slide), Slide 12 is "Finale" (13th slide)
      const isMultiStepSlide = slideIdx === 4 || slideIdx === 12;
      if (!isMultiStepSlide) continue;

      let hasAnimationEvent = false;
      let nextEventTimestamp = defaultEndTime;

      for (let j = i + 1; j < events.length; j++) {
        const nextEvt = events[j]!;
        if (
          nextEvt.type === "SLIDE_VIEW" ||
          nextEvt.type === "MODE_CHANGE" ||
          nextEvt.type === "SESSION_END"
        ) {
          nextEventTimestamp = nextEvt.timestamp;
          break;
        }
        if (nextEvt.type === "SLIDE_ANIMATION") {
          const animSlideIdx =
            typeof nextEvt.details?.slideIndex === "number"
              ? nextEvt.details.slideIndex
              : typeof nextEvt.details?.slideNumber === "number"
              ? nextEvt.details.slideNumber - 1
              : -1;
          if (animSlideIdx === slideIdx) {
            hasAnimationEvent = true;
            break;
          }
        }
      }

      if (!hasAnimationEvent) {
        const deltaMs = nextEventTimestamp - evt.timestamp;
        if (deltaMs >= 3000) {
          const t1 = evt.timestamp + Math.min(4000, Math.round(deltaMs * 0.33));
          const t2 = evt.timestamp + Math.min(8000, Math.round(deltaMs * 0.66));
          const slideTitle = slideIdx === 4 ? "Daniel e Ste" : "Finale";

          result.push({
            id: `synth_anim_${slideIdx}_step1_${evt.timestamp}`,
            timestamp: t1,
            type: "SLIDE_ANIMATION",
            description:
              slideIdx === 4
                ? "Mostro animazione slide 5 (Daniel e Ste): Compare Daniel"
                : "Mostro animazione slide 13 (Finale): Primo fumetto",
            details: {
              slideIndex: slideIdx,
              slideNumber: slideIdx + 1,
              slideTitle,
              step: 1,
              animationName: slideIdx === 4 ? "Compare Daniel" : "Primo fumetto",
            },
          });

          result.push({
            id: `synth_anim_${slideIdx}_step2_${evt.timestamp}`,
            timestamp: t2,
            type: "SLIDE_ANIMATION",
            description:
              slideIdx === 4
                ? "Mostro animazione slide 5 (Daniel e Ste): Compare Klippy"
                : "Mostro animazione slide 13 (Finale): Secondo fumetto e card finale",
            details: {
              slideIndex: slideIdx,
              slideNumber: slideIdx + 1,
              slideTitle,
              step: 2,
              animationName:
                slideIdx === 4 ? "Compare Klippy" : "Secondo fumetto e card finale",
            },
          });
        }
      }
    }
  }

  return result.sort((a, b) => a.timestamp - b.timestamp);
}
export function ensureSessionEvents(session: TalkSessionRecord): SessionEvent[] {
  const defaultEnd =
    session.endedAt ||
    (session.startedAt ? session.startedAt + (session.totalDurationSeconds || 60) * 1000 : Date.now());

  if (session.events && session.events.length > 0) {
    return enrichSlideAnimationEvents(
      [...session.events].sort((a, b) => a.timestamp - b.timestamp),
      defaultEnd
    );
  }

  const synthesized: SessionEvent[] = [];
  const start = session.startedAt || (session.createdAt || Date.now());
  let currentMs = start;

  // 1. Session start
  synthesized.push({
    id: "synth_start",
    timestamp: currentMs,
    type: "SESSION_START",
    description: "Avvio della sessione talk",
  });

  const introEnd = session.introEndSlide ?? 10;
  const slides = session.slides.length > 0 ? session.slides : SLIDES.map((s, i) => ({
    slideIndex: i,
    slideId: s.id,
    slideTitle: s.title,
    durationSeconds: 60,
    visits: 1,
  }));

  // 2. Intro slides
  const introSlides = slides.slice(0, introEnd);
  for (let i = 0; i < introSlides.length; i++) {
    const s = introSlides[i]!;
    synthesized.push({
      id: `synth_slide_${s.slideIndex}`,
      timestamp: currentMs,
      type: "SLIDE_VIEW",
      description: `Mostro slide ${s.slideIndex + 1} (${s.slideTitle})`,
      details: {
        slideIndex: s.slideIndex,
        slideNumber: s.slideIndex + 1,
        slideTitle: s.slideTitle,
      },
    });
    currentMs += Math.max(1, s.durationSeconds) * 1000;
  }

  // 3. Game phase
  if (session.provocations && session.provocations.length > 0) {
    synthesized.push({
      id: "synth_mode_game",
      timestamp: currentMs,
      type: "MODE_CHANGE",
      description: "Passo a modalità gioco",
      details: { mode: "game" },
    });

    for (let pIdx = 0; pIdx < session.provocations.length; pIdx++) {
      const p = session.provocations[pIdx]!;
      const provNum = pIdx + 1;

      // Challenge start
      synthesized.push({
        id: `synth_prov_view_${p.id}`,
        timestamp: currentMs,
        type: "PROVOCATION_VIEW",
        description: `Visualizzo provocazione #${provNum}: "${p.provocationTitle}"`,
        details: {
          provocationId: p.provocationId,
          provocationNumber: provNum,
          provocationTitle: p.provocationTitle,
        },
      });

      const acceptSec = Math.max(1, p.acceptanceTimeSeconds || 15);
      currentMs += acceptSec * 1000;

      // Provocation accept -> Discussion starts
      synthesized.push({
        id: `synth_prov_accept_${p.id}`,
        timestamp: currentMs,
        type: "PROVOCATION_ACCEPT",
        description: `Accetto provocazione #${provNum}: "${p.provocationTitle}"`,
        details: {
          provocationId: p.provocationId,
          provocationNumber: provNum,
          provocationTitle: p.provocationTitle,
        },
      });

      const discussSec = Math.max(1, p.discussionDurationSeconds || 240);
      currentMs += discussSec * 1000;

      // Discussion ends
      synthesized.push({
        id: `synth_prov_disc_end_${p.id}`,
        timestamp: currentMs,
        type: "DISCUSSION_END",
        description: `Conclusa discussione provocazione #${provNum}`,
        details: {
          provocationId: p.provocationId,
          provocationNumber: provNum,
        },
      });
    }
  }

  // 4. Concluding slides
  const concludingSlides = slides.slice(introEnd);
  if (concludingSlides.length > 0) {
    synthesized.push({
      id: "synth_stop_calls",
      timestamp: currentMs,
      type: "STOP_CALLS",
      description: 'Avviso "Stop alle telefonate"',
    });
    currentMs += 2000;

    synthesized.push({
      id: "synth_mode_pres_end",
      timestamp: currentMs,
      type: "MODE_CHANGE",
      description: "Ritorno a presentazione slide conclusive",
      details: { mode: "presentation" },
    });

    for (let i = 0; i < concludingSlides.length; i++) {
      const s = concludingSlides[i]!;
      synthesized.push({
        id: `synth_slide_concl_${s.slideIndex}`,
        timestamp: currentMs,
        type: "SLIDE_VIEW",
        description: `Mostro slide ${s.slideIndex + 1} (${s.slideTitle})`,
        details: {
          slideIndex: s.slideIndex,
          slideNumber: s.slideIndex + 1,
          slideTitle: s.slideTitle,
        },
      });
      currentMs += Math.max(1, s.durationSeconds) * 1000;
    }
  }

  // 5. Session end
  synthesized.push({
    id: "synth_end",
    timestamp: currentMs,
    type: "SESSION_END",
    description: "Fine della sessione talk",
  });

  return enrichSlideAnimationEvents(synthesized, currentMs);
}

/**
 * Reconstructs the exact presentation & game state at elapsedSeconds
 */
export function getReplayStateAt(
  session: TalkSessionRecord,
  events: SessionEvent[],
  elapsedSeconds: number
): ReplayState {
  const baseStart = session.startedAt || (session.createdAt || Date.now());
  const targetTimestamp = baseStart + Math.max(0, elapsedSeconds) * 1000;

  let mode: "presentation" | "game" = "presentation";
  let slideIndex = 0;
  let slideStep = 0;
  let gameStep: "IDLE" | "CHALLENGE" | "PROVOCATION" | "DISCUSSION" = "IDLE";
  let currentProvocationId: string | null = PROVOCATIONS[0]?.id ?? null;
  let isDiscussionPaused = false;
  let stopCallsShown = false;

  let challengeStartTimestamp: number | null = null;
  let discussionStartTimestamp: number | null = null;
  let accumulatedPauseMs = 0;
  let pauseStartTimestamp: number | null = null;

  let activeEventIndex = -1;
  let activeEvent: SessionEvent | null = null;

  for (let i = 0; i < events.length; i++) {
    const evt = events[i]!;
    if (evt.timestamp > targetTimestamp) {
      break;
    }

    activeEventIndex = i;
    activeEvent = evt;

    switch (evt.type) {
      case "SESSION_START":
        mode = "presentation";
        slideIndex = 0;
        stopCallsShown = false;
        break;

      case "SLIDE_VIEW":
        mode = "presentation";
        if (typeof evt.details?.slideIndex === "number") {
          slideIndex = evt.details.slideIndex;
        } else if (typeof evt.details?.slideNumber === "number") {
          slideIndex = evt.details.slideNumber - 1;
        }
        slideStep = typeof evt.details?.step === "number" ? evt.details.step : 0;
        stopCallsShown = false;
        break;

      case "SLIDE_ANIMATION":
        mode = "presentation";
        if (typeof evt.details?.slideIndex === "number") {
          slideIndex = evt.details.slideIndex;
        } else if (typeof evt.details?.slideNumber === "number") {
          slideIndex = evt.details.slideNumber - 1;
        }
        if (typeof evt.details?.step === "number") {
          slideStep = evt.details.step;
        }
        break;

      case "MODE_CHANGE":
        if (evt.details?.mode) {
          mode = evt.details.mode;
        }
        if (typeof evt.details?.slideIndex === "number") {
          slideIndex = evt.details.slideIndex;
        }
        if (typeof evt.details?.provocationId === "string") {
          currentProvocationId = evt.details.provocationId;
          gameStep = "PROVOCATION";
        } else if (mode === "game") {
          if (evt.description.toLowerCase().includes("sfida")) {
            gameStep = "CHALLENGE";
            challengeStartTimestamp = evt.timestamp;
          } else if (evt.description.toLowerCase().includes("iniziale")) {
            gameStep = "IDLE";
          }
        }
        stopCallsShown = false;
        break;

      case "NAVIGATION":
        if (evt.details?.path === "/game") {
          mode = "game";
        } else if (evt.details?.path === "/presentation") {
          mode = "presentation";
        }
        if (typeof evt.details?.slideIndex === "number") {
          slideIndex = evt.details.slideIndex;
        }
        if (typeof evt.details?.provocationId === "string") {
          currentProvocationId = evt.details.provocationId;
        }
        stopCallsShown = false;
        break;

      case "CHALLENGE_START":
        mode = "game";
        gameStep = "CHALLENGE";
        challengeStartTimestamp = evt.timestamp;
        break;

      case "CHALLENGE_TIMEOUT":
        mode = "game";
        gameStep = "PROVOCATION";
        break;

      case "PROVOCATION_VIEW":
        mode = "game";
        gameStep = "PROVOCATION";
        if (typeof evt.details?.provocationId === "string") {
          currentProvocationId = evt.details.provocationId;
        }
        break;

      case "PROVOCATION_ACCEPT":
        mode = "game";
        gameStep = "DISCUSSION";
        if (typeof evt.details?.provocationId === "string") {
          currentProvocationId = evt.details.provocationId;
        }
        discussionStartTimestamp = evt.timestamp;
        accumulatedPauseMs = 0;
        pauseStartTimestamp = null;
        isDiscussionPaused = false;
        break;

      case "PROVOCATION_SKIP":
        mode = "game";
        gameStep = "PROVOCATION";
        if (typeof evt.details?.provocationId === "string") {
          currentProvocationId = evt.details.provocationId;
        }
        break;

      case "DISCUSSION_PAUSE":
        isDiscussionPaused = true;
        pauseStartTimestamp = evt.timestamp;
        break;

      case "DISCUSSION_RESUME":
        isDiscussionPaused = false;
        if (pauseStartTimestamp) {
          accumulatedPauseMs += evt.timestamp - pauseStartTimestamp;
          pauseStartTimestamp = null;
        }
        break;

      case "DISCUSSION_END":
        mode = "game";
        gameStep = "PROVOCATION";
        discussionStartTimestamp = null;
        break;

      case "STOP_CALLS":
        stopCallsShown = true;
        break;

      case "SESSION_END":
        // End of session reached
        break;

      default:
        break;
    }
  }

  // Calculate remaining challenge seconds (default 30s)
  let challengeSecondsRemaining = 30;
  if (gameStep === "CHALLENGE" && challengeStartTimestamp) {
    const elapsedChallengeMs = targetTimestamp - challengeStartTimestamp;
    challengeSecondsRemaining = Math.max(0, 30 - Math.floor(elapsedChallengeMs / 1000));
  }

  // Calculate remaining discussion seconds (default 300s = 5m)
  let discussionSecondsRemaining = 300;
  if (gameStep === "DISCUSSION" && discussionStartTimestamp) {
    let elapsedDiscussMs = targetTimestamp - discussionStartTimestamp - accumulatedPauseMs;
    if (isDiscussionPaused && pauseStartTimestamp) {
      elapsedDiscussMs -= (targetTimestamp - pauseStartTimestamp);
    }
    discussionSecondsRemaining = Math.max(0, 300 - Math.floor(elapsedDiscussMs / 1000));
  }

  // Clamp slide index to valid boundaries
  const totalSlides = SLIDES.length;
  slideIndex = Math.min(Math.max(0, slideIndex), totalSlides - 1);

  return {
    mode,
    slideIndex,
    slideStep,
    gameStep,
    currentProvocationId,
    challengeSecondsRemaining,
    discussionSecondsRemaining,
    isDiscussionPaused,
    stopCallsShown,
    activeEvent,
    activeEventIndex,
  };
}

/**
 * Total duration in seconds for replay
 */
export function getSessionTotalSeconds(session: TalkSessionRecord, events: SessionEvent[]): number {
  if (session.totalDurationSeconds && session.totalDurationSeconds > 0) {
    return session.totalDurationSeconds;
  }
  if (session.endedAt && session.startedAt) {
    return Math.max(1, Math.round((session.endedAt - session.startedAt) / 1000));
  }
  if (events.length >= 2) {
    const first = events[0]!.timestamp;
    const last = events[events.length - 1]!.timestamp;
    return Math.max(1, Math.round((last - first) / 1000));
  }
  return 60;
}
