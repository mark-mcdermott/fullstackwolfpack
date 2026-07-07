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
