import { lessonScore, xpForLesson } from '@/core/learning'
import type { LessonCompletion } from '@/core/lesson-view'
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
}

function read(): GuestProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { completed: {}, xp: 0 }
    const parsed = JSON.parse(raw) as Partial<GuestProgress>
    return { completed: parsed.completed ?? {}, xp: parsed.xp ?? 0 }
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
