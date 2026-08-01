import type * as AblyTypes from 'ably'
import { api } from '@/api-client'
import { PRESENCE_CHANNEL, type RealtimeMessage } from '@/core/social'

export type RealtimeHandlers = {
  onEvent: (e: RealtimeMessage) => void
  onStatus: (connected: boolean) => void
  onPresence: (onlineUserIds: Set<string>) => void
}

// Connects to Ably for (a) instant DM push on the user's own channel and (b)
// shared presence — the client enters `presence:community` (clientId = userId)
// and reports the set of present user ids. Returns a cleanup fn. When realtime
// is disabled server-side (no ABLY_API_KEY) the token endpoint reports
// `enabled: false`, onStatus(false) fires, and nothing loads — the caller stays
// on polling. The `ably` SDK is dynamically imported so it's a separate chunk
// that only downloads when realtime is actually on.
export async function connectRealtime(
  userId: string,
  { onEvent, onStatus, onPresence }: RealtimeHandlers,
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

  // (a) Direct-message push.
  const dm = client.channels.get(`user:${userId}`)
  const msgHandler = (msg: AblyTypes.Message) => {
    const data = msg.data as RealtimeMessage | undefined
    if (data?.type === 'message') onEvent(data)
  }
  dm.subscribe('event', msgHandler)

  // (b) Presence — enter the shared channel and report the present user ids.
  const presence = client.channels.get(PRESENCE_CHANNEL)
  const reportPresence = async () => {
    try {
      const members = await presence.presence.get()
      onPresence(
        new Set(members.map((m) => m.clientId).filter((id): id is string => !!id)),
      )
    } catch {
      /* ignore transient presence errors */
    }
  }
  presence.presence.subscribe(reportPresence)
  try {
    await presence.presence.enter()
    await reportPresence()
  } catch {
    /* ignore — messages still work without presence */
  }

  return () => {
    try {
      dm.unsubscribe('event', msgHandler)
      presence.presence.unsubscribe()
      void presence.presence.leave()
      client.close()
    } catch {
      /* ignore */
    }
  }
}
