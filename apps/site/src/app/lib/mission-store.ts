import { z } from 'zod'
import type { MissionSession } from '@/lib/mission'

// The active mission's details, mirrored to localStorage alongside the timer's
// own persisted session — so a refresh (or a "take a break" ✕) can rebuild the
// mission view exactly, not just the clock. Cleared when the mission ends.

const KEY = 'fw:mission'

const missionSchema = z.object({
  gameId: z.string(),
  gameTitle: z.string(),
  skillName: z.string(),
  topicSlug: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  playMinutes: z.number(),
  learnMinutes: z.number(),
  learnFirst: z.boolean(),
  estimatedXp: z.number(),
})

export function saveMission(session: MissionSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    /* storage disabled — the mission just won't survive a reload */
  }
}

export function loadMission(): MissionSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = missionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function clearMission(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
