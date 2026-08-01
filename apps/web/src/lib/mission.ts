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

// The hero "Start your first mission" quick-start uses these (mirrors the guest
// launcher's defaults) when no explicit selection is handed over.
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
