import { eq, isNull, or, type SQL } from 'drizzle-orm'
import { courses } from '../db/schema'

// A course is visible to a user if they own it (their AI-generated course) or
// it's shared/built-in (`ownerUserId` is null). The single source of truth for
// that scope — used by BOTH the topics lesson-count (getTopicsView) and the
// course-outline read (getCourseOutline) so they can never drift apart. When
// they did, a topic showed lessons + "Start learning" from another user's
// course but opening it 404'd ("no course for topic").
export function visibleCourseFilter(userId: string): SQL | undefined {
  return or(eq(courses.ownerUserId, userId), isNull(courses.ownerUserId))
}
