import type * as AblyTypes from 'ably'
import { api } from '@/api-client'
import type { RealtimeMessage } from '@/core/social'

// Connects to Ably for instant DM push, subscribing to the user's own channel
// (`user:<id>`). Returns a cleanup fn. When realtime is disabled server-side
// (no ABLY_API_KEY) the token endpoint reports `enabled: false`, onStatus(false)
// fires, and nothing loads — the caller stays on polling. The `ably` SDK is
// dynamically imported so it's a separate chunk that only downloads when
// realtime is actually on.
export async function connectRealtime(
  userId: string,
  onEvent: (e: RealtimeMessage) => void,
  onStatus: (connected: boolean) => void,
): Promise<() => void> {
  const first = await api.social.ablyToken()
  if (!first.enabled) {
    onStatus(false)
    return () => {}
  }

  const Ably = await import('ably')
  const client = new Ably.Realtime({
    authCallback: async (_params, cb) => {
      try {
        const t = await api.social.ablyToken()
        cb(null, (t.tokenRequest as AblyTypes.TokenRequest) ?? null)
      } catch (err) {
        cb(err as AblyTypes.ErrorInfo, null)
      }
    },
  })
  client.connection.on('connected', () => onStatus(true))
  client.connection.on('disconnected', () => onStatus(false))
  client.connection.on('failed', () => onStatus(false))

  const channel = client.channels.get(`user:${userId}`)
  const handler = (msg: AblyTypes.Message) => {
    const data = msg.data as RealtimeMessage | undefined
    if (data?.type === 'message') onEvent(data)
  }
  channel.subscribe('event', handler)

  return () => {
    try {
      channel.unsubscribe('event', handler)
      client.close()
    } catch {
      /* ignore */
    }
  }
}
