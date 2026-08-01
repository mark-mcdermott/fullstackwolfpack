import { z } from 'zod'

// Mid-lesson position, mirrored to localStorage per lesson — which segment
// you're on and which questions you've answered — so leaving a mission ("take a
// break") or refreshing drops you back exactly where you were instead of
// restarting the lesson. Cleared once the lesson is completed.

const KEY = 'fw:lesson:progress'

const entrySchema = z.object({
  index: z.number().int().min(0),
  correctById: z.record(z.string(), z.boolean()),
  quizXp: z.number(),
  // Sections the learner has visited — kept so done/upcoming styling in the
  // mission TOC survives a break even after jumping around.
  seen: z.array(z.number().int().min(0)).optional(),
})
const storeSchema = z.record(z.string(), entrySchema)

export type LessonProgress = z.infer<typeof entrySchema>

function readAll(): Record<string, LessonProgress> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = storeSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, LessonProgress>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* storage disabled — position just won't survive a reload */
  }
}

export function loadLessonProgress(lessonId: string): LessonProgress | null {
  return readAll()[lessonId] ?? null
}

export function saveLessonProgress(
  lessonId: string,
  progress: LessonProgress,
): void {
  const all = readAll()
  all[lessonId] = progress
  writeAll(all)
}

export function clearLessonProgress(lessonId: string): void {
  const all = readAll()
  if (lessonId in all) {
    delete all[lessonId]
    writeAll(all)
  }
}
