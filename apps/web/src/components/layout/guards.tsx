import { Navigate, Outlet } from 'react-router'
import { can } from '@/core/access'
import { useAuth } from '@/hooks/auth-context'

// Gate routes on authentication. Children render via <Outlet/>.
export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

// Gate routes on an ability (e.g. admin). Non-admins bounce to the app home.
export function RequireRole({ ability }: { ability: 'admin.access' }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!can(user, ability)) return <Navigate to="/app" replace />
  return <Outlet />
}
