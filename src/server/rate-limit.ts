import { sql } from 'drizzle-orm'
import { decide, type RateLimitDecision } from '../core/rate-limit'
import { db } from '../db'
import { authRateLimits } from '../db/schema'

export type RateLimitConfig = { limit: number; windowMs: number }

// Record one hit against `key` and return the decision. The counter update is a
// single atomic statement so concurrent hits (across serverless instances)
// don't race: inside the window it increments; once the window has elapsed it
// resets to 1. Mirrors core/rate-limit's nextBucket in SQL.
export async function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitConfig,
): Promise<RateLimitDecision> {
  const now = Date.now()
  const cutoff = new Date(now - windowMs)
  const nowDate = new Date(now)

  const [row] = await db
    .insert(authRateLimits)
    .values({ key, count: 1, windowStart: nowDate })
    .onConflictDoUpdate({
      target: authRateLimits.key,
      set: {
        count: sql`case when ${authRateLimits.windowStart} > ${cutoff} then ${authRateLimits.count} + 1 else 1 end`,
        windowStart: sql`case when ${authRateLimits.windowStart} > ${cutoff} then ${authRateLimits.windowStart} else ${nowDate} end`,
      },
    })
    .returning({
      count: authRateLimits.count,
      windowStart: authRateLimits.windowStart,
    })

  return decide(
    { count: row.count, windowStart: row.windowStart.getTime() },
    now,
    limit,
    windowMs,
  )
}
