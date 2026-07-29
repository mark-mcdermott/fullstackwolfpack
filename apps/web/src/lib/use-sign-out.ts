import { useCallback } from 'react'
import { useAuth } from '@/hooks/auth-context'

// Sign out, then return to the app's front door — the guest home at `/`. The app
// is self-sufficient now (it IS the landing experience), so there's no bounce to
// the marketing site. A hard navigation guarantees a clean, signed-out state.
export function useSignOut() {
  const { logout } = useAuth()
  return useCallback(async () => {
    await logout()
    window.location.assign('/')
  }, [logout])
}
