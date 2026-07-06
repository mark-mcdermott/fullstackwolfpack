import { useEffect } from 'react'
import { api } from '@/api-client'
import { gameKey, type PlaytimeSource } from '@/core/playtime'

// How often a long, uninterrupted session banks its time server-side, so a hard
// tab-crash loses at most this much. Normal exits flush immediately on unmount.
const FLUSH_INTERVAL_MS = 60_000
const MAX_FLUSH_SECONDS = 7200

type TrackableGame = { source: PlaytimeSource; id: string; title: string }

// Records how long a game screen stays open, in deltas, keyed by the game. Mount
// it from the ROM / embed player. Time is wall-clock (mount→unmount); time while
// the tab is hidden is dropped, since that isn't really play.
export function usePlaytimeTracker(game: TrackableGame): void {
  const key = gameKey(game)
  const { source, title } = game

  useEffect(() => {
    let last = Date.now()

    const send = (seconds: number, beacon: boolean) => {
      const body = {
        gameId: key,
        source,
        title,
        seconds: Math.min(seconds, MAX_FLUSH_SECONDS),
      }
      // On tab-hide/unload a normal fetch may be cancelled — beacon survives it.
      if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/me/playtime',
          new Blob([JSON.stringify(body)], { type: 'application/json' }),
        )
      } else {
        void api.arcade.recordPlaytime(body).catch(() => {})
      }
    }

    // Bank the seconds since the last flush and advance the marker. Sub-second
    // deltas (e.g. React's StrictMode remount) are dropped, so nothing double-counts.
    const flush = (beacon = false) => {
      const now = Date.now()
      const seconds = Math.round((now - last) / 1000)
      last = now
      if (seconds >= 1) send(seconds, beacon)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush(true)
      // Coming back into view: reset the clock so the hidden gap isn't counted.
      else last = Date.now()
    }

    const onPageHide = () => flush(true)

    const tick = () => {
      if (document.visibilityState === 'visible') flush(false)
    }

    const id = setInterval(tick, FLUSH_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      flush(false)
    }
  }, [key, source, title])
}
