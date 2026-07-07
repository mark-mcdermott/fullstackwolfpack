import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api-client'
import type { GamePlaytime } from '@/core/playtime'
import { useAuth } from '@/hooks/auth-context'

// The user's per-title playtime, keyed by `gameKey` for O(1) tile lookup, plus
// the raw list (most-recently-played first) for ordering the gallery. Read once
// when the gallery mounts; the player writes it as the user plays.
export function usePlaytime(): {
  byGame: Map<string, GamePlaytime>
  recent: GamePlaytime[]
} {
  const loggedIn = !!useAuth().user
  const [recent, setRecent] = useState<GamePlaytime[]>([])

  useEffect(() => {
    if (!loggedIn) return // guests have no server-side playtime
    void api.arcade
      .playtime()
      .then(setRecent)
      .catch(() => {})
  }, [loggedIn])

  const byGame = useMemo(
    () => new Map(recent.map((p) => [p.gameId, p])),
    [recent],
  )

  return { byGame, recent }
}
