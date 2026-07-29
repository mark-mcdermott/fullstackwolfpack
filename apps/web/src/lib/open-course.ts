import { api } from '@/api-client'
import type { RecentLesson, TopicProgress } from '@/core/app-data'

// Resolve a topic's course to the player path for its next unfinished lesson.
// Throws if the topic has no course/lessons yet. Kept router-agnostic so callers
// just `navigate(await nextLessonPath(slug))`.
export async function nextLessonPath(topicSlug: string): Promise<string> {
  const outline = await api.data.course(topicSlug)
  if (!outline.nextLessonId) throw new Error('This course has no lessons yet.')
  return `/app/learn/${outline.nextLessonId}`
}

// Guest version: reads the public course outline and returns the guest player
// path (/learn/:id). Guests have no per-user progress, so "next" is the first.
export async function guestNextLessonPath(topicSlug: string): Promise<string> {
  const outline = await api.public.course(topicSlug)
  if (!outline.nextLessonId) throw new Error('This course has no lessons yet.')
  return `/learn/${outline.nextLessonId}`
}

// Pick the single topic slug to *continue* — for a topic-agnostic entry point
// like the focus timer's "Learn now". Recency wins: match the newest recent
// lesson (ordered completedAt-desc, but it only carries the topic display name)
// back to an active topic to recover its slug. Failing that, prefer an
// in-progress course, else the first active one. Null ⇒ nothing to resume.
// Pure so it's unit-tested without the network.
export function pickContinueSlug(
  focus: TopicProgress[],
  recentLessons: RecentLesson[],
): string | null {
  const active = focus.filter((t) => t.lessonsTotal > 0)
  if (active.length === 0) return null
  for (const r of recentLessons) {
    const match = active.find((t) => t.name === r.topic)
    if (match) return match.slug
  }
  const inProgress = active.find(
    (t) => t.lessonsCompleted > 0 && t.lessonsCompleted < t.lessonsTotal,
  )
  return (inProgress ?? active[0]).slug
}

// Resolve the player path for the course the user should continue, or null when
// there's nothing to resume (caller falls back to the Topics page).
export async function continueLearningPath(): Promise<string | null> {
  const { focus, recentLessons } = await api.data.dashboard()
  const slug = pickContinueSlug(focus, recentLessons)
  if (!slug) return null
  try {
    return await nextLessonPath(slug)
  } catch {
    return null
  }
}

// Deep-link to a topic's card on the Topics page (scrolled to + highlighted).
// Used by clickable topic names on Progress and the Dashboard's current focus.
// Single source of truth for the `?topic=` param the Topics page reads.
export function topicCoursePath(topicSlug: string): string {
  return `/app/topics?topic=${encodeURIComponent(topicSlug)}`
}
