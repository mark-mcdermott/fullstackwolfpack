import { Gamepad2, Home, Medal, NotebookText } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '@/hooks/auth-context'
import { cn } from '@/lib/utils'
import { FwFooter } from './fw-footer'
import { FwHeader } from './fw-header'

// Public chrome for guest-accessible routes (`/` launcher, `/play` arcade,
// `/learn` tutorials, `/leaderboard`). Reuses the marketing header/footer, a slim
// guest nav across the surfaces, and a "sign up to save your progress" banner.
// No RequireAuth — anyone can view; the banner + nav are for guests.
const GUEST_NAV = [
  { to: '/', label: 'Start', icon: Home, end: true },
  { to: '/play', label: 'Arcade', icon: Gamepad2 },
  { to: '/learn', label: 'Tutorials', icon: NotebookText },
  { to: '/leaderboard', label: 'Leaderboard', icon: Medal },
]

export function GuestLayout() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <FwHeader />
      {!user && <GuestBanner />}
      {!user && <GuestNav />}
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6">
        <Outlet />
      </main>
      <FwFooter />
    </div>
  )
}

function GuestNav() {
  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-7xl gap-1 px-5">
        {GUEST_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon className="size-3.5" /> {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

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
