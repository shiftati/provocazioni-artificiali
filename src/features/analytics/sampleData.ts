import type { TalkSessionRecord } from "../../types";
import { SLIDES } from "../presentation/slides.registry";
import { PROVOCATIONS } from "../game/provocations.registry";

export function createSampleSessions(): TalkSessionRecord[] {
  const now = Date.now();
  const oneDayAgo = now - 24 * 3600 * 1000;
  const twoDaysAgo = now - 48 * 3600 * 1000;

  const session1: TalkSessionRecord = {
    id: `sample_session_${oneDayAgo}`,
    name: "Codemotion Milano - Main Stage",
    createdAt: oneDayAgo,
    startedAt: oneDayAgo,
    endedAt: oneDayAgo + 42 * 60 * 1000, // 42 minutes total
    totalDurationSeconds: 42 * 60,
    gameDurationSeconds: 794, // 13m 14s spent in game mode between slide 11 and 12
    plannedEndTime: "17:15",
    plannedEndTimestamp: oneDayAgo + 45 * 60 * 1000,
    notes: "Ottimo feedback dalla platea. Dibattito vivace sui microservizi e su AI coding.",
    slides: SLIDES.map((slide, idx) => {
      // Realistic slide durations in seconds
      const durations = [
        45,   // Titolo
        90,   // Gli esperti
        110,  // Developer qualunque
        85,   // Macchinetta del caffè
        130,  // Daniel e Ste
        95,   // Klippy
        70,   // Ritorno al Futuro
        60,   // Klippy saw
        80,   // Fight club
        75,   // Klippy lotta tra AI
        50,   // Klippy matrix
        140,  // Io sono eccellenza
        100,  // Selfie
        60,   // Finale
      ];
      return {
        slideIndex: idx,
        slideId: slide.id,
        slideTitle: slide.title,
        durationSeconds: durations[idx] ?? 60,
        visits: idx === 4 || idx === 10 ? 2 : 1,
      };
    }),
    provocations: [
      {
        id: "prov_sample_1",
        provocationId: PROVOCATIONS[0]?.id ?? "saas-morto",
        provocationTitle: PROVOCATIONS[0]?.title ?? "Il SaaS è morto",
        provocationSubtitle: PROVOCATIONS[0]?.subtitle,
        acceptanceTimeSeconds: 16,
        discussionDurationSeconds: 260, // 4m 20s
        completedAt: oneDayAgo + 22 * 60 * 1000,
      },
      {
        id: "prov_sample_2",
        provocationId: PROVOCATIONS[1]?.id ?? "societa-consulenza",
        provocationTitle: PROVOCATIONS[1]?.title ?? "Società di consulenza",
        provocationSubtitle: PROVOCATIONS[1]?.subtitle,
        acceptanceTimeSeconds: 22,
        discussionDurationSeconds: 295, // 4m 55s
        completedAt: oneDayAgo + 28 * 60 * 1000,
      },
      {
        id: "prov_sample_3",
        provocationId: PROVOCATIONS[3]?.id ?? "colloquio-tecnico",
        provocationTitle: PROVOCATIONS[3]?.title ?? "Colloquio tecnico sul codice",
        provocationSubtitle: PROVOCATIONS[3]?.subtitle,
        acceptanceTimeSeconds: 11,
        discussionDurationSeconds: 190, // 3m 10s
        completedAt: oneDayAgo + 33 * 60 * 1000,
      },
    ],
    provocationsCount: 3,
  };

  const session2: TalkSessionRecord = {
    id: `sample_session_${twoDaysAgo}`,
    name: "Prove Generali Talk",
    createdAt: twoDaysAgo,
    startedAt: twoDaysAgo,
    endedAt: twoDaysAgo + 38 * 60 * 1000,
    totalDurationSeconds: 38 * 60,
    gameDurationSeconds: 556, // 9m 16s spent in game mode between slide 11 and 12
    plannedEndTime: "11:30",
    plannedEndTimestamp: twoDaysAgo + 40 * 60 * 1000,
    notes: "Prima prova complessiva con timer attivo. Ritmo scorrevole.",
    slides: SLIDES.map((slide, idx) => {
      const durations = [
        35, 75, 80, 65, 110, 85, 55, 45, 70, 60, 40, 120, 80, 50
      ];
      return {
        slideIndex: idx,
        slideId: slide.id,
        slideTitle: slide.title,
        durationSeconds: durations[idx] ?? 50,
        visits: 1,
      };
    }),
    provocations: [
      {
        id: "prov_sample_4",
        provocationId: PROVOCATIONS[2]?.id ?? "sviluppo-software-morto",
        provocationTitle: PROVOCATIONS[2]?.title ?? "Sviluppo software morto",
        provocationSubtitle: PROVOCATIONS[2]?.subtitle,
        acceptanceTimeSeconds: 8,
        discussionDurationSeconds: 240, // 4m
        completedAt: twoDaysAgo + 20 * 60 * 1000,
      },
      {
        id: "prov_sample_5",
        provocationId: PROVOCATIONS[4]?.id ?? "esperto-tecnologia",
        provocationTitle: PROVOCATIONS[4]?.title ?? "Esperto in una tecnologia",
        provocationSubtitle: PROVOCATIONS[4]?.subtitle,
        acceptanceTimeSeconds: 28,
        discussionDurationSeconds: 280, // 4m 40s
        completedAt: twoDaysAgo + 26 * 60 * 1000,
      },
    ],
    provocationsCount: 2,
  };

  return [session1, session2];
}
