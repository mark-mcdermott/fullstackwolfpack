import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/auth-context'
import { AuthCard } from '@/components/auth-card'

// The protected-route guard: while we confirm the session it shows nothing
// jarring, unauthenticated users get the sign-in card, authenticated users
// get the protected children. Same pattern drops into a router's element.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="w-full max-w-sm rounded-xl border py-10 text-center text-sm text-muted-foreground">
        Checking your session…
      </div>
    )
  }

  if (!user) return <AuthCard />

  return <>{children}</>
}
