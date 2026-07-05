import { api } from '@/api-client'

// Resolve a topic's course to the player path for its next unfinished lesson.
// Throws if the topic has no course/lessons yet. Kept router-agnostic so callers
// just `navigate(await nextLessonPath(slug))`.
export async function nextLessonPath(topicSlug: string): Promise<string> {
  const outline = await api.data.course(topicSlug)
  if (!outline.nextLessonId) throw new Error('This course has no lessons yet.')
  return `/app/learn/${outline.nextLessonId}`
}

// Deep-link to a topic's card on the Topics page (scrolled to + highlighted).
// Used by clickable topic names on Progress and the Dashboard's current focus.
// Single source of truth for the `?topic=` param the Topics page reads.
export function topicCoursePath(topicSlug: string): string {
  return `/app/topics?topic=${encodeURIComponent(topicSlug)}`
}
