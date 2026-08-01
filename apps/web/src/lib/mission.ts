import type { Difficulty } from '@/core/generation'

// The chosen session, handed over by the launcher (or the hero's quick-start),
// and persisted so a mission survives a refresh / "take a break".
export type MissionSession = {
  gameId: string
  gameTitle: string
  skillName: string
  topicSlug: string
  difficulty: Difficulty
  playMinutes: number
  learnMinutes: number
  learnFirst: boolean
  estimatedXp: number
}

// How a mission/session is named everywhere it's referred to:
// "<game> / <skill level> <skill name>" — e.g. "Tobu Tobu Girl / Intermediate JavaScript".
export function missionName(session: MissionSession): string {
  const level =
    session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)
  return `${session.gameTitle} / ${level} ${session.skillName}`
}

// Fallback session (mirrors the guest launcher's defaults) for when a mission
// starts without an explicit selection handed over.
export const DEFAULT_SESSION: MissionSession = {
  gameId: 'tobu-tobu-girl',
  gameTitle: 'Tobu Tobu Girl',
  skillName: 'JavaScript',
  topicSlug: 'javascript',
  difficulty: 'intermediate',
  playMinutes: 25,
  learnMinutes: 5,
  learnFirst: false,
  estimatedXp: 240,
}
