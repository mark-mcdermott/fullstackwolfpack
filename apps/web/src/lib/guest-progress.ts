import { lessonScore, xpForLesson } from '@/core/learning'
import type { LessonCompletion } from '@/core/lesson-view'
import { xpForPlaySeconds } from '@/core/playtime'
import type { GuestProgressEntry } from '@/core/public-content'

// Guest (no-login) progress, mirrored in localStorage. Uses the SAME pure
// core/learning math as the server so a guest's XP/score matches what they'd get
// signed in. Device-local + losable by design — that's the "sign up to save your
// progress" conversion hook. On signup, this seeds the new account (phase 3).

const KEY = 'fw-guest-progress'

type GuestProgress = {
  // lessonId → the completion earned (first pass; re-completing doesn't re-award).
  completed: Record<string, { score: number; xp: number }>
  xp: number
  // Today's play XP toward the daily cap (resets when the day rolls over).
  play?: { day: string; xp: number }
  // Cumulative play XP across all days — migrated to the account on signup so the
  // leaderboard spot the guest earned doesn't vanish.
  playXpTotal?: number
}

function read(): GuestProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { completed: {}, xp: 0 }
    const parsed = JSON.parse(raw) as Partial<GuestProgress>
    return {
      completed: parsed.completed ?? {},
      xp: parsed.xp ?? 0,
      play: parsed.play,
      playXpTotal: parsed.playXpTotal ?? 0,
    }
  } catch {
    return { completed: {}, xp: 0 }
  }
}

function write(p: GuestProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* storage full / disabled — progress just isn't saved */
  }
}

export function guestCompletedLessonIds(): Set<string> {
  return new Set(Object.keys(read().completed))
}

export function guestXp(): number {
  return read().xp
}

// Bank modest play XP for a chunk of arcade playtime (daily-capped), so a guest's
// gaming contributes to their XP → the "you'd make the leaderboard" nudge. Same
// core math as the server. `today` is injectable for tests.
export function recordGuestPlaytime(
  seconds: number,
  today = new Date().toISOString().slice(0, 10),
): number {
  const p = read()
  const play = p.play && p.play.day === today ? p.play : { day: today, xp: 0 }
  const earned = xpForPlaySeconds(seconds, play.xp)
  if (earned > 0) {
    p.xp += earned
    p.play = { day: today, xp: play.xp + earned }
    p.playXpTotal = (p.playXpTotal ?? 0) + earned
    write(p)
  }
  return earned
}

// Cumulative play XP a guest has banked — migrated to the account on signup.
export function guestPlayXp(): number {
  return read().playXpTotal ?? 0
}

export function guestLessonsCompleted(): number {
  return Object.keys(read().completed).length
}

// The completed lessons as migration entries (posted to the account on signup).
export function guestProgressEntries(): GuestProgressEntry[] {
  return Object.entries(read().completed).map(([lessonId, v]) => ({
    lessonId,
    score: v.score,
    xp: v.xp,
  }))
}

// Cleared after a successful migration so it doesn't re-import on the next login.
export function clearGuestProgress(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

// Compute a lesson result the same way the server does, and persist it (idempotent
// per lesson — XP is awarded on first completion only). Returns the completion for
// the results panel.
export function completeLessonGuest(
  lessonId: string,
  correct: number,
  total: number,
  quizXp: number,
): LessonCompletion {
  const score = lessonScore(correct, total)
  const xp = quizXp + xpForLesson(score)
  const p = read()
  if (!p.completed[lessonId]) {
    p.completed[lessonId] = { score, xp }
    p.xp += xp
    write(p)
  }
  return { score, correct, total, xp }
}
