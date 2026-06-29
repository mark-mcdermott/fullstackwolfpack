import process from 'node:process'
import { generateSecret, generateURI, verify } from 'otplib'

// Server-side auth config + TOTP helpers. Passkeys are the primary factor;
// TOTP is the recoverable, dependency-free fallback (no passwords anywhere).

export const rpName = 'Fullstack Wolfpack'
export const rpID = process.env.RP_ID ?? 'localhost'
export const origin = process.env.RP_ORIGIN ?? 'http://localhost:5173'

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
