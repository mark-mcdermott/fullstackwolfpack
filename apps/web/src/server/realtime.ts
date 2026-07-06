import * as Ably from 'ably'

// Optional realtime push layer over the Neon-backed Community foundation. If
// ABLY_API_KEY is unset the whole feature is dormant and the client stays on
// polling — messages already persist in Neon, so realtime is pure enhancement.
//
// Security: the API key never leaves the server. Clients authenticate with a
// short-lived Ably token scoped to subscribe to *their own* channel only;
// publishing is done here, server-side, after the friends-only send check.

export type RealtimeEvent = { type: 'message'; fromUserId: string }

const userChannel = (userId: string) => `user:${userId}`

export function isRealtimeEnabled(): boolean {
  return !!process.env.ABLY_API_KEY
}

let restClient: Ably.Rest | null = null
function rest(): Ably.Rest {
  if (!restClient) {
    restClient = new Ably.Rest({ key: process.env.ABLY_API_KEY })
  }
  return restClient
}

// A token that lets the client subscribe to its own channel only (no publish).
export async function createUserTokenRequest(
  userId: string,
): Promise<Ably.TokenRequest> {
  return rest().auth.createTokenRequest({
    clientId: userId,
    capability: JSON.stringify({ [userChannel(userId)]: ['subscribe'] }),
  })
}

// Fire-and-forget push to a user's channel. Never throws — a realtime hiccup
// must not fail the DM send (the message is already committed to Neon and the
// client's poll is the safety net).
export async function publishToUser(
  userId: string,
  event: RealtimeEvent,
): Promise<void> {
  if (!isRealtimeEnabled()) return
  try {
    await rest().channels.get(userChannel(userId)).publish('event', event)
  } catch {
    /* ignore — DB has the message; clients still poll */
  }
}
