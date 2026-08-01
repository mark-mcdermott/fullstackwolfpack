import { desc, eq } from 'drizzle-orm'
import { averageEtaMs, DEFAULT_GENERATION_ETA_MS } from '../core/generation'
import { db } from '../db'
import { generationTimings } from '../db/schema'

// How many recent successful generations feed the running-average ETA.
const ETA_SAMPLE_SIZE = 20

// Best-effort metric write. Must never break enrollment — the table may not
// exist until `db:push` runs, so a failure is swallowed.
export async function recordGenerationTiming(row: {
  topicId?: string
  difficulty?: string
  durationMs: number
  succeeded: boolean
}): Promise<void> {
  try {
    await db.insert(generationTimings).values({
      topicId: row.topicId ?? null,
      difficulty: row.difficulty ?? null,
      durationMs: Math.max(0, Math.round(row.durationMs)),
      succeeded: row.succeeded,
    })
  } catch {
    // ignore — a missing metrics table or transient DB error must not surface.
  }
}

// The expected generation duration: the mean of recent successful runs, or the
// default when there are none (or the table isn't there yet).
export async function getGenerationEta(): Promise<{
  etaMs: number
  samples: number
}> {
  try {
    const rows = await db
      .select({ durationMs: generationTimings.durationMs })
      .from(generationTimings)
      .where(eq(generationTimings.succeeded, true))
      .orderBy(desc(generationTimings.createdAt))
      .limit(ETA_SAMPLE_SIZE)
    return {
      etaMs: averageEtaMs(rows.map((r) => r.durationMs)),
      samples: rows.length,
    }
  } catch {
    return { etaMs: DEFAULT_GENERATION_ETA_MS, samples: 0 }
  }
}
