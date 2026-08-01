import { count, eq } from 'drizzle-orm'
import { runAppend, type GenerationInput } from '../core/generation'
import { db } from '../db'
import { courses, lessons, topics, userTopics } from '../db/schema'
import { resolveActiveCourse } from './course-resolver'
import { drizzleCourseStore } from './course-store'
import { enrollAndGenerate, userGenerator } from './enroll'
import { recomputeTopicProgress } from './learning'

export type TailorMode = 'append' | 'rebuild'

// Tailor a topic's active course from a free-text instruction.
//   append  — add new lessons to the user's own course (progress preserved).
//             Only valid on an owned course (a built-in is shared).
//   rebuild — generate a fresh owned course at the same difficulty with the
//             instruction baked in, replace the prior owned track, set it active
//             (that track's progress resets — new lessons, new ids).
// Returns null for an unknown topic; throws (→ 400) on the append-on-built-in
// guard, a missing course, or a generation failure.
export async function tailorCourse(
  userId: string,
  topicSlug: string,
  mode: TailorMode,
  instructions: string,
) {
  const [topic] = await db
    .select({ id: topics.id, name: topics.name })
    .from(topics)
    .where(eq(topics.slug, topicSlug))
  if (!topic) return null

  const active = await resolveActiveCourse(userId, topic.id)
  if (!active) throw new Error('Generate a course for this topic first.')

  const [course] = await db
    .select({
      id: courses.id,
      ownerUserId: courses.ownerUserId,
      difficulty: courses.difficulty,
    })
    .from(courses)
    .where(eq(courses.id, active.id))
  if (!course) throw new Error('Generate a course for this topic first.')

  if (mode === 'append') {
    if (course.ownerUserId !== userId) {
      throw new Error(
        'Adding lessons is only available on a course you generated. Use Rebuild to make your own copy first.',
      )
    }
    const existing = await db
      .select({ title: lessons.title, orderIndex: lessons.orderIndex })
      .from(lessons)
      .where(eq(lessons.courseId, course.id))
      .orderBy(lessons.orderIndex)
    const startOrder = existing.reduce(
      (max, l) => Math.max(max, l.orderIndex + 1),
      0,
    )
    const input: GenerationInput = {
      topic: topic.name,
      difficulty: course.difficulty,
      customization: instructions,
      existingTitles: existing.map((l) => l.title),
    }
    const added = await runAppend(
      { generator: await userGenerator(userId), store: drizzleCourseStore() },
      course.id,
      input,
      startOrder,
    )
    await recomputeTopicProgress(userId, topic.id, new Date())
    return { courseId: course.id, mode, lessonsAdded: added }
  }

  // rebuild
  const newCourseId = await enrollAndGenerate({
    topic: topic.name,
    topicId: topic.id,
    difficulty: course.difficulty,
    ownerUserId: userId,
    customization: instructions,
  })
  // Drop the previous OWNED track so courses don't pile up; leave a built-in
  // course alone (it's shared) — the new owned course supersedes it as active.
  if (course.ownerUserId === userId) {
    await db.delete(courses).where(eq(courses.id, course.id))
  }
  await db
    .insert(userTopics)
    .values({
      userId,
      topicId: topic.id,
      activeCourseId: newCourseId,
      difficulty: course.difficulty,
    })
    .onConflictDoUpdate({
      target: [userTopics.userId, userTopics.topicId],
      set: { activeCourseId: newCourseId, difficulty: course.difficulty },
    })
  await recomputeTopicProgress(userId, topic.id, new Date())

  const [tally] = await db
    .select({ n: count(lessons.id) })
    .from(lessons)
    .where(eq(lessons.courseId, newCourseId))
  return { courseId: newCourseId, mode, lessonsAdded: Number(tally?.n ?? 0) }
}
