import process from 'node:process'
import { generateSecret, generateURI, verify } from 'otplib'

// Server-side auth config + TOTP helpers. Passkeys are the primary factor;
// TOTP is the recoverable, dependency-free fallback (no passwords anywhere).

export const rpName = 'Fullstack Wolfpack'
export const rpID = process.env.RP_ID ?? 'localhost'
export const origin = process.env.RP_ORIGIN ?? 'http://localhost:5173'

// A production deploy is one served over https (RP_ORIGIN).
const isProduction = origin.startsWith('https')

// Require user verification (biometric/PIN) in production; relax it in dev,
// where emulators and some authenticators skip it. `RP_REQUIRE_UV` overrides.
export function shouldRequireUserVerification(
  env: { RP_REQUIRE_UV?: string },
  isProd: boolean,
): boolean {
  if (env.RP_REQUIRE_UV != null) return env.RP_REQUIRE_UV === 'true'
  return isProd
}

export const requireUserVerification = shouldRequireUserVerification(
  process.env,
  isProduction,
)

// Names of security-critical settings still on insecure dev defaults.
export function insecureProductionConfig(env: {
  RP_ID?: string
  AUTH_SECRET?: string
  ENCRYPTION_KEY?: string
}): string[] {
  const missing: string[] = []
  if (!env.RP_ID || env.RP_ID === 'localhost') missing.push('RP_ID')
  if (!env.AUTH_SECRET) missing.push('AUTH_SECRET')
  if (!env.ENCRYPTION_KEY) missing.push('ENCRYPTION_KEY')
  return missing
}

// Fail closed: never run production auth on dev defaults.
if (isProduction) {
  const missing = insecureProductionConfig(process.env)
  if (missing.length) {
    throw new Error(
      `Refusing to start: set ${missing.join(', ')} in production (insecure defaults detected).`,
    )
  }
}

export function generateTotpSecret(): string {
  return generateSecret()
}

// otpauth:// URI for provisioning an authenticator app (render as a QR code).
export function totpAuthUri(email: string, secret: string): string {
  return generateURI({ issuer: rpName, label: email, secret })
}

export async function verifyTotp(
  token: string,
  secret: string,
): Promise<boolean> {
  const { valid } = await verify({ secret, token })
  return valid
}
