import { Link, Outlet } from 'react-router'
import { useAuth } from '@/hooks/auth-context'
import { FwFooter } from './fw-footer'
import { FwHeader } from './fw-header'

// Public chrome for guest-accessible routes (`/` launcher, `/play` arcade,
// `/learn` tutorials, `/leaderboard`). Reuses the FW-01 header/footer and shows a
// "sign up to save your progress" banner. No RequireAuth — anyone can view; the
// banner is for guests. The primary nav now lives in the header (FwHeader).
export function GuestLayout() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <FwHeader />
      {!user && <GuestBanner />}
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6">
        <Outlet />
      </main>
      <FwFooter />
    </div>
  )
}

// The per-surface guest nav moved into the header (FwHeader). Kept here,
// commented, in case we want a secondary sub-nav back:
// function GuestNav() { ... /  /play  /learn  /leaderboard ... }

function GuestBanner() {
  return (
    <div className="border-b border-border bg-primary/10 px-5 py-2.5 text-center text-xs">
      <span className="text-muted-foreground">You're playing as a guest. </span>
      <Link to="/signup" className="font-semibold text-primary hover:underline">
        Create a free account
      </Link>
      <span className="text-muted-foreground">
        {' '}
        to save your playtime, unlock lessons, and meet Akela — or{' '}
      </span>
      <Link to="/login" className="font-semibold text-primary hover:underline">
        log in
      </Link>
      <span className="text-muted-foreground">.</span>
    </div>
  )
}
