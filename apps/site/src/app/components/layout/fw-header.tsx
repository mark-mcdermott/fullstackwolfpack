import { Signal } from 'lucide-react'
import { NavLink } from 'react-router'
import { ThemeToggle, WolfMark } from '@fw/ui'
import { useMissionExit } from '@/lib/mission-exit-store'
import { cn } from '@/lib/utils'

// FW-01 header — a full-width bar with the wolf brand, the primary nav (label
// only, active in red over a fixed-width underline), a latency readout, an API
// health pip, and the light/dark toggle. Used on the guest surfaces (`/`,
// `/learn`, `/play`) and the auth pages.
//
// `minWidth` hides the tail of the nav on narrow viewports rather than letting
// the items overflow — the brand and toggle refuse to shrink, so something has
// to give below `md`.
const NAV: {
  to: string
  label: string
  end?: boolean
  minWidth?: string
}[] = [
  { to: '/', label: 'Play', end: true },
  { to: '/learn', label: 'Learn' },
  { to: '/play', label: 'Arcade' },
  // Parked. There is no guest community surface yet; this pointed at the real
  // page behind RequireAuth so a logged-out click funnelled to /login rather
  // than 404ing on /community.
  // { to: '/app/friends', label: 'Community', minWidth: 'hidden md:flex' },
  {
    to: '/leaderboard',
    label: 'Leaderboard',
    minWidth: 'hidden lg:flex',
  },
]

// The active underline is a fixed width — roughly the width of "ARCADE" — so it
// reads as a consistent marker rather than shrink-wrapping each label. Every
// item reserves it (transparent when inactive) to keep the row from reflowing.
const UNDERLINE_WIDTH = 'w-16'

export function FwHeader() {
  // While a mission is on screen, clicking the brand leaves it (same as the
  // bar's ✕ / "take a break") instead of re-navigating to the already-current
  // route, which would do nothing and strand you in the session.
  const missionExit = useMissionExit()
  return (
    // Transparent so the page grain/glow (index.css `body::before`) runs behind
    // it unbroken; the layout wrapper supplies the base color.
    <header className="border-b border-border">
      {/* Brand + nav + toggle all refuse to shrink, so below `sm` every gap and
          type step tightens instead — the row overflowed the viewport on 320–370px
          phones otherwise. */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        {/* Brand */}
        <NavLink
          to="/"
          onClick={(e) => {
            if (missionExit) {
              e.preventDefault()
              missionExit()
            }
          }}
          className="flex shrink-0 items-center gap-2 sm:gap-4"
        >
          <WolfMark className="h-12 text-foreground sm:h-16" />
          <span className="flex flex-col font-heading leading-[0.8]">
            <span className="text-xl font-bold tracking-wide text-foreground sm:text-3xl">
              FULLSTACK
            </span>
            <span className="text-xl font-bold tracking-wide text-foreground sm:text-3xl">
              WOLFPACK
            </span>
            {/* Katakana, not Teko — the display face has no kana, so this line
                falls through to the sans stack. `font-variation-settings: normal`
                opts it out of the heading font's pinned 400 axis (theme.css),
                which would otherwise swallow the weight bump. */}
            <span className="mt-1 text-[9px] font-medium tracking-widest text-primary [font-variation-settings:normal] sm:text-xs">
              ウルフパック
            </span>
          </span>
        </NavLink>

        {/* Primary nav */}
        <nav className="flex items-center gap-4 sm:gap-9">
          {NAV.map(({ to, label, end, minWidth }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={cn(
                'group flex flex-col items-center gap-1.5',
                minWidth ?? 'flex',
              )}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'font-heading text-lg tracking-widest uppercase transition-colors sm:text-xl',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      'h-0.5 transition-colors',
                      UNDERLINE_WIDTH,
                      isActive ? 'bg-primary' : 'bg-transparent',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Latency readout + API health + light/dark toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LatencyReadout />
          <span className="hidden items-center gap-2 font-mono text-sm text-foreground sm:flex">
            <span className="size-2 rounded-full bg-green-500" />
            Healthy
          </span>
          <span className="hidden h-6 w-px bg-border sm:block" />
          {/* The toggle owns its own padding; the arbitrary variant sizes the
              icon it renders, which is otherwise fixed at `size-4`. */}
          <ThemeToggle className="[&_svg]:size-6" />
          {/* Parked with the rest of the guest CTA work.
          {!user && (
            <Link
              to="/login"
              className="hidden h-9 items-center justify-center rounded-lg border border-primary/60 px-4 font-mono text-xs font-semibold tracking-widest text-primary uppercase transition-colors hover:border-primary hover:bg-primary/10 sm:inline-flex"
            >
              Log in
            </Link>
          )} */}
        </div>
      </div>
    </header>
  )
}

// Decorative latency readout (the number is cosmetic — no real ping yet).
function LatencyReadout() {
  return (
    <div className="hidden min-w-[8.5rem] rounded-lg border border-border bg-muted/30 px-3 py-1.5 lg:block">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Latency
        </span>
        <span className="size-1.5 rounded-full bg-green-500" />
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
          23 ms
        </span>
        <Signal className="size-4 text-muted-foreground" strokeWidth={2} />
      </div>
    </div>
  )
}
