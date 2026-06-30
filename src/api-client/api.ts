import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import {
  authResultSchema,
  meResultSchema,
  protectedResultSchema,
  totpSetupSchema,
  type PublicUser,
  type TotpSetup,
} from '@/core/schemas'
import type { Adapters } from './types'

// Surface-agnostic API. Construct it once with a surface's adapters
// (see ./index.ts for the web wiring). Responses are validated against the
// shared core schemas, so a malformed payload throws instead of leaking through.
export function createApi({ http, passkeys }: Adapters) {
  const auth = {
    async register(email: string, displayName: string): Promise<PublicUser> {
      const optionsJSON =
        await http.request<PublicKeyCredentialCreationOptionsJSON>(
          '/api/auth/register/options',
          { method: 'POST', body: JSON.stringify({ email, displayName }) },
        )
      const response = await passkeys.create(optionsJSON)
      const { user } = authResultSchema.parse(
        await http.request('/api/auth/register/verify', {
          method: 'POST',
          body: JSON.stringify({ email, response }),
        }),
      )
      return user
    },

    async login(email: string): Promise<PublicUser> {
      const optionsJSON =
        await http.request<PublicKeyCredentialRequestOptionsJSON>(
          '/api/auth/login/options',
          { method: 'POST', body: JSON.stringify({ email }) },
        )
      const response = await passkeys.get(optionsJSON)
      const { user } = authResultSchema.parse(
        await http.request('/api/auth/login/verify', {
          method: 'POST',
          body: JSON.stringify({ email, response }),
        }),
      )
      return user
    },

    async recover(email: string, token: string): Promise<PublicUser> {
      const { user } = authResultSchema.parse(
        await http.request('/api/auth/totp/recover', {
          method: 'POST',
          body: JSON.stringify({ email, token }),
        }),
      )
      return user
    },

    async logout(): Promise<void> {
      await http.request('/api/auth/logout', { method: 'POST' })
    },

    async me(): Promise<PublicUser | null> {
      try {
        return meResultSchema.parse(await http.request('/api/auth/me')).user
      } catch {
        return null
      }
    },
  }

  const totp = {
    async setup(): Promise<TotpSetup> {
      return totpSetupSchema.parse(
        await http.request('/api/auth/totp/setup', { method: 'POST' }),
      )
    },
    async enable(token: string): Promise<void> {
      await http.request('/api/auth/totp/enable', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    },
    async disable(): Promise<void> {
      await http.request('/api/auth/totp/disable', { method: 'POST' })
    },
  }

  async function getProtected(): Promise<{ message: string }> {
    return protectedResultSchema.parse(await http.request('/api/protected'))
  }

  return { auth, totp, getProtected }
}

export type Api = ReturnType<typeof createApi>
