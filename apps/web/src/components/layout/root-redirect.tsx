import { useEffect } from 'react'
import { Navigate } from 'react-router'
import { SITE_URL } from '@/consts'
import { useAuth } from '@/hooks/auth-context'

// The app has no marketing home of its own — the public home lives on the
// Astro site. So `/` sends signed-in users to the app and everyone else out to
// the site.
export function RootRedirect() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) window.location.replace(SITE_URL)
  }, [user, loading])

  if (loading) return null
  if (user) return <Navigate to="/app" replace />
  return null
}
