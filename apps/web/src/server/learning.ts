import { and, eq, inArray, sql, sum } from 'drizzle-orm'
import type { CourseOutline } from '../core/app-data'
import { parseExerciseTests } from '../core/exercise'
import {
  gradeMcqAnswer,
  lessonScore,
  topicProgressPct,
  xpForLesson,
  xpForQuiz,
} from '../core/learning'
import type {
  AnswerFeedback,
  ExerciseView,
  LessonCompletion,
  LessonView,
  QuestionView,
  SegmentView,
} from '../core/lesson-view'
import { db } from '../db'
import {
  courses,
  exercises,
  lessons,
  lessonSegments,
  quizAttempts,
  quizQuestions,
  reviewCards,
  topics,
  userLessonProgress,
  userTopics,
} from '../db/schema'
import { resolveActiveCourse } from './course-resolver'
import { gradeAnswer } from './grader'
import { grantXp, logActivityAndStreak } from './rewards'
import { seedReviewCard } from './review'

// Server-only writes + reads for the learning loop. Thin Drizzle that composes the
// pure, unit-tested math in core/learning.ts — the only place `db` is touched for the
// lesson player. Mirrors the style of server/app-data.ts.

const num = (v: string | number | null | undefined): number => Number(v ?? 0)

// ---- Read: the lesson tree the player renders (answer keys stripped) ----

export async function getLessonView(lessonId: string): Promise<LessonView | null> {
  const [head] = await db
    .select({
      lessonId: lessons.id,
      courseId: lessons.courseId,
      title: lessons.title,
      estMinutes: lessons.estMinutes,
      topic: topics.name,
      topicSlug: topics.slug,
    })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .innerJoin(topics, eq(topics.id, courses.topicId))
    .where(eq(lessons.id, lessonId))
  if (!head) return null

  const segRows = await db
    .select()
    .from(lessonSegments)
    .where(eq(lessonSegments.lessonId, lessonId))
    .orderBy(lessonSegments.orderIndex)
  if (segRows.length === 0) return null // not ready (e.g. still generating)

  const segIds = segRows.map((s) => s.id)
  const qRows = await db
    .select()
    .from(quizQuestions)
    .where(inArray(quizQuestions.segmentId, segIds))

  const bySegment = new Map<string, QuestionView[]>()
  for (const q of qRows) {
    const list = bySegment.get(q.segmentId) ?? []
    // Only the prompt + options reach the client — never correctIndex/expectedAnswer.
    list.push({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? undefined,
    })
    bySegment.set(q.segmentId, list)
  }

  // Code exercises for the player's in-browser runner (Phase 4). Tests run
  // client-side by design, so they (and the revealable hint/solution) are included.
  const exRows = await db
    .select()
    .from(exercises)
    .where(inArray(exercises.segmentId, segIds))
  const exBySegment = new Map<string, ExerciseView>()
  for (const e of exRows) {
    exBySegment.set(e.segmentId, {
      id: e.id,
      prompt: e.prompt,
      starterCode: e.starterCode ?? '',
      tests: parseExerciseTests(e.tests),
      hint: e.hint ?? null,
      solution: e.solution ?? null,
    })
  }

  const segments: SegmentView[] = segRows.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    markdown: (s.content as { markdown?: string } | null)?.markdown ?? '',
    estMinutes: s.estMinutes,
    questions: bySegment.get(s.id) ?? [],
    exercise: exBySegment.get(s.id) ?? null,
  }))

  return {
    lessonId: head.lessonId,
    courseId: head.courseId,
    topic: head.topic,
    topicSlug: head.topicSlug,
    title: head.title,
    estMinutes: head.estMinutes,
    segments,
  }
}

// ---- Read: a topic's generated course + this user's per-lesson progress ----

export async function getCourseOutline(
  userId: string,
  topicSlug: string,
): Promise<CourseOutline | null> {
  const [topic] = await db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.slug, topicSlug))
  if (!topic) return null

  // The user's active track for this topic (their chosen course, else newest).
  const course = await resolveActiveCourse(userId, topic.id)
  if (!course) return null

  const rows = await db
    .select({
      lessonId: lessons.id,
      title: lessons.title,
      orderIndex: lessons.orderIndex,
      estMinutes: lessons.estMinutes,
      status: userLessonProgress.status,
    })
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

  const lessonList = rows.map((r) => ({
    lessonId: r.lessonId,
    title: r.title,
    orderIndex: r.orderIndex,
    estMinutes: r.estMinutes,
    status: r.status ?? 'not_started',
  }))
  // Resume at the first unfinished lesson; if all done, the first (for review).
  const next =
    lessonList.find((l) => l.status !== 'completed') ?? lessonList[0]

  return {
    courseId: course.id,
    topicSlug,
    status: course.status,
    lessons: lessonList,
    nextLessonId: next?.lessonId ?? null,
  }
}

