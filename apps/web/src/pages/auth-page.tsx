import { Link, Navigate } from 'react-router'
import { AuthCard } from '@/components/auth-card'
import { Logo, SectionLabel } from '@fw/ui'
import { WolfSun } from '@fw/ui'
import { useAuth } from '@/hooks/auth-context'

export function AuthPage() {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to="/app" replace />

  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-12">
      <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
        {/* Brand + art (desktop) */}
        <div className="hidden flex-col gap-6 lg:flex">
          <Link to="/" className="w-fit">
            <Logo />
          </Link>
          <div>
            <SectionLabel>Join the pack</SectionLabel>
            <h1 className="mt-2 text-4xl leading-tight font-bold uppercase">
              Level up your <span className="text-primary">skills.</span>
            </h1>
            <p className="mt-3 max-w-sm font-mono text-sm text-muted-foreground">
              Learn. Play. Level up. Turn screen time into real-world skills.
            </p>
          </div>
          <WolfSun className="w-64" />
        </div>

        {/* Form */}
        <div className="flex flex-col items-center gap-6">
          <Link to="/" className="lg:hidden">
            <Logo className="items-center" />
          </Link>
          <AuthCard />
          <Link
            to="/"
            className="font-mono text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
