import { eq, inArray, or } from 'drizzle-orm'
import { DEV_USERS } from '../src/pages/api/_lib/dev-users'
import { db } from '../src/app/db'
import {
  courses,
  dailyActivity,
  directMessages,
  focusBlockedSites,
  friendships,
  gamePlaytime,
  providerCredentials,
  quizAttempts,
  reviewCards,
  sessions,
  subscriptions,
  userAchievements,
  userLessonProgress,
  userSettings,
  userSkills,
  userTopics,
  users,
  xpEvents,
} from '../src/app/db/schema'

// Dev-only: wipe all accumulated data for the three Dev Mode test users
// (dev-unpaid/paid/admin@example.com) WITHOUT deleting the accounts — scores,
// XP, streaks, progress, quiz attempts, reviews, playtime, settings, friends/DMs,
// and their own AI-generated courses. The accounts (id/email/displayName/role/
// tier) stay, so the next "become" click keeps the same identity.
//
// Safe by construction: it only ever touches the dev-*@example.com emails, which
// don't exist in production (the `become` endpoint is dev-gated). Run with:
//   npm run db:reset-dev            (dev DB, from apps/web/.env)
//   tsx --env-file=.env.prod scripts/reset-dev-users.ts   (targets prod — no-op
//                                                           since dev users don't
//                                                           exist there)

async function resetDevUsers() {
  const emails = Object.values(DEV_USERS).map((u) => u.email)
  const rows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, emails))

  if (rows.length === 0) {
    console.log('No dev users found — nothing to reset.')
    return
  }
  const ids = rows.map((r) => r.id)

  // Per-user rows keyed directly by user_id. reviewCards cascades review_logs;
  // deleting a user's courses (below) cascades their lessons/segments/questions/
  // exercises. Clear attempts before courses so no FK dangles.
  const byUser = [
    quizAttempts,
    userLessonProgress,
    userTopics,
    xpEvents,
    dailyActivity,
    userAchievements,
    userSkills,
    reviewCards,
    gamePlaytime,
    sessions,
    userSettings,
    focusBlockedSites,
    providerCredentials,
    subscriptions,
  ]
  for (const table of byUser) {
    await db.delete(table).where(inArray(table.userId, ids))
  }

  // Friendships + DMs reference two users (either side).
  await db
    .delete(friendships)
    .where(
      or(
        inArray(friendships.requesterId, ids),
        inArray(friendships.addresseeId, ids),
      ),
    )
  await db
    .delete(directMessages)
    .where(
      or(
        inArray(directMessages.senderId, ids),
        inArray(directMessages.recipientId, ids),
      ),
    )

  // Their own AI-generated courses (built-ins have ownerUserId null — untouched).
  await db.delete(courses).where(inArray(courses.ownerUserId, ids))

  // Zero the cached gamification totals + presence on the accounts themselves.
  for (const id of ids) {
    await db
      .update(users)
      .set({
        xp: 0,
        level: 1,
        currentStreak: 0,
        bestStreak: 0,
        lastActiveAt: null,
      })
      .where(eq(users.id, id))
  }

  console.log(
    `Reset ${rows.length} dev user(s): ${rows.map((r) => r.email).join(', ')}`,
  )
}

resetDevUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