// ---- Write: grade a single answer (MCQ or short-answer) ----

export type AnswerInput = { selectedIndex?: number; answerText?: string }

export async function submitAnswer(
  userId: string,
  questionId: string,
  input: AnswerInput,
): Promise<AnswerFeedback | null> {
  const [q] = await db
    .select({
      type: quizQuestions.type,
      prompt: quizQuestions.prompt,
      correctIndex: quizQuestions.correctIndex,
      expectedAnswer: quizQuestions.expectedAnswer,
      explanation: quizQuestions.explanation,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.id, questionId))
  if (!q) return null

  return q.type === 'short_answer'
    ? gradeShortAnswer(userId, questionId, q, input.answerText)
    : gradeMcq(userId, questionId, q, input.selectedIndex)
}

type QuestionRow = {
  correctIndex: number | null
  expectedAnswer: string | null
  explanation: string | null
  prompt: string
}

// Seeding a spaced-repetition card is a best-effort side effect of grading —
// never let it fail the answer itself (e.g. if the review tables are missing or
// a transient DB error occurs, the learner still gets their result + XP).
async function seedReviewCardSafely(
  userId: string,
  questionId: string,
  correct: boolean,
): Promise<void> {
  try {
    await seedReviewCard(userId, questionId, correct)
  } catch (err) {
    console.error('seedReviewCard failed (non-fatal):', err)
  }
}

async function gradeMcq(
  userId: string,
  questionId: string,
  q: QuestionRow,
  selectedIndex: number | undefined,
): Promise<AnswerFeedback> {
  // Ungradable (no key set, or no choice) → don't record an attempt (skews stats).
  if (q.correctIndex === null || selectedIndex === undefined) {
    return {
      questionId, correct: false, correctIndex: null,
      explanation: null, feedback: null, score: null, xp: 0,
    }
  }

  const { correct, xp } = gradeMcqAnswer(q.correctIndex, selectedIndex)
  await db.insert(quizAttempts).values({ userId, questionId, selectedIndex, isCorrect: correct })
  await grantXp(userId, {
    type: 'quiz', xp, refType: 'question', refId: questionId,
    description: correct ? 'Correct answer' : 'Quiz attempt',
  })
  await seedReviewCardSafely(userId, questionId, correct)

  return {
    questionId, correct, correctIndex: q.correctIndex,
    explanation: q.explanation ?? null, feedback: null, score: null, xp,
  }
}

async function gradeShortAnswer(
  userId: string,
  questionId: string,
  q: QuestionRow,
  answerText: string | undefined,
): Promise<AnswerFeedback> {
  if (!answerText || q.expectedAnswer === null) {
    return {
      questionId, correct: false, correctIndex: null,
      explanation: null,
      feedback: q.expectedAnswer === null ? 'This question has no reference answer yet.' : null,
      score: 0, xp: 0,
    }
  }

  // AI (or heuristic-fallback) grade against the reference answer (§5.3).
  const grade = await gradeAnswer(userId, {
    prompt: q.prompt,
    expectedAnswer: q.expectedAnswer,
    learnerAnswer: answerText,
  })
  const xp = xpForQuiz(grade.correct)

  await db.insert(quizAttempts).values({
    userId, questionId, answerText, isCorrect: grade.correct, aiFeedback: grade.feedback,
  })
  await grantXp(userId, {
    type: 'quiz', xp, refType: 'question', refId: questionId,
    description: grade.correct ? 'Correct answer' : 'Quiz attempt',
  })
  await seedReviewCardSafely(userId, questionId, grade.correct)

  return {
    questionId, correct: grade.correct, correctIndex: null,
    explanation: q.explanation ?? null, feedback: grade.feedback, score: grade.score, xp,
  }
}

// ---- Write: complete a lesson (score → progress → XP → streak) ----

