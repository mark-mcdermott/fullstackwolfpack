import type { APIRoute } from 'astro'
export const prerender = false

import { getAuth } from '@/server/auth'

// Better Auth's whole surface — sign-up, sign-in, sign-out, session, password
// reset, email verification — behind one catch-all. This replaces the nine
// hand-rolled routes the WebAuthn/TOTP flow needed.

const handler: APIRoute = ({ request }) => getAuth().handler(request)

export const GET = handler
export const POST = handler
