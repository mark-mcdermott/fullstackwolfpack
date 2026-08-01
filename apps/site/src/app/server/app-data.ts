import { and, count, desc, eq, gte, inArray, sql, sum } from 'drizzle-orm'
import type {
  AchievementsView,
  ActivityItem,
  AdminUser,
  RecentLesson,
  Series,
  Skill,
  Stats,
  TopicProgress,
  UserSummary,
} from '../core/app-data'
import type { Role, Tier } from '../core/access'
import { evaluateAchievements, type AchievementStats } from '../core/achievements'
import { bucketAchievements, levelProgress } from '../core/progress'
import { bucketByDay, cumulative, ratioByDay } from '../core/series'
import { db } from '../db'
import { SEED_ACHIEVEMENTS } from '../db/seed-data'
import {
  courses,
  dailyActivity,
  lessons,
  levels,
  quizAttempts,
  sessions,
  topics,
  userLessonProgress,
  userSkills,
  userTopics,
  users,
  xpEvents,
} from '../db/schema'
import { resolveActiveCourseIdsByTopic } from './course-resolver'

// Server-only data access for the logged-in app. Thin Drizzle queries that
// hand off to the pure mappers in core; the only place `db` is touched for the
// dashboard/topics/progress/achievements screens.

const num = (v: string | number | null | undefined): number => Number(v ?? 0)

export async function getUserSummary(userId: string): Promise<UserSummary> {
  const [user] = await db
    .select({ displayName: users.displayName, xp: users.xp })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) throw new Error('user not found')

  const levelRows = await db
    .select({ level: levels.level, xpRequired: levels.xpRequired })
    .from(levels)

  return {
    displayName: user.displayName,
    xp: user.xp,
    ...levelProgress(user.xp, levelRows),
  }
}

export async function getStats(userId: string): Promise<Stats> {
  const [[user], [session], [lessonsDone], [quiz]] = await Promise.all([
    db
      .select({
        xp: users.xp,
        streak: users.currentStreak,
        best: users.bestStreak,
      })
      .from(users)
      .where(eq(users.id, userId)),
    db
      .select({
        sessions: count(),
        play: sum(sessions.playMinutes),
        learn: sum(sessions.learnMinutes),
      })
      .from(sessions)
      .where(eq(sessions.userId, userId)),
    db
      .select({ n: count() })
      .from(userLessonProgress)
      .where(
        and(
          eq(userLessonProgress.userId, userId),
          eq(userLessonProgress.status, 'completed'),
        ),
      ),
    db
      .select({
        total: count(),
        correct: sum(sql`case when ${quizAttempts.isCorrect} then 1 else 0 end`),
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId)),
  ])
  if (!user) throw new Error('user not found')

  const quizTotal = num(quiz?.total)

  return {
    streak: user.streak,
    bestStreak: user.best,
    accuracy: quizTotal > 0 ? Math.round((num(quiz.correct) / quizTotal) * 100) : 0,
    hoursLearned: Math.round(num(session?.learn) / 60),
    hoursPlayed: Math.round(num(session?.play) / 60),
    lessonsCompleted: num(lessonsDone?.n),
    sessions: num(session?.sessions),
    totalXp: user.xp,
  }
}

