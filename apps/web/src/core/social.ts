import { z } from 'zod'

// Community DTOs (friends + DMs + presence), shared by the server functions in
// `api/me/[action].ts` and the api-client. Presence is derived from a
// `lastActiveAt` timestamp — a user is "online" if seen within the window.

export const PRESENCE_WINDOW_MS = 2 * 60 * 1000 // 2 minutes

export function isOnline(lastActiveAt: string | null, nowMs: number): boolean {
  if (!lastActiveAt) return false
  const t = new Date(lastActiveAt).getTime()
  return Number.isFinite(t) && nowMs - t < PRESENCE_WINDOW_MS
}

// ---- Views ----

export const friendSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  username: z.string().nullable(),
  online: z.boolean(),
  lastActiveAt: z.string().nullable(), // ISO; formatted client-side
  unread: z.number().int(), // unread DMs from this friend
})
export type Friend = z.infer<typeof friendSchema>

export const friendRequestSchema = z.object({
  id: z.string(), // friendship row id — used to accept/decline
  userId: z.string(), // the other user
  displayName: z.string(),
  username: z.string().nullable(),
  createdAt: z.string(),
})
export type FriendRequest = z.infer<typeof friendRequestSchema>

export const friendsViewSchema = z.object({
  friends: z.array(friendSchema),
  incoming: z.array(friendRequestSchema),
  outgoing: z.array(friendRequestSchema),
})
export type FriendsView = z.infer<typeof friendsViewSchema>

export const userSearchResultSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  username: z.string().nullable(),
  relation: z.enum(['none', 'friends', 'incoming', 'outgoing', 'self']),
})
export type UserSearchResult = z.infer<typeof userSearchResultSchema>
export const userSearchViewSchema = z.object({
  results: z.array(userSearchResultSchema),
})
export type UserSearchView = z.infer<typeof userSearchViewSchema>

export const messageSchema = z.object({
  id: z.string(),
  fromMe: z.boolean(),
  body: z.string(),
  createdAt: z.string(),
})
export type Message = z.infer<typeof messageSchema>
export const conversationSchema = z.object({ messages: z.array(messageSchema) })
export type Conversation = z.infer<typeof conversationSchema>

// ---- Request bodies ----

export const friendRequestBody = z.object({ toUserId: z.string().min(1) })
export const friendRespondBody = z.object({
  requestId: z.string().min(1),
  action: z.enum(['accept', 'decline']),
})
export const sendMessageBody = z.object({
  toUserId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
})

// ---- Realtime (optional Ably push layer) ----

// The Ably token-request response. `enabled: false` when ABLY_API_KEY is unset,
// so the client falls back to polling. `tokenRequest` is the opaque Ably token
// request (passed straight to the Realtime client's auth callback).
export const ablyTokenSchema = z.object({
  enabled: z.boolean(),
  tokenRequest: z.unknown().optional(),
})
export type AblyTokenResponse = z.infer<typeof ablyTokenSchema>

// Event pushed to a user's channel when a DM involving them is sent.
export type RealtimeMessage = { type: 'message'; fromUserId: string }
