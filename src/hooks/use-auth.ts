import { useCallback, useEffect, useState } from 'react'
import {
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'

export type AuthUser = { id: string; email: string; displayName: string }

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data as T
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(res.ok ? data.user : null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Registration ceremony: get options → prompt for a passkey → verify.
  const register = useCallback(async (email: string, displayName: string) => {
    const optionsJSON = await postJson<PublicKeyCredentialCreationOptionsJSON>(
      '/api/auth/register/options',
      { email, displayName },
    )
    const response = await startRegistration({ optionsJSON })
    const { user } = await postJson<{ user: AuthUser }>(
      '/api/auth/register/verify',
      { email, response },
    )
    setUser(user)
  }, [])

  // Authentication ceremony: get options → sign challenge → verify.
  const login = useCallback(async (email: string) => {
    const optionsJSON = await postJson<PublicKeyCredentialRequestOptionsJSON>(
      '/api/auth/login/options',
      { email },
    )
    const response = await startAuthentication({ optionsJSON })
    const { user } = await postJson<{ user: AuthUser }>(
      '/api/auth/login/verify',
      { email, response },
    )
    setUser(user)
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  return { user, loading, register, login, logout }
}
