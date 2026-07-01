import { and, count, desc, eq, sql, sum } from 'drizzle-orm'
import type {
  AchievementsView,
  ActivityItem,
  RecentLesson,
  Skill,
  Stats,
  TopicProgress,
  UserSummary,
} from '../core/app-data'
import { bucketAchievements, levelProgress } from '../core/progress'
import { db } from '../db'
import {
  achievements,
  courses,
  dailyActivity,
  lessons,
  levels,
  quizAttempts,
  sessions,
  topics,
  userAchievements,
  userLessonProgress,
  userSkills,
  userTopics,
  users,
  xpEvents,
} from '../db/schema'

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

  const totals = new Map(
    (
      await db
        .select({ topicId: courses.topicId, total: count(lessons.id) })
        .from(courses)
        .leftJoin(lessons, eq(lessons.courseId, courses.id))
        .groupBy(courses.topicId)
    ).map((t) => [t.topicId, num(t.total)]),
  )

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    category: r.category,
    difficulty: r.difficulty ?? 'beginner',
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

export async function getAchievementsView(
  userId: string,
): Promise<AchievementsView> {
  const catalog = await db
    .select({
      id: achievements.id,
      slug: achievements.slug,
      name: achievements.name,
      description: achievements.description,
      progressTarget: achievements.progressTarget,
    })
    .from(achievements)
    .orderBy(achievements.name)

  const rows = await db
    .select({
      achievementId: userAchievements.achievementId,
      status: userAchievements.status,
      progressCurrent: userAchievements.progressCurrent,
      earnedAt: userAchievements.earnedAt,
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))

  const slugById = new Map(catalog.map((c) => [c.id, c.slug]))
  const userRows = rows
    .filter((r) => slugById.has(r.achievementId))
    .map((r) => ({
      achievementSlug: slugById.get(r.achievementId) as string,
      status: r.status,
      progressCurrent: r.progressCurrent,
      earnedAt: r.earnedAt,
    }))

  return bucketAchievements(
    catalog.map(({ slug, name, description, progressTarget }) => ({
      slug,
      name,
      description,
      progressTarget,
    })),
    userRows,
  )
}
