import { and, desc, eq, ilike, inArray, isNull, ne, or, sql } from 'drizzle-orm'
import {
  isOnline,
  type Conversation,
  type FriendsView,
  type UserSearchResult,
  type UserSearchView,
} from '../core/social'
import { db } from '../db'
import { directMessages, friendships, users } from '../db/schema'

// Server-only Community reads/writes behind the /api/me/* actions. Serverless —
// presence is a `users.lastActiveAt` heartbeat; no realtime service.

export async function touchPresence(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, userId))
}

const iso = (d: Date | null): string | null => d?.toISOString() ?? null

export async function getFriendsView(userId: string): Promise<FriendsView> {
  const now = Date.now()
  const [accepted, incoming, outgoing] = await Promise.all([
    db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, 'accepted'),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId),
          ),
        ),
      ),
    db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, 'pending'),
          eq(friendships.addresseeId, userId),
        ),
      ),
    db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, 'pending'),
          eq(friendships.requesterId, userId),
        ),
      ),
  ])

  const friendIds = accepted.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  )
  const allIds = [
    ...new Set([
      ...friendIds,
      ...incoming.map((f) => f.requesterId),
      ...outgoing.map((f) => f.addresseeId),
    ]),
  ]
  const userRows = allIds.length
    ? await db
        .select({
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          lastActiveAt: users.lastActiveAt,
        })
        .from(users)
        .where(inArray(users.id, allIds))
    : []
  const byId = new Map(userRows.map((u) => [u.id, u]))

  const unreadRows = friendIds.length
    ? await db
        .select({ from: directMessages.senderId, n: sql<number>`count(*)` })
        .from(directMessages)
        .where(
          and(
            eq(directMessages.recipientId, userId),
            isNull(directMessages.readAt),
            inArray(directMessages.senderId, friendIds),
          ),
        )
        .groupBy(directMessages.senderId)
    : []
  const unreadBy = new Map(unreadRows.map((r) => [r.from, Number(r.n)]))

  return {
    friends: friendIds
      .map((fid) => {
        const u = byId.get(fid)
        const last = iso(u?.lastActiveAt ?? null)
        return {
          userId: fid,
          displayName: u?.displayName ?? 'Unknown',
          username: u?.username ?? null,
          online: isOnline(last, now),
          lastActiveAt: last,
          unread: unreadBy.get(fid) ?? 0,
        }
      })
      .sort(
        (a, b) =>
          Number(b.online) - Number(a.online) ||
          a.displayName.localeCompare(b.displayName),
      ),
    incoming: incoming.map((f) => {
      const u = byId.get(f.requesterId)
      return {
        id: f.id,
        userId: f.requesterId,
        displayName: u?.displayName ?? 'Unknown',
        username: u?.username ?? null,
        createdAt: f.createdAt.toISOString(),
      }
    }),
    outgoing: outgoing.map((f) => {
      const u = byId.get(f.addresseeId)
      return {
        id: f.id,
        userId: f.addresseeId,
        displayName: u?.displayName ?? 'Unknown',
        username: u?.username ?? null,
        createdAt: f.createdAt.toISOString(),
      }
    }),
  }
}

export async function searchUsers(
  userId: string,
  q: string,
): Promise<UserSearchView> {
  const term = q.trim()
  if (term.length < 2) return { results: [] }
  const like = `%${term}%`
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
    })
    .from(users)
    .where(
      and(
        ne(users.id, userId),
        or(
          ilike(users.displayName, like),
          ilike(users.username, like),
          ilike(users.email, like),
        ),
      ),
    )
    .limit(10)

  const ids = rows.map((r) => r.id)
  const rels = ids.length
    ? await db
        .select()
        .from(friendships)
        .where(
          or(
            and(
              eq(friendships.requesterId, userId),
              inArray(friendships.addresseeId, ids),
            ),
            and(
              eq(friendships.addresseeId, userId),
              inArray(friendships.requesterId, ids),
            ),
          ),
        )
    : []

  const relationFor = (other: string): UserSearchResult['relation'] => {
    const f = rels.find(
      (r) =>
        (r.requesterId === userId && r.addresseeId === other) ||
        (r.addresseeId === userId && r.requesterId === other),
    )
    if (!f) return 'none'
    if (f.status === 'accepted') return 'friends'
    return f.requesterId === userId ? 'outgoing' : 'incoming'
  }

  return {
    results: rows.map((r) => ({
      userId: r.id,
      displayName: r.displayName,
      username: r.username,
      relation: relationFor(r.id),
    })),
  }
}

export async function sendFriendRequest(
  userId: string,
  toUserId: string,
): Promise<{ status: 'pending' | 'accepted' }> {
  if (toUserId === userId) throw new Error('You cannot add yourself.')
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, toUserId))
  if (!target) throw new Error('No such user.')

  const existing = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, toUserId),
        ),
        and(
          eq(friendships.requesterId, toUserId),
          eq(friendships.addresseeId, userId),
        ),
      ),
    )

  // They already requested me → accept it (become friends).
  const reverse = existing.find((f) => f.requesterId === toUserId)
  if (reverse) {
    if (reverse.status !== 'accepted') {
      await db
        .update(friendships)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(friendships.id, reverse.id))
    }
    return { status: 'accepted' }
  }
  const mine = existing.find((f) => f.requesterId === userId)
  if (mine) return { status: mine.status }

  await db
    .insert(friendships)
    .values({ requesterId: userId, addresseeId: toUserId })
  return { status: 'pending' }
}

export async function respondToRequest(
  userId: string,
  requestId: string,
  action: 'accept' | 'decline',
): Promise<{ ok: true }> {
  const [f] = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, requestId))
  if (!f || f.addresseeId !== userId || f.status !== 'pending') {
    throw new Error('No such request.')
  }
  if (action === 'accept') {
    await db
      .update(friendships)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(friendships.id, requestId))
  } else {
    await db.delete(friendships).where(eq(friendships.id, requestId))
  }
  return { ok: true }
}

async function areFriends(a: string, b: string): Promise<boolean> {
  const [f] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, 'accepted'),
        or(
          and(
            eq(friendships.requesterId, a),
            eq(friendships.addresseeId, b),
          ),
          and(
            eq(friendships.requesterId, b),
            eq(friendships.addresseeId, a),
          ),
        ),
      ),
    )
  return !!f
}

export async function getConversation(
  userId: string,
  withUserId: string,
  limit = 50,
): Promise<Conversation> {
  const rows = await db
    .select()
    .from(directMessages)
    .where(
      or(
        and(
          eq(directMessages.senderId, userId),
          eq(directMessages.recipientId, withUserId),
        ),
        and(
          eq(directMessages.senderId, withUserId),
          eq(directMessages.recipientId, userId),
        ),
      ),
    )
    .orderBy(desc(directMessages.createdAt))
    .limit(limit)

  // Mark incoming messages from this conversation as read.
  await db
    .update(directMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(directMessages.recipientId, userId),
        eq(directMessages.senderId, withUserId),
        isNull(directMessages.readAt),
      ),
    )

  return {
    messages: rows.reverse().map((m) => ({
      id: m.id,
      fromMe: m.senderId === userId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  }
}

export async function sendMessage(
  userId: string,
  toUserId: string,
  body: string,
): Promise<{ ok: true }> {
  if (!(await areFriends(userId, toUserId))) {
    throw new Error('You can only message friends.')
  }
  await db
    .insert(directMessages)
    .values({ senderId: userId, recipientId: toUserId, body })
  return { ok: true }
}
