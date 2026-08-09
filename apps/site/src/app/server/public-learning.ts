import { and, desc, eq, isNull } from 'drizzle-orm'
import type { CourseOutline } from '../core/app-data'
import { gradeMcqAnswer } from '../core/learning'
import type { AnswerFeedback, LessonView } from '../core/lesson-view'
import type { PublicTopic } from '../core/public-content'
import { db } from '../db'
import {
  courses,
  lessonSegments,
  lessons,
  quizQuestions,
  topics,
} from '../db/schema'
import { getLessonView, type AnswerInput } from './learning'

// Public (guest, no-session) reads over BUILT-IN content only (courses with
// ownerUserId = null). A guest can never reach a user's private AI-generated
// course. Served by pre-gate actions in api/me/[action].ts; progress lives in
// the client's localStorage (lib/guest-progress.ts), so these are read-only +
// unlogged.

// Topics that have a built-in course — the guest browse gallery (/skill).
// Archived topics are held back: built, seeded, but off the menu (see
// `topicStatus` in db/schema/catalog.ts). This is a gallery, so it filters;
// getPublicCourseOutline below deliberately does not, and an archived topic
// stays reachable by its slug.
export async function getPublicTopics(): Promise<PublicTopic[]> {
  const rows = await db
    .selectDistinct({
      slug: topics.slug,
      name: topics.name,
      description: topics.description,
    })
    .from(topics)
    .innerJoin(courses, eq(courses.topicId, topics.id))
    .where(and(isNull(courses.ownerUserId), eq(topics.status, 'active')))
    .orderBy(topics.name)
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    description: r.description ?? '',
  }))
}

// The built-in course outline for a topic, with no per-user progress (the client
// overlays localStorage completion).
export async function getPublicCourseOutline(
  topicSlug: string,
): Promise<CourseOutline | null> {
  const [topic] = await db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.slug, topicSlug))
  if (!topic) return null

  const [course] = await db
    .select({ id: courses.id, status: courses.status })
    .from(courses)
    .where(and(eq(courses.topicId, topic.id), isNull(courses.ownerUserId)))
    .orderBy(desc(courses.createdAt))
    .limit(1)
  if (!course) return null

  const rows = await db
    .select({
      lessonId: lessons.id,
      title: lessons.title,
      orderIndex: lessons.orderIndex,
      estMinutes: lessons.estMinutes,
    })
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(lessons.orderIndex)

  const lessonList = rows.map((r) => ({ ...r, status: 'not_started' as const }))
  return {
    courseId: course.id,
    topicSlug,
    status: course.status,
    lessons: lessonList,
    nextLessonId: lessonList[0]?.lessonId ?? null,
  }
}

// A lesson view, but only if it belongs to a built-in course.
export async function getPublicLessonView(
  lessonId: string,
): Promise<LessonView | null> {
  const [row] = await db
    .select({ owner: courses.ownerUserId })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(eq(lessons.id, lessonId))
  if (!row || row.owner !== null) return null
  return getLessonView(lessonId)
}

// Grade a single MCQ from a built-in course — no logging, no XP grant, no review
// card (those are account features). Short-answer AI grading needs an account.
export async function gradeQuestionPublic(
  questionId: string,
  input: AnswerInput,
): Promise<AnswerFeedback | null> {
  const [q] = await db
    .select({
      type: quizQuestions.type,
      correctIndex: quizQuestions.correctIndex,
      explanation: quizQuestions.explanation,
      owner: courses.ownerUserId,
    })
    .from(quizQuestions)
    .innerJoin(lessonSegments, eq(lessonSegments.id, quizQuestions.segmentId))
    .innerJoin(lessons, eq(lessons.id, lessonSegments.lessonId))
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(eq(quizQuestions.id, questionId))
  if (!q || q.owner !== null) return null

  const base = {
    questionId,
    correctIndex: null as number | null,
    explanation: null as string | null,
    feedback: null as string | null,
    score: null as number | null,
  }
  if (q.type === 'short_answer') {
    return {
      ...base,
      correct: false,
      feedback: 'Sign in for AI grading of written answers.',
      xp: 0,
    }
  }
  if (q.correctIndex === null || input.selectedIndex === undefined) {
    return { ...base, correct: false, xp: 0 }
  }
  const { correct, xp } = gradeMcqAnswer(q.correctIndex, input.selectedIndex)
  return {
    ...base,
    correct,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    xp,
  }
}
