import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { courses, userTopics } from '../db/schema'
import { visibleCourseFilter } from './course-visibility'

// Resolving "the course for a topic" for a user. A topic can hold several courses
// (the shared built-in one plus the user's own difficulty tracks / tailored
// courses), so the app needs a single, consistent answer for which one is active.
// The rule: honor the user's explicit pointer (`user_topics.active_course_id`)
// when it still points at a course they can see; otherwise fall back to the
// newest visible course — the behavior from before the pointer existed, so a null
// pointer (every pre-existing row) keeps working unchanged.

// Pure decision, unit-tested. `visibleCourseIdsNewestFirst` is already scoped to
// the user's visible set and ordered newest-first.
export function pickActiveCourseId(
  activeCourseId: string | null | undefined,
  visibleCourseIdsNewestFirst: readonly string[],
): string | null {
  if (activeCourseId && visibleCourseIdsNewestFirst.includes(activeCourseId)) {
    return activeCourseId
  }
  return visibleCourseIdsNewestFirst[0] ?? null
}

// Resolve a single topic's active course (id + status) for a user, or null if the
// topic has no course the user can open.
export async function resolveActiveCourse(userId: string, topicId: string) {
  const [ut] = await db
    .select({ active: userTopics.activeCourseId })
    .from(userTopics)
    .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, topicId)))

  const visible = await db
    .select({ id: courses.id, status: courses.status })
    .from(courses)
    .where(and(eq(courses.topicId, topicId), visibleCourseFilter(userId)))
    .orderBy(desc(courses.createdAt))

  const pickedId = pickActiveCourseId(
    ut?.active,
    visible.map((c) => c.id),
  )
  return visible.find((c) => c.id === pickedId) ?? null
}

// Batch variant for the Topics view: active course id per topic, for every topic
// the user has a visible course for. Two queries total regardless of topic count.
export async function resolveActiveCourseIdsByTopic(
  userId: string,
): Promise<Map<string, string>> {
  const pointers = await db
    .select({ topicId: userTopics.topicId, active: userTopics.activeCourseId })
    .from(userTopics)
    .where(eq(userTopics.userId, userId))
  const activeByTopic = new Map(pointers.map((p) => [p.topicId, p.active]))

  const visible = await db
    .select({ id: courses.id, topicId: courses.topicId })
    .from(courses)
    .where(visibleCourseFilter(userId))
    .orderBy(desc(courses.createdAt))

  const idsByTopic = new Map<string, string[]>()
  for (const c of visible) {
    const ids = idsByTopic.get(c.topicId) ?? []
    ids.push(c.id)
    idsByTopic.set(c.topicId, ids)
  }

  const result = new Map<string, string>()
  for (const [topicId, ids] of idsByTopic) {
    const picked = pickActiveCourseId(activeByTopic.get(topicId), ids)
    if (picked) result.set(topicId, picked)
  }
  return result
}
