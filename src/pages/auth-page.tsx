import { Link, Navigate } from 'react-router'
import { AuthCard } from '@/components/auth-card'
import { Logo } from '@/components/ui-kit'
import { useAuth } from '@/hooks/auth-context'

export function AuthPage() {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to="/app" replace />

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6">
      <Link to="/">
        <Logo className="items-center text-center" />
      </Link>
      <AuthCard />
      <Link
        to="/"
        className="font-mono text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground"
      >
        ← Back to home
      </Link>
    </div>
  )
}
