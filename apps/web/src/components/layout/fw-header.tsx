import { BookOpen, Home, type LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router'
import { WolfMark } from '@fw/ui'
import { cn } from '@/lib/utils'

// FW-01 header — a floating pill with the wolf brand, the primary nav (icon +
// label, active in red with an underline), and a system-status readout. Used on
// the guest surfaces (`/`, `/learn`, `/play`, `/leaderboard`) and the auth pages.
const NAV: {
  to: string
  label: string
  icon: ComponentType<LucideProps>
  end?: boolean
}[] = [
  { to: '/', label: 'Play', icon: Home, end: true },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/play', label: 'Arcade', icon: ArcadeIcon },
  // Hidden for now (kept for when we resurface it in the nav):
  // { to: '/leaderboard', label: 'Ranks', icon: Medal },
]

export function FwHeader() {
  return (
    <header className="px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/90 backdrop-blur">
        {/* Red glow bleeding in from the top-left corner. */}
        <div className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute top-0 left-0 h-px w-40 bg-gradient-to-r from-primary to-transparent" />
        <div className="pointer-events-none absolute top-0 left-0 h-40 w-px bg-gradient-to-b from-primary to-transparent" />

        <div className="relative flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          {/* Brand */}
          <NavLink to="/" className="flex shrink-0 items-center gap-3 sm:gap-4">
            <WolfMark className="h-10 text-white sm:h-14" />
            <span className="flex flex-col font-heading leading-[0.95]">
              <span className="text-lg font-bold tracking-wide text-white sm:text-2xl">
                FULLSTACK
              </span>
              <span className="text-lg font-bold tracking-wide text-white sm:text-2xl">
                WOLFPACK
              </span>
              <span className="mt-0.5 text-xs font-normal tracking-widest text-primary sm:text-base">
                ウルフパック
              </span>
            </span>
          </NavLink>

          {/* Primary nav */}
          <nav className="flex items-center gap-5 sm:gap-9">
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
                        'size-6 transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-neutral-300 group-hover:text-white',
                      )}
                    />
                    <span
                      className={cn(
                        'font-heading text-xs tracking-widest uppercase transition-colors sm:text-sm',
                        isActive
                          ? 'text-primary'
                          : 'text-neutral-300 group-hover:text-white',
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

          {/* System status */}
          <SystemStatus />
        </div>
      </div>
    </header>
  )
}

// Decorative status readout (the latency is cosmetic — no real ping yet).
function SystemStatus() {
  return (
    <div className="fw-notch-tr hidden min-w-[190px] border border-neutral-700 bg-black/40 px-3 py-2 lg:block">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
          System status
        </span>
        <span className="size-2 rounded-full bg-green-500 shadow-[0_0_6px] shadow-green-500/70" />
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="font-mono text-sm font-bold tracking-widest text-green-500 uppercase">
          Online
        </span>
        <span className="font-mono text-xs tabular-nums text-green-500">12ms</span>
      </div>
      <span className="fw-barcode-regular mt-1.5 block h-1.5 w-full text-green-500/70" />
    </div>
  )
}

// A minimal arcade-cabinet icon (lucide has none) — stroke style to match lucide.
function ArcadeIcon(props: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <rect x="8.5" y="5.5" width="7" height="5" rx="0.5" />
      <path d="M9.5 14h5" />
      <path d="M5 21h1.5M17.5 21H19" />
    </svg>
  )
}
