import { Outlet } from 'react-router'
// import { Link } from 'react-router' // parked with GuestBanner
// import { useAuth } from '@/hooks/auth-context' // parked with GuestBanner
import { FwFooter } from './fw-footer'
import { FwHeader } from './fw-header'

// Public chrome for guest-accessible routes (`/` launcher, `/play` arcade,
// `/learn` tutorials, `/leaderboard`). Reuses the FW-01 header/footer and shows a
// "sign up to save your progress" banner. No RequireAuth — anyone can view; the
// banner is for guests. The primary nav now lives in the header (FwHeader).
export function GuestLayout() {
  // const { user } = useAuth() // parked with GuestBanner
  return (
    // Transparent, not `bg-background` — an opaque wrapper would paint over the
    // page glow (index.css `body::before`). The body carries the base color.
    <div className="flex min-h-svh flex-col text-foreground">
      <FwHeader />
      {/* {!user && <GuestBanner />} */}
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

// Parked. A quiet strip, not an alert: the red wash made it read as a warning,
// so it's just a faintly raised band now with the two actions carrying the color.
/*
function GuestBanner() {
  return (
    <div className="border-b border-border bg-muted/25 px-5 py-2.5 text-center text-[13px] text-muted-foreground">
      You&rsquo;re playing as a guest.{' '}
      <Link to="/signup" className="font-semibold text-primary hover:underline">
        Create a free account
      </Link>{' '}
      to save your playtime, unlock lessons, and meet Akela — or{' '}
      <Link to="/login" className="font-semibold text-primary hover:underline">
        log in
      </Link>
      .
    </div>
  )
}
*/
