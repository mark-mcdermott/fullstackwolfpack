// import { Signal } from 'lucide-react' // parked with LatencyReadout
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
  // Parked alongside Community — the bar is Play / Learn / Arcade for now.
  // { to: '/leaderboard', label: 'Leaderboard', minWidth: 'hidden lg:flex' },
]

// The active underline is a fixed width — roughly the width of "ARCADE" — so it
// reads as a consistent marker rather than shrink-wrapping each label. Every
// item reserves it (transparent when inactive) to keep the row from reflowing.
// Also the nav item's width, so the underline can't be the full 72px on phones
// without the row overflowing — three fixed 72px cells plus the brand blow past
// a 375px viewport.
const UNDERLINE_WIDTH = 'w-11 sm:w-[72px]'

// Item width is the underline's, so centre-to-centre spacing is 72 + gap.
const NAV_GAP = 'sm:gap-[36px]'

export function FwHeader() {
  // While a mission is on screen, clicking the brand leaves it (same as the
  // bar's ✕ / "take a break") instead of re-navigating to the already-current
  // route, which would do nothing and strand you in the session.
  const missionExit = useMissionExit()
  return (
    // Transparent so the page grain/glow (index.css `body::before`) runs behind
    // it unbroken; the layout wrapper supplies the base color.
    // Light mode floats the bar as a rounded card inset from the page edges;
    // dark keeps the full-bleed bar with just a bottom rule. Both surfaces are
    // white in light, so the border and shadow are what read as the card edge.
    // `relative z-10` lifts the bar above <main>, which is a positioned
    // stacking context (`isolate`) and would otherwise paint over it — the dot
    // field tucks up behind this bar. Stacking alone isn't enough though: the
    // bar stays transparent in dark (so the page glow reads through it), so
    // light also needs a real surface to occlude with.
    <header className="relative z-10 border-b border-border light:border-b-0">
      {/* Light only: the same max-width and horizontal padding as <main>, so the
          card's edges land exactly on the tiles' edges below. Left bare in dark,
          where the bar is full-bleed and there is no card edge to align. */}
      <div className="mx-auto w-full max-w-7xl light:px-5 light:pt-3 sm:light:px-7 sm:light:pt-4">
        {/* Brand + nav + toggle all refuse to shrink, so below `sm` every gap and
            type step tightens instead — the row overflowed the viewport on 320–370px
            phones otherwise. */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-9 sm:py-5 light:rounded-xl light:border light:border-border light:bg-[#f7f3f2] light:shadow-sm">
          {/* Brand. `flex-1` on the two outer cells (basis 0, equal grow) is what
              centres the nav in the bar; `justify-between` alone would let the
              wider brand push it off-centre. */}
          <NavLink
            to="/"
            onClick={(e) => {
              if (missionExit) {
                e.preventDefault()
                missionExit()
              }
            }}
            className="flex flex-1 shrink-0 items-center gap-2 sm:gap-[14px]"
          >
            <WolfMark className="h-12 text-foreground sm:h-[60px]" />
            {/* Two gotchas on the wordmark. The line-height has to ride on the
                same utility as the font size — a named `text-*` step ships its own
                and would override a `leading-*` inherited from this wrapper. And
                the weight needs `font-variation-settings: normal` to opt out of
                the heading font's pinned 400 axis (theme.css); without it the
                `font-medium` renders at 400 like everything else. Teko is a
                variable face carrying 300–700 in one file, so 500 costs nothing
                extra to load. */}
            <span className="flex flex-col font-heading">
              <span className="text-xl/[0.8] font-medium tracking-[0.08em] text-foreground [font-variation-settings:normal] sm:text-[26px]/[24px]">
                FULLSTACK
              </span>
              <span className="text-xl/[0.8] font-medium tracking-[0.08em] text-foreground [font-variation-settings:normal] sm:text-[26px]/[24px]">
                WOLFPACK
              </span>
              {/* Katakana, not Teko — the display face has no kana, so this line
                  falls through to the sans stack. `font-variation-settings: normal`
                  opts it out of the heading font's pinned 400 axis (theme.css),
                  which would otherwise swallow the weight bump. */}
              <span className="mt-[4px] text-[11px] font-bold tracking-wider text-primary [font-variation-settings:normal] sm:text-[15px]/[15px]">
                ウルフパック
              </span>
            </span>
          </NavLink>

          {/* Primary nav */}
          <nav className={cn('flex items-center gap-4', NAV_GAP)}>
            {NAV.map(({ to, label, end, minWidth }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={cn(
                  // Fixed width so centre-to-centre spacing is even regardless of
                  // label length, and `relative` to hang the underline off.
                  'group relative flex flex-col items-center',
                  UNDERLINE_WIDTH,
                  minWidth ?? 'flex',
                )}
              >
                {({ isActive }) => (
                  <>
                    {/* The active label is plain foreground, not primary — only
                        the underline carries the accent. */}
                    <span
                      className={cn(
                        'font-heading text-lg tracking-wide uppercase transition-colors sm:text-2xl',
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {label}
                    </span>
                    {/* Out of flow, so only the label participates in the bar's
                        vertical centring — in flow it dragged the label upward. */}
                    <span
                      className={cn(
                        'absolute top-full left-0 mt-1 h-[3px] w-full transition-colors',
                        isActive ? 'bg-primary' : 'bg-transparent',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Latency readout + API health + light/dark toggle */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-[23px]">
            {/* <LatencyReadout /> */}
            <span className="hidden items-center gap-3.5 font-mono text-[13px] text-foreground sm:flex">
              <span className="size-2.5 rounded-full bg-green-500" />
              Healthy
            </span>
            <span className="hidden h-[38px] w-px bg-border sm:block" />
            {/* The arbitrary variant sizes the icon, which ThemeToggle otherwise
                fixes at `size-4`. `-mx-2` cancels the button's own padding for
                layout — so it lines up as if it were just the glyph — while the
                button keeps its full 44px tap target. */}
            <ThemeToggle className="-mx-2 [&_svg]:size-7" />
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
      </div>
    </header>
  )
}

// Parked. Decorative latency readout (the number is cosmetic — no real ping
// yet); the green "Healthy" pip in the bar covers the same ground.
/*
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
*/
