// Pure fixed-window rate-limit policy. No clock, no store — the caller supplies
// `now` and persists the bucket, so this stays unit-testable and shareable
// between an in-memory and a DB-backed store.

export type Bucket = { count: number; windowStart: number }

export type RateLimitDecision = {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

// The bucket state after recording one hit at `now`.
export function nextBucket(
  prev: Bucket | null,
  now: number,
  windowMs: number,
): Bucket {
  if (!prev || now - prev.windowStart >= windowMs) {
    return { count: 1, windowStart: now }
  }
  return { count: prev.count + 1, windowStart: prev.windowStart }
}

export function decide(
  bucket: Bucket,
  now: number,
  limit: number,
  windowMs: number,
): RateLimitDecision {
  const allowed = bucket.count <= limit
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterMs: allowed ? 0 : Math.max(0, bucket.windowStart + windowMs - now),
  }
}
