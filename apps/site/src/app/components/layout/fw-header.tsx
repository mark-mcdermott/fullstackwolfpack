import { BookOpen, Gamepad2, Home, Signal, type LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router'
import { ThemeToggle, WolfMark } from '@fw/ui'
import { useMissionExit } from '@/lib/mission-exit-store'
import { cn } from '@/lib/utils'

// FW-01 header — a full-width bar with the wolf brand, the primary nav (icon +
// label, active in red with an underline), a latency readout, and the light/
// dark toggle. Used on the guest surfaces (`/`, `/learn`, `/play`) and the auth
// pages.
const NAV: {
  to: string
  label: string
  icon: ComponentType<LucideProps>
  end?: boolean
}[] = [
  { to: '/', label: 'Play', icon: Home, end: true },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/play', label: 'Arcade', icon: Gamepad2 },
  // Hidden for now (kept for when we resurface it in the nav):
  // { to: '/leaderboard', label: 'Ranks', icon: Medal },
]

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
          <WolfMark className="h-9 text-foreground sm:h-12" />
          <span className="flex flex-col font-heading leading-[0.95]">
            <span className="text-sm font-bold tracking-wide text-foreground sm:text-xl">
              FULLSTACK
            </span>
            <span className="text-sm font-bold tracking-wide text-foreground sm:text-xl">
              WOLFPACK
            </span>
            <span className="mt-0.5 text-[9px] font-normal tracking-widest text-primary sm:text-xs">
              ウルフパック
            </span>
          </span>
        </NavLink>

        {/* Primary nav */}
        <nav className="flex items-center gap-4 sm:gap-9">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="group flex flex-col items-center gap-1.5"
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'size-5 transition-colors sm:size-6',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  <span
                    className={cn(
                      'font-heading text-xs tracking-widest uppercase transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      'h-0.5 w-full transition-colors',
                      isActive ? 'bg-primary' : 'bg-transparent',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Latency readout + light/dark toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LatencyReadout />
          <ThemeToggle />
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
