// The game + topic the current focus session is about, chosen in the launcher.
// Kept in localStorage (not the timer's persisted session) so the arcade knows
// which game to launch and the timer dock's "Learn now" targets the right topic
// across navigations/reloads. Cleared when a session ends.

const KEY = 'fw:session:target'

export type SessionTarget = {
  gameId?: string
  topicSlug?: string
}

export function setSessionTarget(target: SessionTarget): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(target))
  } catch {
    /* storage disabled — the launcher's navigation still works this session */
  }
}

export function getSessionTarget(): SessionTarget {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SessionTarget) : {}
  } catch {
    return {}
  }
}

export function clearSessionTarget(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