export async function getTopicsView(userId: string): Promise<TopicProgress[]> {
  const rows = await db
    .select({
      id: topics.id,
      slug: topics.slug,
      name: topics.name,
      category: topics.category,
      difficulty: userTopics.difficulty,
      pct: userTopics.progressPct,
      done: userTopics.lessonsCompleted,
    })
    .from(topics)
    .leftJoin(
      userTopics,
      and(eq(userTopics.topicId, topics.id), eq(userTopics.userId, userId)),
    )
    .orderBy(topics.name)

  // Count only the ACTIVE track's lessons per topic (the course this user is on,
  // resolved the same way getCourseOutline picks it), so multiple difficulty
  // tracks per topic can't inflate the lesson total.
  const activeByTopic = await resolveActiveCourseIdsByTopic(userId)
  const activeCourseIds = [...activeByTopic.values()]
  const lessonCounts = activeCourseIds.length
    ? await db
        .select({ courseId: lessons.courseId, total: count(lessons.id) })
        .from(lessons)
        .where(inArray(lessons.courseId, activeCourseIds))
        .groupBy(lessons.courseId)
    : []
  const countByCourse = new Map(
    lessonCounts.map((l) => [l.courseId, num(l.total)]),
  )
  const totals = new Map(
    [...activeByTopic].map(([topicId, courseId]) => [
      topicId,
      countByCourse.get(courseId) ?? 0,
    ]),
  )

  // Difficulty of each topic's ACTIVE track (authoritative over the historic
  // user_topics.difficulty setpoint), so cards/settings show the track you're on.
  const diffRows = activeCourseIds.length
    ? await db
        .select({ id: courses.id, difficulty: courses.difficulty })
        .from(courses)
        .where(inArray(courses.id, activeCourseIds))
    : []
  const diffByCourse = new Map(diffRows.map((d) => [d.id, d.difficulty as string]))
  const diffByTopic = new Map(
    [...activeByTopic].map(([topicId, courseId]) => [
      topicId,
      diffByCourse.get(courseId),
    ]),
  )

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    category: r.category,
    difficulty: diffByTopic.get(r.id) ?? r.difficulty ?? 'beginner',
    pct: r.pct ?? 0,
    lessonsCompleted: r.done ?? 0,
    lessonsTotal: totals.get(r.id) ?? 0,
  }))
}

export async function getActivity(userId: string): Promise<{
  recentLessons: RecentLesson[]
  activity: ActivityItem[]
  skills: Skill[]
  weekActivity: string[]
}> {
  const [recentRows, activityRows, skillRows, days] = await Promise.all([
    db
      .select({
        lessonId: lessons.id,
        title: lessons.title,
        topic: topics.name,
        minutes: lessons.estMinutes,
        score: userLessonProgress.score,
        status: userLessonProgress.status,
      })
      .from(userLessonProgress)
      .innerJoin(lessons, eq(lessons.id, userLessonProgress.lessonId))
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .innerJoin(topics, eq(topics.id, courses.topicId))
      .where(eq(userLessonProgress.userId, userId))
      .orderBy(desc(userLessonProgress.completedAt))
      .limit(6),
    db
      .select({
        title: xpEvents.description,
        topic: xpEvents.refType,
        at: xpEvents.createdAt,
        xp: xpEvents.xp,
      })
      .from(xpEvents)
      .where(eq(xpEvents.userId, userId))
      .orderBy(desc(xpEvents.createdAt))
      .limit(6),
    db
      .select({ key: userSkills.skillKey, value: userSkills.score })
      .from(userSkills)
      .where(eq(userSkills.userId, userId)),
    db
      .select({ status: dailyActivity.status })
      .from(dailyActivity)
      .where(eq(dailyActivity.userId, userId))
      .orderBy(dailyActivity.date),
  ])

  return {
    recentLessons: recentRows.map((r) => ({
      lessonId: r.lessonId,
      title: r.title,
      topic: r.topic,
      minutes: r.minutes,
      score: r.score,
      status: r.status,
    })),
    activity: activityRows.map((r) => ({
      title: r.title ?? 'XP earned',
      topic: r.topic ?? '',
      at: r.at.toISOString(),
      xp: r.xp,
    })),
    skills: skillRows.map((r) => ({ key: r.key, value: r.value })),
    weekActivity: days.slice(-28).map((d) => d.status),
  }
}

