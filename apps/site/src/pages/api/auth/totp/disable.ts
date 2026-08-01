import type { APIRoute } from 'astro'
export const prerender = false

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { json } from '../../_lib/http'
import { getSessionUserId } from '../../_lib/session'

// Authed. Forget the secret and turn TOTP off.
export const POST: APIRoute = async ({ request: req }) => {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  await db
    .update(users)
    .set({ totpSecret: null, totpEnabled: false })
    .where(eq(users.id, userId))

  return json({ disabled: true })
}
