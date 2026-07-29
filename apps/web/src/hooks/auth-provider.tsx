import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/api-client'
import type { PublicUser } from '@/core/schemas'
import {
  clearGuestProgress,
  guestPlayXp,
  guestProgressEntries,
} from '@/lib/guest-progress'
import { AuthContext } from './auth-context'

// Thin state shell over the shared api-client. All transport + WebAuthn
// ceremony logic lives in the api-client behind adapters — this just holds
// React state and re-renders.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setUser(await api.auth.me())
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Carry a guest's localStorage progress into the account. Best-effort — on
  // failure the localStorage is kept so the next login can retry.
  const migrateGuestProgress = useCallback(async () => {
    const entries = guestProgressEntries()
    const playXp = guestPlayXp()
    if (entries.length === 0 && playXp === 0) return
    try {
      await api.data.importProgress(entries, playXp)
      clearGuestProgress()
    } catch {
      /* keep localStorage for a later retry */
    }
  }, [])

  const register = useCallback(
    async (email: string, displayName: string) => {
      setUser(await api.auth.register(email, displayName))
      await migrateGuestProgress()
    },
    [migrateGuestProgress],
  )

  const login = useCallback(
    async (email: string) => {
      setUser(await api.auth.login(email))
      await migrateGuestProgress()
    },
    [migrateGuestProgress],
  )

  const recover = useCallback(async (email: string, token: string) => {
    setUser(await api.auth.recover(email, token))
  }, [])

  const logout = useCallback(async () => {
    await api.auth.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, register, login, recover, logout, refresh }),
    [user, loading, register, login, recover, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
