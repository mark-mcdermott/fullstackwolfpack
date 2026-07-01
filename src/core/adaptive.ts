import { z } from 'zod'
import type { Difficulty } from './generation'

// Adaptive difficulty (docs/education-system.md §5.4). Pure app logic over signals
// we already compute — NO LLM call. Three levers:
//   1. difficulty setpoint at ~85% recent accuracy (Wilson et al.'s optimal error rate)
//   2. per-item difficulty via a running Elo update from correctness alone
//   3. next-lesson unlock gated on a mastery threshold + a short correct streak
// Kept deliberately lightweight — no knowledge-tracing model for v1.

export const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']

// The ~85% setpoint: fastest learning sits at ~15% error. Above the raise band we
// step up; below the lower band we step down (and should insert review/remedial work).
export const RAISE_ABOVE = 85
export const LOWER_BELOW = 70

// Mastery gate for unlocking the next lesson (Khan-style). Deliberately NOT gated on
// streak/XP/lessons-completed — that rewards grinding, not learning ("streak creep").
export const MASTERY_SCORE = 80
export const MASTERY_STREAK = 3

export type Direction = 'up' | 'down' | 'hold'

export function accuracyPct(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 100)
}

function step(current: Difficulty, dir: Direction): Difficulty {
  const i = DIFFICULTIES.indexOf(current)
  if (dir === 'up') return DIFFICULTIES[Math.min(DIFFICULTIES.length - 1, i + 1)]
  if (dir === 'down') return DIFFICULTIES[Math.max(0, i - 1)]
  return current
}

export type DifficultyRecommendation = {
  difficulty: Difficulty
  direction: Direction
  reason: string
}

// Recommend the difficulty for the learner's next course/lesson from recent accuracy.
export function recommendDifficulty(
  recentAccuracy: number,
  current: Difficulty,
  attempts: number,
): DifficultyRecommendation {
  // Need a little evidence before moving anyone — cold-start holds (§5.4).
  if (attempts < 4) {
    return { difficulty: current, direction: 'hold', reason: 'Not enough recent answers yet.' }
  }
  if (recentAccuracy >= RAISE_ABOVE) {
    return {
      difficulty: step(current, 'up'),
      direction: 'up',
      reason: `You're at ${recentAccuracy}% — ready for a tougher level.`,
    }
  }
  if (recentAccuracy < LOWER_BELOW) {
    return {
      difficulty: step(current, 'down'),
      direction: 'down',
      reason: `At ${recentAccuracy}%, an easier level (and some review) will help.`,
    }
  }
  return {
    difficulty: current,
    direction: 'hold',
    reason: `${recentAccuracy}% is right in the learning sweet spot — keep going.`,
  }
}

// ---- Per-item difficulty via Elo (item-response-lite) ----

export const DEFAULT_RATING = 1200
const K = 32

function expected(a: number, b: number): number {
  return 1 / (1 + 10 ** ((b - a) / 400))
}

// Update learner + item ratings from a single correct/incorrect result. A correct
// answer pushes the learner up and the item down (it was "beaten"), and vice-versa —
// so the item rating tracks its empirical difficulty without any pretesting.
export function updateElo(
  learnerRating: number,
  itemRating: number,
  correct: boolean,
): { learnerRating: number; itemRating: number } {
  const exp = expected(learnerRating, itemRating)
  const actual = correct ? 1 : 0
  return {
    learnerRating: Math.round(learnerRating + K * (actual - exp)),
    itemRating: Math.round(itemRating + K * (exp - actual)),
  }
}

// ---- Mastery gate ----

// Whether a lesson is mastered well enough to unlock the next one.
export function hasMastery(score: number, correctStreak: number): boolean {
  return score >= MASTERY_SCORE && correctStreak >= MASTERY_STREAK
}

// ---- Client contract (GET /api/me/adaptive) ----

export const adaptiveLessonSchema = z.object({
  lessonId: z.string(),
  mastered: z.boolean(),
  locked: z.boolean(), // gated behind the previous lesson's mastery
})

export const adaptiveStateSchema = z.object({
  recentAccuracy: z.number().int(),
  attempts: z.number().int(),
  currentDifficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  recommendedDifficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  direction: z.enum(['up', 'down', 'hold']),
  reason: z.string(),
  lessons: z.array(adaptiveLessonSchema),
})
export type AdaptiveState = z.infer<typeof adaptiveStateSchema>
