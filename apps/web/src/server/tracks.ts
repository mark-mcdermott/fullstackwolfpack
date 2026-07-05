import { and, desc, eq } from 'drizzle-orm'
import type { Difficulty } from '../core/generation'
import { db } from '../db'
import { courses, topics, userTopics } from '../db/schema'
import { summarizeTracks, type TrackCourse } from './course-resolver'
import { visibleCourseFilter } from './course-visibility'
import { enrollAndGenerate } from './enroll'
import { recomputeTopicProgress } from './learning'

// Switchable difficulty tracks. A topic can hold several courses (the built-in
// one + the user's generated tracks); which one is "active" is stored in
// user_topics.active_course_id (see course-resolver). This is the read + the
// switch/generate write behind the topic-settings Difficulty panel.

// The topic's courses this user can open, newest-first, typed for summarizeTracks.
async function visibleTrackCourses(
  userId: string,
  topicId: string,
): Promise<TrackCourse[]> {
  return db
    .select({
      id: courses.id,
      difficulty: courses.difficulty,
      status: courses.status,
    })
    .from(courses)
    .where(and(eq(courses.topicId, topicId), visibleCourseFilter(userId)))
    .orderBy(desc(courses.createdAt))
}

export async function getTopicTracks(userId: string, topicSlug: string) {
  const [topic] = await db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.slug, topicSlug))
  if (!topic) return null

  const [ut] = await db
    .select({ active: userTopics.activeCourseId })
    .from(userTopics)
    .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, topic.id)))

  const courseList = await visibleTrackCourses(userId, topic.id)
  return { topicSlug, ...summarizeTracks(courseList, ut?.active) }
}

// Switch the topic's active track to `difficulty`. If a ready course at that
// level already exists (built-in or a track the user generated before) it just
// becomes active — its own progress is intact. Otherwise a new course is
// generated at that level and set active. Either way the rollup is recomputed so
// lessonsCompleted/% reflect the now-active track.
export async function setActiveDifficulty(
  userId: string,
  topicSlug: string,
  difficulty: Difficulty,
) {
  const [topic] = await db
    .select({ id: topics.id, name: topics.name })
    .from(topics)
    .where(eq(topics.slug, topicSlug))
  if (!topic) return null

  const courseList = await visibleTrackCourses(userId, topic.id)
  const existing = courseList.find(
    (c) => c.difficulty === difficulty && c.status === 'ready',
  )

  let courseId: string
  let generated = false
  if (existing) {
    courseId = existing.id
  } else {
    courseId = await enrollAndGenerate({
      topic: topic.name,
      topicId: topic.id,
      difficulty,
      ownerUserId: userId,
    })
    generated = true
  }

  await db
    .insert(userTopics)
    .values({ userId, topicId: topic.id, activeCourseId: courseId, difficulty })
    .onConflictDoUpdate({
      target: [userTopics.userId, userTopics.topicId],
      set: { activeCourseId: courseId, difficulty },
    })
  await recomputeTopicProgress(userId, topic.id, new Date())

  return { courseId, difficulty, generated }
}
