import { useEffect } from 'react'
import { Navigate } from 'react-router'
import { SITE_URL } from '@/consts'
import { useAuth } from '@/hooks/auth-context'

// The app has no marketing home of its own — the public home lives on the Astro
// site. So `/` sends signed-in users to the app and everyone else out to the site.
//
// Local dev exception: the marketing site is a separate app (usually not running
// on localhost), so bouncing `/` to production is jarring. In dev, when no
// VITE_SITE_URL override is set, keep `/` on localhost by routing signed-out
// users to /login instead. Prod behavior is unchanged; set VITE_SITE_URL (e.g.
// http://localhost:4321) to send `/` to a local Astro site instead.
function keepLocal(): boolean {
  return import.meta.env.DEV && !import.meta.env.VITE_SITE_URL
}

export function RootRedirect() {
  const { user, loading } = useAuth()
  const local = keepLocal()

  useEffect(() => {
    if (!loading && !user && !local) window.location.replace(SITE_URL)
  }, [user, loading, local])

  if (loading) return null
  if (user) return <Navigate to="/app" replace />
  if (local) return <Navigate to="/login" replace />
  return null
}
