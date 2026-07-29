import { z } from 'zod'

// DTOs for the guest (no-login) content surface — the built-in topics gallery at
// /learn. Lesson/course/answer reuse the existing schemas in core/lesson-view.

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

export const importProgressRequest = z.object({
  entries: z.array(guestProgressEntrySchema).max(500),
  // Cumulative play XP the guest banked (already daily-capped client-side).
  // Clamped server-side to a sane ceiling so a forged request can't inflate.
  playXp: z.number().int().min(0).max(3650).optional(),
})

export const importProgressResult = z.object({
  imported: z.number().int(),
  xp: z.number().int(),
})
export type ImportProgressResult = z.infer<typeof importProgressResult>
