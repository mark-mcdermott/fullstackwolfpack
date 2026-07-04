import { useCallback } from 'react'
import { SITE_URL } from '@/consts'
import { useAuth } from '@/hooks/auth-context'

// Sign out, then leave the app for the public site's logged-out home. The site
// is a separate origin (Astro on www), so this is a hard navigation.
export function useSignOut() {
  const { logout } = useAuth()
  return useCallback(async () => {
    await logout()
    window.location.assign(SITE_URL)
  }, [logout])
}
