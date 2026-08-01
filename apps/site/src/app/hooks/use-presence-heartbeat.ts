import { useEffect } from 'react'
import { api } from '@/api-client'

// Keeps the signed-in user's presence fresh app-wide: bumps `lastActiveAt` on
// mount and every interval while the app is open (and when the tab regains
// focus). The presence window (core/social) is longer than this cadence, so a
// user reads as "online" between beats. Best-effort — failures are ignored.
const HEARTBEAT_MS = 45_000

export function usePresenceHeartbeat() {
  useEffect(() => {
    const beat = () => {
      void api.social.heartbeat().catch(() => {})
    }
    beat()
    const timer = setInterval(beat, HEARTBEAT_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') beat()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