export async function completeLesson(
  userId: string,
  lessonId: string,
  now: Date = new Date(),
): Promise<LessonCompletion | null> {
  const [lesson] = await db
    .select({ topicId: courses.topicId })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(eq(lessons.id, lessonId))
  if (!lesson) return null

  // Score = the user's correct answers over this lesson's quiz questions.
  const questionIds = (
    await db
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .innerJoin(lessonSegments, eq(lessonSegments.id, quizQuestions.segmentId))
      .where(eq(lessonSegments.lessonId, lessonId))
  ).map((r) => r.id)

  let correct = 0
  const total = questionIds.length
  if (total > 0) {
    const [agg] = await db
      .select({
        correct: sum(sql`case when ${quizAttempts.isCorrect} then 1 else 0 end`),
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          inArray(quizAttempts.questionId, questionIds),
        ),
      )
    correct = num(agg?.correct)
  }
  const score = lessonScore(correct, total)

  // Was it already completed? If so, refresh the score but don't re-award XP/streak
  // (so re-reviewing a lesson can't farm XP).
  const [existing] = await db
    .select({ status: userLessonProgress.status })
    .from(userLessonProgress)
    .where(
      and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.lessonId, lessonId),
      ),
    )
  const firstCompletion = existing?.status !== 'completed'

  await db
    .insert(userLessonProgress)
    .values({
      userId,
      lessonId,
      status: 'completed',
      score,
      resumePct: 100,
      completedAt: now,
    })
    .onConflictDoUpdate({
      target: [userLessonProgress.userId, userLessonProgress.lessonId],
      set: { status: 'completed', score, resumePct: 100, completedAt: now },
    })

  await recomputeTopicProgress(userId, lesson.topicId, now)

  let xp = 0
  if (firstCompletion) {
    const lessonXp = xpForLesson(score)
    await grantXp(userId, {
      type: 'lesson_completed',
      xp: lessonXp,
      refType: 'lesson',
      refId: lessonId,
      description: 'Lesson completed',
    })
    xp = lessonXp + (await logActivityAndStreak(userId, now, { lessonsCompleted: 1 }))
  }

  return { score, correct, total, xp }
}

// Recompute a topic's completed-lesson count + progress % for this user.
export async function recomputeTopicProgress(
  userId: string,
  topicId: string,
  now: Date,
): Promise<void> {
  // Scope the rollup to the ACTIVE track's lessons — with multiple difficulty
  // tracks per topic, counting across all of them would inflate the total.
  const active = await resolveActiveCourse(userId, topicId)
  const activeCourseId = active?.id

  const [totals] = activeCourseId
    ? await db
        .select({ total: sql<number>`count(*)` })
        .from(lessons)
        .where(eq(lessons.courseId, activeCourseId))
    : [{ total: 0 }]
  const total = num(totals?.total)

  const [doneAgg] = activeCourseId
    ? await db
        .select({ done: sql<number>`count(*)` })
        .from(userLessonProgress)
        .innerJoin(lessons, eq(lessons.id, userLessonProgress.lessonId))
        .where(
          and(
            eq(userLessonProgress.userId, userId),
            eq(lessons.courseId, activeCourseId),
            eq(userLessonProgress.status, 'completed'),
          ),
        )
    : [{ done: 0 }]
  const done = num(doneAgg?.done)
  const pct = topicProgressPct(done, total)

  await db
    .insert(userTopics)
    .values({ userId, topicId, lessonsCompleted: done, progressPct: pct, lastViewedAt: now })
    .onConflictDoUpdate({
      target: [userTopics.userId, userTopics.topicId],
      set: { lessonsCompleted: done, progressPct: pct, lastViewedAt: now },
    })
}

// ---- Write: reset one topic's progress for a user ----

// Clear the user's per-lesson progress, quiz attempts, and review cards for every
// lesson/question under this topic's courses (built-in + their own tracks), then
// zero the topic rollup. Deliberately topic-scoped: keeps global XP/streak and
// the chosen track (difficulty/activeCourseId) — a "start this course over", not
// an account wipe. Sequential deletes (no cross-statement transaction, matching
// completeLesson); the op is idempotent, so a retry finishes a partial reset.
export async function resetTopicProgress(
  userId: string,
  topicSlug: string,
): Promise<boolean> {
  const [topic] = await db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.slug, topicSlug))
  if (!topic) return false

  const lessonIds = (
    await db
      .select({ id: lessons.id })
      .from(lessons)
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .where(eq(courses.topicId, topic.id))
  ).map((r) => r.id)

  const questionIds = lessonIds.length
    ? (
        await db
          .select({ id: quizQuestions.id })
          .from(quizQuestions)
          .innerJoin(
            lessonSegments,
            eq(lessonSegments.id, quizQuestions.segmentId),
          )
          .where(inArray(lessonSegments.lessonId, lessonIds))
      ).map((r) => r.id)
    : []

  if (lessonIds.length) {
    await db
      .delete(userLessonProgress)
      .where(
        and(
          eq(userLessonProgress.userId, userId),
          inArray(userLessonProgress.lessonId, lessonIds),
        ),
      )
  }

  if (questionIds.length) {
    await db
      .delete(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          inArray(quizAttempts.questionId, questionIds),
        ),
      )
    // reviewCards.itemId holds the question id (not an FK); reviewLogs cascade.
    await db
      .delete(reviewCards)
      .where(
        and(
          eq(reviewCards.userId, userId),
          eq(reviewCards.itemType, 'quiz_question'),
          inArray(reviewCards.itemId, questionIds),
        ),
      )
  }

  // Zero the rollup but keep the track selection (difficulty/activeCourseId).
  await db
    .update(userTopics)
    .set({ lessonsCompleted: 0, progressPct: 0, lastViewedAt: null })
    .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, topic.id)))

  return true
}