// Aggregate everything the achievement engine scores against. A handful of
// cheap counts on top of the existing stats/topics reads.
async function getAchievementStats(userId: string): Promise<AchievementStats> {
  const [summary, stats, topicsView, [perfect], [highScore], [focus], [early]] =
    await Promise.all([
      getUserSummary(userId),
      getStats(userId),
      getTopicsView(userId),
      db
        .select({ n: count() })
        .from(userLessonProgress)
        .where(
          and(
            eq(userLessonProgress.userId, userId),
            eq(userLessonProgress.status, 'completed'),
            eq(userLessonProgress.score, 100),
          ),
        ),
      db
        .select({ n: count() })
        .from(userLessonProgress)
        .where(
          and(
            eq(userLessonProgress.userId, userId),
            eq(userLessonProgress.status, 'completed'),
            gte(userLessonProgress.score, 90),
          ),
        ),
      db
        .select({ n: count() })
        .from(sessions)
        .where(and(eq(sessions.userId, userId), eq(sessions.focusMode, true))),
      db
        .select({ n: count() })
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            sql`extract(hour from ${sessions.startedAt}) < 9`,
          ),
        ),
    ])

  return {
    level: summary.level,
    bestStreak: stats.bestStreak,
    hoursLearned: stats.hoursLearned,
    accuracyPct: stats.accuracy,
    focusSessions: num(focus?.n),
    highScoreQuizzes: num(highScore?.n),
    perfectLessons: num(perfect?.n),
    earlySession: num(early?.n) > 0,
    topicLessons: Object.fromEntries(
      topicsView.map((t) => [t.slug, t.lessonsCompleted]),
    ),
    completedTopics: topicsView
      .filter((t) => t.lessonsTotal > 0 && t.lessonsCompleted >= t.lessonsTotal)
      .map((t) => t.slug),
  }
}

// Badges are derived on read from the user's live stats (no separate award
// table to keep in sync), then bucketed for the Badges / Achievements screens.
export async function getAchievementsView(
  userId: string,
): Promise<AchievementsView> {
  const stats = await getAchievementStats(userId)
  const rows = evaluateAchievements([...SEED_ACHIEVEMENTS], stats)
  return bucketAchievements(
    SEED_ACHIEVEMENTS.map(({ slug, name, description, progressTarget }) => ({
      slug,
      name,
      description,
      progressTarget,
    })),
    rows,
  )
}

const SERIES_DAYS = 14

// Trailing daily series for the trend charts: cumulative XP, minutes learned,
// and quiz accuracy. Buckets raw rows with the pure core/series helpers.
export async function getSeries(userId: string): Promise<Series> {
  const now = new Date()
  const since = new Date(now.getTime() - SERIES_DAYS * 86_400_000)
  const sinceDate = since.toISOString().slice(0, 10)

  const [xpRows, quizRows, activityRows] = await Promise.all([
    db
      .select({ at: xpEvents.createdAt, value: xpEvents.xp })
      .from(xpEvents)
      .where(and(eq(xpEvents.userId, userId), gte(xpEvents.createdAt, since))),
    db
      .select({ at: quizAttempts.createdAt, correct: quizAttempts.isCorrect })
      .from(quizAttempts)
      .where(
        and(eq(quizAttempts.userId, userId), gte(quizAttempts.createdAt, since)),
      ),
    db
      .select({ date: dailyActivity.date, minutes: dailyActivity.minutesLearned })
      .from(dailyActivity)
      .where(
        and(eq(dailyActivity.userId, userId), gte(dailyActivity.date, sinceDate)),
      ),
  ])

  const xpByDay = bucketByDay(xpRows, SERIES_DAYS, now)
  const correct = bucketByDay(
    quizRows.map((r) => ({ at: r.at, value: r.correct ? 1 : 0 })),
    SERIES_DAYS,
    now,
  )
  const total = bucketByDay(
    quizRows.map((r) => ({ at: r.at, value: 1 })),
    SERIES_DAYS,
    now,
  )
  // date-only rows → anchor at midday so local-day bucketing doesn't shift.
  const minutesByDay = bucketByDay(
    activityRows.map((r) => ({ at: `${r.date}T12:00:00`, value: r.minutes })),
    SERIES_DAYS,
    now,
  )

  return {
    days: SERIES_DAYS,
    xpCumulative: cumulative(xpByDay),
    minutesByDay,
    accuracyByDay: ratioByDay(correct, total),
  }
}

// ---- Admin (caller must gate on admin.access) ----

export async function getAdminUsers(): Promise<AdminUser[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      tier: users.tier,
      xp: users.xp,
      level: users.level,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
}

export async function updateUserAccess(
  userId: string,
  patch: { role?: Role; tier?: Tier },
): Promise<void> {
  if (patch.role === undefined && patch.tier === undefined) return
  await db.update(users).set(patch).where(eq(users.id, userId))
}
