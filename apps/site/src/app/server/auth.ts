import process from 'node:process'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { sendEmail } from './email'
import { resetPasswordEmail, verifyEmail } from './email-templates'

/**
 * Better Auth — email + password, the same shape as the other apps.
 *
 * Built on first use rather than at import: Astro evaluates module top-level
 * code at build time too, and AUTH_SECRET / DATABASE_URL are runtime-only.
 * Constructing eagerly would fail every build before anything was wrong.
 */

let instance: ReturnType<typeof build> | null = null

// The canonical origin. SITE_ORIGIN is the name that survives; RP_ORIGIN is the
// WebAuthn-era spelling, still read so existing deploy envs keep working.
function siteOrigin(): string {
  return (
    process.env.SITE_ORIGIN ??
    process.env.RP_ORIGIN ??
    'http://localhost:4321'
  )
}

function build() {
  const secret = process.env.AUTH_SECRET
  const origin = siteOrigin()
  const isProduction = origin.startsWith('https')

  // Fail closed, as the hand-rolled auth did: never run production on a
  // missing or placeholder secret.
  if (isProduction && (!secret || secret.includes('replace-me'))) {
    throw new Error(
      'Refusing to start: set AUTH_SECRET in production (openssl rand -base64 32).',
    )
  }

  return betterAuth({
    secret: secret ?? 'dev-insecure-secret-change-me',
    baseURL: origin,
    database: drizzleAdapter(db, { provider: 'pg', schema }),

    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      // Above Better Auth's floor of 8. Nothing here is pre-hashed, so this is
      // the length of what someone actually types.
      minPasswordLength: 12,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({ to: user.email, ...resetPasswordEmail(url) })
      },
    },

    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({ to: user.email, ...verifyEmail(url) })
      },
      sendOnSignUp: true,
      // Deliberately not required to sign in. Requiring it would mean an email
      // outage locks out every new account, and nothing here is gated on a
      // verified address.
      autoSignInAfterVerification: true,
    },

    session: {
      // Thirty days, refreshed daily — the lifetime the JWT cookie had before
      // this migration, so sign-in frequency does not change. Unlike the JWT,
      // these are rows: deleting one actually ends the session.
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },

    advanced: {
      useSecureCookies: isProduction,
    },

    databaseHooks: {
      user: {
        create: {
          // Better Auth owns `user`; the app owns `users`. One profile row per
          // account, carrying the id Better Auth just minted.
          after: async (created) => {
            await db
              .insert(users)
              .values({
                id: created.id,
                email: created.email,
                displayName: created.name,
              })
              .onConflictDoNothing()
          },
        },
        update: {
          // email/displayName are mirrored, so a change on either has to land
          // on both or the app would render a stale name indefinitely.
          after: async (updated) => {
            await db
              .update(users)
              .set({ email: updated.email, displayName: updated.name })
              .where(eq(users.id, updated.id))
          },
        },
      },
    },
  })
}

export function getAuth(): ReturnType<typeof build> {
  if (instance === null) instance = build()
  return instance
}

/** The signed-in user's id, or null. Replaces the old getSessionUserId. */
export async function getSessionUserId(req: Request): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers: req.headers })
  return session?.user.id ?? null
}
