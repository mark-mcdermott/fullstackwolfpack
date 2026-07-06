import { useEffect, useRef, useState } from 'react'
import type { RealtimeMessage } from '@/core/social'
import { connectRealtime } from '@/lib/realtime'

// Subscribes to realtime DM push for `userId`, returning whether realtime is
// connected. False when disabled server-side (no ABLY_API_KEY) or not yet
// connected — the caller keeps polling as the source of truth / safety net.
// onEvent is held in a ref so re-renders don't tear down the connection.
export function useRealtime(
  userId: string | undefined,
  onEvent: (e: RealtimeMessage) => void,
): boolean {
  const [connected, setConnected] = useState(false)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!userId) return
    let cleanup = () => {}
    let cancelled = false
    connectRealtime(
      userId,
      (e) => onEventRef.current(e),
      (c) => {
        if (!cancelled) setConnected(c)
      },
    ).then((fn) => {
      if (cancelled) fn()
      else cleanup = fn
    })
    return () => {
      cancelled = true
      cleanup()
      setConnected(false)
    }
  }, [userId])

  return connected
}
