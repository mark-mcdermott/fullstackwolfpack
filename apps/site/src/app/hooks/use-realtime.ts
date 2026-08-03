import { useEffect, useRef, useState } from 'react'
import type { RealtimeMessage } from '@/core/social'
import { connectRealtime } from '@/lib/realtime'

// Subscribes to realtime DM push + shared presence for `userId`. Returns whether
// realtime is connected and the set of currently-present user ids (empty until
// connected). `connected` is false when disabled server-side (no ABLY_API_KEY)
// or not yet connected — the caller keeps polling as the source of truth /
// safety net. onEvent is held in a ref so re-renders don't tear down the socket.
export function useRealtime(
  userId: string | undefined,
  onEvent: (e: RealtimeMessage) => void,
): { connected: boolean; online: Set<string> } {
  const [connected, setConnected] = useState(false)
  const [online, setOnline] = useState<Set<string>>(() => new Set())
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!userId) return
    let cleanup = () => {}
    let cancelled = false
    connectRealtime(userId, {
      onEvent: (e) => onEventRef.current(e),
      onStatus: (c) => {
        if (!cancelled) setConnected(c)
      },
      onPresence: (ids) => {
        if (!cancelled) setOnline(ids)
      },
    }).then((fn) => {
      if (cancelled) fn()
      else cleanup = fn
    })
    return () => {
      cancelled = true
      cleanup()
      setConnected(false)
      setOnline(new Set())
    }
  }, [userId])

  return { connected, online }
}
