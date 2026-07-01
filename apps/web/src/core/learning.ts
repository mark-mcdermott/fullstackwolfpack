// Pure learning-loop math — the engine that turns a lesson interaction into a
// score, XP, progress, and a streak update. No DOM, no DB: unit-tested directly
// and shared by the server writes (server/learning.ts → api/me/[action].ts) and
// the client (optimistic UI). Mirrors the pure style of core/progress.ts.
//
// NOTE: the XP numbers below are a *shared interface*. The dashboards (owned by
// the main pane) read the `xp_events` these produce, so the exact values must be
// agreed with main before wiring — they're centralised in `XP` for that reason.
// See docs/education-system.md §8. Short-answer grading is an AI seam
// (core/grader.ts), not part of this pure module — only MCQ grading lives here.

// ---- MCQ grading ----

export function isCorrectMcq(correctIndex: number, selectedIndex: number): boolean {
  return selectedIndex === correctIndex
}

export type AnswerResult = { correct: boolean; xp: number }

export function gradeMcqAnswer(
  correctIndex: number,
  selectedIndex: number,
): AnswerResult {
  const correct = isCorrectMcq(correctIndex, selectedIndex)
  return { correct, xp: xpForQuiz(correct) }
}

// ---- Scores & progress (all 0–100) ----

// A lesson's quiz score.
export function lessonScore(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 100)
}

// A topic's overall progress.
export function topicProgressPct(
  lessonsCompleted: number,
  lessonsTotal: number,
): number {
  if (lessonsTotal <= 0) return 0
  return Math.min(100, Math.round((lessonsCompleted / lessonsTotal) * 100))
}

// Whether every segment of a lesson has been worked through.
export function isLessonComplete(
  segmentsDone: number,
  segmentsTotal: number,
): boolean {
  return segmentsTotal > 0 && segmentsDone >= segmentsTotal
}

// ---- XP policy (tunable; shared with the dashboards — see header) ----

export const XP = {
  quizCorrect: 10,
  quizIncorrect: 2, // reward the attempt, lightly
  lessonBase: 50,
  lessonMasteryBonus: 25, // added at/above masteryScore
  masteryScore: 90,
  streakPerDay: 5,
  streakCapDays: 7, // streak XP stops scaling past a week
} as const

export function xpForQuiz(correct: boolean): number {
  return correct ? XP.quizCorrect : XP.quizIncorrect
}

export function xpForLesson(score: number): number {
  return XP.lessonBase + (score >= XP.masteryScore ? XP.lessonMasteryBonus : 0)
}

export function xpForStreakDay(streak: number): number {
  return Math.min(streak, XP.streakCapDays) * XP.streakPerDay
}

// ---- Streak transition ----

export type StreakResult = {
  streak: number
  isNewDay: boolean // first activity today → grant streak XP, write daily_activity
  continued: boolean // extended an existing streak (vs. same-day or reset)
}

// Given the last active day, today, and the current streak, compute the next
// streak. Pure — days are compared as UTC calendar days, ignoring time-of-day.
export function nextStreak(
  lastActiveDate: string | Date | null,
  today: Date,
  currentStreak: number,
): StreakResult {
  if (lastActiveDate == null) {
    return { streak: 1, isNewDay: true, continued: false }
  }
  const gap = dayNumber(today) - dayNumber(new Date(lastActiveDate))
  if (gap === 0) return { streak: currentStreak, isNewDay: false, continued: false }
  if (gap === 1) return { streak: currentStreak + 1, isNewDay: true, continued: true }
  return { streak: 1, isNewDay: true, continued: false } // missed a day → reset
}

// Whole UTC days since the epoch (a calendar-day bucket).
function dayNumber(d: Date): number {
  return Math.floor(d.getTime() / 86_400_000)
}
