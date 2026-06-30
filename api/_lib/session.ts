import process from 'node:process'
import { SignJWT, jwtVerify } from 'jose'

// Stateless session: a signed JWT in an httpOnly cookie. No server-side store.

const COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? 'dev-insecure-secret-change-me',
)
const isSecure = (process.env.RP_ORIGIN ?? '').startsWith('https')

export async function createSessionCookie(userId: string): Promise<string> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
  return serialize(COOKIE, token, MAX_AGE)
}

export function clearSessionCookie(): string {
  return serialize(COOKIE, '', 0)
}

export async function getSessionUserId(req: Request): Promise<string | null> {
  const token = readCookie(req, COOKIE)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

function serialize(name: string, value: string, maxAge: number): string {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  if (isSecure) parts.push('Secure')
  return parts.join('; ')
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}
