import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api-client'
import type { GamePlaytime } from '@/core/playtime'

// The user's per-title playtime, keyed by `gameKey` for O(1) tile lookup, plus
// the raw list (most-recently-played first) for ordering the gallery. Read once
// when the gallery mounts; the player writes it as the user plays.
export function usePlaytime(): {
  byGame: Map<string, GamePlaytime>
  recent: GamePlaytime[]
} {
  const [recent, setRecent] = useState<GamePlaytime[]>([])

  useEffect(() => {
    void api.arcade
      .playtime()
      .then(setRecent)
      .catch(() => {})
  }, [])

  const byGame = useMemo(
    () => new Map(recent.map((p) => [p.gameId, p])),
    [recent],
  )

  return { byGame, recent }
}
