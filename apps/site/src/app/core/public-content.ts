import { z } from 'zod'

// DTOs for the guest (no-login) content surface — the built-in topics gallery at
// /skill. Lesson/course/answer reuse the existing schemas in core/lesson-view.

export const publicTopicSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
})
export type PublicTopic = z.infer<typeof publicTopicSchema>

export const publicTopicsSchema = z.object({
  topics: z.array(publicTopicSchema),
})
export type PublicTopicsView = z.infer<typeof publicTopicsSchema>

// Guest → account migration (on signup/login). The client posts its localStorage
// progress; the server clamps score/xp (untrusted client input) and grants it for
// built-in lessons the account hasn't already completed.
export const guestProgressEntrySchema = z.object({
  lessonId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  xp: z.number().int().min(0).max(200),
})
export type GuestProgressEntry = z.infer<typeof guestProgressEntrySchema>

// A spaced-repetition card a guest built before signing up. The scheduler is
// pure and runs client-side for guests (lib/guest-review), so the card arrives
// already scheduled — the server stores it rather than recomputing it.
//
// Bounded like everything else here: this is an unauthenticated-user payload
// being written into an account, so every field is range-checked rather than
// trusted. A forged card cannot schedule itself centuries out or claim a
// review history it never had.
export const guestReviewCardSchema = z.object({
  questionId: z.string().min(1),
  interval: z.number().int().min(0).max(3650),
  repetitions: z.number().int().min(0).max(1000),
  efactor: z.number().min(1.3).max(5),
  reps: z.number().int().min(0).max(10_000),
  lapses: z.number().int().min(0).max(10_000),
  due: z.string().datetime(),
  lastReviewedAt: z.string().datetime().nullable(),
})
export type GuestReviewCard = z.infer<typeof guestReviewCardSchema>

export const importProgressRequest = z.object({
  entries: z.array(guestProgressEntrySchema).max(500),
  // Cumulative play XP the guest banked (already daily-capped client-side).
  // Clamped server-side to a sane ceiling so a forged request can't inflate.
  playXp: z.number().int().min(0).max(3650).optional(),
  // Review cards ride along on the same request rather than a second one:
  // signup should hand the whole guest state over in one go, and a partial
  // migration is the failure mode worth avoiding.
  reviews: z.array(guestReviewCardSchema).max(500).optional(),
})

export const importProgressResult = z.object({
  imported: z.number().int(),
  xp: z.number().int(),
  reviews: z.number().int().default(0),
})
export type ImportProgressResult = z.infer<typeof importProgressResult>
