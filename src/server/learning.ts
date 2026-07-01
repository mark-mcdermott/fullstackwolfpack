import { and, desc, eq, inArray, sql, sum } from 'drizzle-orm'
import {
  gradeMcqAnswer,
  lessonScore,
  nextStreak,
  topicProgressPct,
  xpForLesson,
  xpForStreakDay,
} from '../core/learning'
import type {
  AnswerFeedback,
  LessonCompletion,
  LessonView,
  QuestionView,
  SegmentView,
} from '../core/lesson-view'
import { db } from '../db'
import {
  courses,
  dailyActivity,
  lessons,
  lessonSegments,
  quizAttempts,
  quizQuestions,
  topics,
  userLessonProgress,
  userTopics,
  users,
  xpEvents,
} from '../db/schema'
import { seedReviewCard } from './review'

// Server-only writes + reads for the learning loop. Thin Drizzle that composes the
// pure, unit-tested math in core/learning.ts — the only place `db` is touched for the
// lesson player. Mirrors the style of server/app-data.ts.

const num = (v: string | number | null | undefined): number => Number(v ?? 0)
const dateStr = (d: Date): string => d.toISOString().slice(0, 10)

type XpGrant = {
  type: 'quiz' | 'lesson_completed' | 'streak'
  xp: number
  refType?: string
  refId?: string
  description?: string
}

// Append an XP ledger row and bump the cached total on `users`.
async function grantXp(userId: string, e: XpGrant): Promise<void> {
  if (e.xp === 0) return
  await db.insert(xpEvents).values({
    userId,
    type: e.type,
    xp: e.xp,
    refType: e.refType ?? null,
    refId: e.refId ?? null,
    description: e.description ?? null,
  })
  await db
    .update(users)
    .set({ xp: sql`${users.xp} + ${e.xp}` })
    .where(eq(users.id, userId))
}

// ---- Read: the lesson tree the player renders (answer keys stripped) ----

export async function getLessonView(lessonId: string): Promise<LessonView | null> {
  const [head] = await db
    .select({
      lessonId: lessons.id,
      courseId: lessons.courseId,
      title: lessons.title,
      estMinutes: lessons.estMinutes,
      topic: topics.name,
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

  const segments: SegmentView[] = segRows.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    markdown: (s.content as { markdown?: string } | null)?.markdown ?? '',
    estMinutes: s.estMinutes,
    questions: bySegment.get(s.id) ?? [],
  }))

  return {
    lessonId: head.lessonId,
    courseId: head.courseId,
    topic: head.topic,
    title: head.title,
    estMinutes: head.estMinutes,
    segments,
  }
}

// ---- Write: grade a single answer ----

export async function submitAnswer(
  userId: string,
  questionId: string,
  selectedIndex: number,
): Promise<AnswerFeedback | null> {
  const [q] = await db
    .select({
      type: quizQuestions.type,
      correctIndex: quizQuestions.correctIndex,
      explanation: quizQuestions.explanation,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.id, questionId))
  if (!q) return null

  // Phase 1 grades MCQ; short-answer needs the AI grader (a later phase). Don't
  // record an ungradable attempt (it would skew accuracy stats).
  if (q.type !== 'mcq' || q.correctIndex === null) {
    return { questionId, correct: false, correctIndex: null, explanation: null, xp: 0 }
  }

  const { correct, xp } = gradeMcqAnswer(q.correctIndex, selectedIndex)

  await db.insert(quizAttempts).values({
    userId,
    questionId,
    selectedIndex,
    isCorrect: correct,
  })
  await grantXp(userId, {
    type: 'quiz',
    xp,
    refType: 'question',
    refId: questionId,
    description: correct ? 'Correct answer' : 'Quiz attempt',
  })
  // First answer schedules the question's first spaced-repetition review.
  await seedReviewCard(userId, questionId, correct)

  return {
    questionId,
    correct,
    correctIndex: q.correctIndex,
    explanation: q.explanation ?? null,
    xp,
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
    xp = lessonXp + (await bumpStreak(userId, now))
  }

  return { score, correct, total, xp }
}

// Recompute a topic's completed-lesson count + progress % for this user.
async function recomputeTopicProgress(
  userId: string,
  topicId: string,
  now: Date,
): Promise<void> {
  const [totals] = await db
    .select({ total: sql<number>`count(*)` })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(eq(courses.topicId, topicId))
  const total = num(totals?.total)

  const [doneAgg] = await db
    .select({ done: sql<number>`count(*)` })
    .from(userLessonProgress)
    .innerJoin(lessons, eq(lessons.id, userLessonProgress.lessonId))
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(
      and(
        eq(userLessonProgress.userId, userId),
        eq(courses.topicId, topicId),
        eq(userLessonProgress.status, 'completed'),
      ),
    )
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

// Advance the daily streak. Returns the streak XP granted (0 if already active today).
async function bumpStreak(userId: string, now: Date): Promise<number> {
  const [u] = await db
    .select({ currentStreak: users.currentStreak, bestStreak: users.bestStreak })
    .from(users)
    .where(eq(users.id, userId))
  if (!u) return 0

  // Last active day = the most recent daily_activity row (read before we upsert today).
  const [last] = await db
    .select({ date: dailyActivity.date })
    .from(dailyActivity)
    .where(eq(dailyActivity.userId, userId))
    .orderBy(desc(dailyActivity.date))
    .limit(1)

  const result = nextStreak(last?.date ?? null, now, u.currentStreak)

  await db
    .insert(dailyActivity)
    .values({ userId, date: dateStr(now), status: 'completed', lessonsCompleted: 1 })
    .onConflictDoUpdate({
      target: [dailyActivity.userId, dailyActivity.date],
      set: {
        status: 'completed',
        lessonsCompleted: sql`${dailyActivity.lessonsCompleted} + 1`,
      },
    })

  if (!result.isNewDay) return 0 // already counted today

  await db
    .update(users)
    .set({
      currentStreak: result.streak,
      bestStreak: Math.max(u.bestStreak, result.streak),
    })
    .where(eq(users.id, userId))

  const streakXp = xpForStreakDay(result.streak)
  await grantXp(userId, {
    type: 'streak',
    xp: streakXp,
    description: `Day ${result.streak} streak`,
  })
  return streakXp
}
