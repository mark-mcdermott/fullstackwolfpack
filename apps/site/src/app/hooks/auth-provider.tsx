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
import { clearGuestReviews, guestReviewEntries } from '@/lib/guest-review'
import { AuthContext } from './auth-context'

// Thin state shell over the shared api-client. All transport lives there behind
// the http adapter — this just holds React state and re-renders.
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
    // Review cards go over with the rest. Signing up used to *empty* the queue
    // a guest had just built, which is backwards: a queue of cards coming due
    // is the honest reason to make an account.
    const reviews = guestReviewEntries()
    if (entries.length === 0 && playXp === 0 && reviews.length === 0) return
    try {
      await api.data.importProgress(entries, playXp, reviews)
      clearGuestProgress()
      clearGuestReviews()
    } catch {
      /* keep localStorage for a later retry */
    }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      setUser(await api.auth.signUp(email, password, displayName))
      await migrateGuestProgress()
    },
    [migrateGuestProgress],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      setUser(await api.auth.signIn(email, password))
      await migrateGuestProgress()
    },
    [migrateGuestProgress],
  )

  const requestPasswordReset = useCallback(async (email: string) => {
    await api.auth.requestPasswordReset(email)
  }, [])

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      await api.auth.resetPassword(token, newPassword)
    },
    [],
  )

  const logout = useCallback(async () => {
    await api.auth.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signUp,
      signIn,
      requestPasswordReset,
      resetPassword,
      logout,
      refresh,
    }),
    [
      user,
      loading,
      signUp,
      signIn,
      requestPasswordReset,
      resetPassword,
      logout,
      refresh,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
