import { and, desc, eq, isNull, or } from 'drizzle-orm'
import {
  accuracyPct,
  DIFFICULTIES,
  MASTERY_SCORE,
  recommendDifficulty,
  type AdaptiveState,
} from '../core/adaptive'
import type { Difficulty } from '../core/generation'
import { db } from '../db'
import {
  courses,
  lessons,
  quizAttempts,
  topics,
  userLessonProgress,
  userTopics,
} from '../db/schema'

// Server read for adaptive difficulty. Pure math in core/adaptive.ts over signals
// we already store (quiz_attempts, user_topics, user_lesson_progress) — NO new
// tables, NO LLM. Mirrors server/learning.ts.

const RECENT = 20 // window for "recent" accuracy

function asDifficulty(v: string | null | undefined): Difficulty {
  return (DIFFICULTIES as string[]).includes(v ?? '') ? (v as Difficulty) : 'beginner'
}

export async function getAdaptiveState(
  userId: string,
  topicSlug?: string,
): Promise<AdaptiveState> {
  // Recent quiz accuracy across all topics (the difficulty setpoint signal).
  const recent = await db
    .select({ isCorrect: quizAttempts.isCorrect })
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.createdAt))
    .limit(RECENT)
  const attempts = recent.length
  const correct = recent.filter((r) => r.isCorrect).length
  const recentAccuracy = accuracyPct(correct, attempts)

  let current: Difficulty = 'beginner'
  const lessonsState: AdaptiveState['lessons'] = []

  if (topicSlug) {
    const [topic] = await db
      .select({ id: topics.id })
      .from(topics)
      .where(eq(topics.slug, topicSlug))

    if (topic) {
      const [ut] = await db
        .select({ difficulty: userTopics.difficulty })
        .from(userTopics)
        .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, topic.id)))
      current = asDifficulty(ut?.difficulty)

      // The topic's course (the user's own, else the shared/built-in one).
      const [course] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(
          and(
            eq(courses.topicId, topic.id),
            or(eq(courses.ownerUserId, userId), isNull(courses.ownerUserId)),
          ),
        )
        .orderBy(desc(courses.createdAt))
        .limit(1)

      if (course) {
        const rows = await db
          .select({ lessonId: lessons.id, score: userLessonProgress.score })
          .from(lessons)
          .leftJoin(
            userLessonProgress,
            and(
              eq(userLessonProgress.lessonId, lessons.id),
              eq(userLessonProgress.userId, userId),
            ),
          )
          .where(eq(lessons.courseId, course.id))
          .orderBy(lessons.orderIndex)

        // Mastery gate: a lesson unlocks once the previous one is mastered
        // (score ≥ threshold). The first lesson is always open (§5.4).
        let prevMastered = true
        for (const r of rows) {
          const mastered = (r.score ?? 0) >= MASTERY_SCORE
          lessonsState.push({ lessonId: r.lessonId, mastered, locked: !prevMastered })
          prevMastered = mastered
        }
      }
    }
  }

  const rec = recommendDifficulty(recentAccuracy, current, attempts)
  return {
    recentAccuracy,
    attempts,
    currentDifficulty: current,
    recommendedDifficulty: rec.difficulty,
    direction: rec.direction,
    reason: rec.reason,
    lessons: lessonsState,
  }
}
