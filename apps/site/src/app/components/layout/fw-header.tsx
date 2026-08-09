// import { Signal } from 'lucide-react' // parked with LatencyReadout
// import { LayoutDashboard } from 'lucide-react' // parked with the dashboard link
// import { Link } from 'react-router' // parked with the dashboard link
import { NavLink } from 'react-router'
import { ThemeToggle, WolfMark } from '@fw/ui'
import { useMissionExit } from '@/lib/mission-exit-store'
import { cn } from '@/lib/utils'

// FW-01 header — a full-width bar with the wolf brand, the primary nav (label
// only, active in red over a fixed-width underline), a latency readout, an API
// health pip, and the light/dark toggle. Used on the guest surfaces (`/`,
// `/skill`, `/play`) and the auth pages.
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
  // "Mission" is the launcher at the root, not `/play` — `/play` is Arcade's.
  { to: '/', label: 'Mission', end: true },
  // Singular while there is one skill to browse; it becomes "Skills" when
  // there is more than one.
  { to: '/skill', label: 'Skill' },
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
const UNDERLINE_WIDTH = 'w-11 md:w-[72px]'

// Item width is the underline's, so centre-to-centre spacing is 72 + gap.
const NAV_GAP = 'md:gap-[36px]'

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
      <div className="mx-auto w-full max-w-page light:px-5 light:pt-3 sm:light:px-7 sm:light:pt-4">
        {/* Brand + nav + toggle all refuse to shrink, so below the roomy step
            every gap and type size tightens instead — the row overflowed the
            viewport on 320–370px phones otherwise.

            That step is `md`, not `sm`. Roomy needs ~756px (the nav alone goes
            164→288 when the underline hits 72px and the gap 36px, and the health
            readout and its divider appear beside it), so firing it at 640 put
            116px of bar past the edge and only came right at 768. The compact
            form needs ~633px, so it covers the whole 640–767 band with room
            over. Only the bar row moves; the light card's own `sm:` padding on
            the wrapper above stays, since it is pinned to <main>'s. */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 md:gap-4 md:px-9 md:py-4 light:rounded-xl light:border light:border-border light:bg-[#f7f3f2] light:shadow-[var(--card-shadow)]">
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
            className="flex flex-1 shrink-0 items-center gap-2 md:gap-[14px]"
          >
            <WolfMark className="h-12 text-foreground md:h-[60px]" />
            {/* Two gotchas on the wordmark. The line-height has to ride on the
                same utility as the font size — a named `text-*` step ships its own
                and would override a `leading-*` inherited from this wrapper. And
                the weight needs `font-variation-settings: normal` to opt out of
                the heading font's pinned 400 axis (theme.css); without it the
                `font-medium` renders at 400 like everything else. Teko is a
                variable face carrying 300–700 in one file, so 500 costs nothing
                extra to load. */}
            {/* Mark only on the narrowest phones. Brand + nav + toggle need
                ~341px and light has 40px less than dark to give (the card's
                own gutter), so light broke at 375 while dark still fit; hiding
                the wordmark buys ~78px and clears both, with the nav gap below
                taking the last few for 320. The threshold is 400 rather than a
                named step because that is where the measurement turns — light
                is clean at 390 — and `sm` would have dropped the wordmark off
                tablets that have room for it twice over. */}
            <span className="hidden flex-col font-heading min-[400px]:flex">
              <span className="text-xl/[0.8] font-medium tracking-[0.08em] text-foreground [font-variation-settings:normal] md:text-[26px]/[24px]">
                FULLSTACK
              </span>
              <span className="text-xl/[0.8] font-medium tracking-[0.08em] text-foreground [font-variation-settings:normal] md:text-[26px]/[24px]">
                WOLFPACK
              </span>
              {/* Katakana, not Teko — the display face has no kana, so this line
                  falls through to the sans stack. `font-variation-settings: normal`
                  opts it out of the heading font's pinned 400 axis (theme.css),
                  which would otherwise swallow the weight bump. */}
              <span className="mt-[4px] text-[11px] font-bold tracking-wider text-primary [font-variation-settings:normal] md:text-[15px]/[15px]">
                ウルフパック
              </span>
            </span>
          </NavLink>

          {/* Primary nav */}
          {/* The tighter gap rides the same 400px threshold as the wordmark: it
              is the last 8px that gets a 320px viewport under the line. */}
          <nav className={cn('flex items-center gap-3 min-[400px]:gap-4', NAV_GAP)}>
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
                        'font-heading text-lg tracking-wide uppercase transition-colors md:text-2xl',
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {label}
                    </span>
                    {/* Out of flow, so only the label participates in the bar's
                        vertical centring — in flow it dragged the label upward.
                        Light keeps the flat accent bar. Dark lights it up: the
                        rule itself ramps from near-black at both ends to a hot
                        core, and `::after` lays a blurred ellipse over the
                        middle for the bloom. Both are centre-weighted because
                        that is what the mock does — a uniform glow along the
                        whole bar reads as a highlighter, not neon. */}
                    <span
                      className={cn(
                        'absolute top-full left-0 mt-1 h-[3px] w-full transition-colors',
                        isActive ? 'bg-primary' : 'bg-transparent',
                        isActive &&
                          'dark:bg-[linear-gradient(to_right,#3d0101_0%,#8c0200_22%,#f50104_50%,#8c0200_78%,#3d0101_100%)]',
                        isActive &&
                          'dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:-inset-y-[5px] dark:after:bg-[radial-gradient(ellipse_at_center,rgba(245,1,4,0.55)_0%,rgba(245,1,4,0.18)_45%,transparent_72%)] dark:after:blur-[3px] dark:after:content-[""]',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Latency readout + API health + light/dark toggle */}
          <div className="flex flex-1 items-center justify-end gap-2 md:gap-[23px]">
            {/* <LatencyReadout /> */}
            {/* Back to one breakpoint for everyone now the dashboard link is
                parked. It was `user ? 'lg:flex' : 'md:flex'` only to buy that
                link room at md — restore the pair here and on the divider below
                if the link ever comes back. */}
            <span className="hidden items-center gap-3.5 font-mono text-[13px] text-foreground md:flex">
              <span className="size-2.5 rounded-full bg-green-500" />
              Healthy
            </span>
            {/* Parked. The icon-only way into the app shell, shown to signed-in
                users only. `/` is the front door for them too now and this bar
                is the only chrome they get there, so without it the sidebar's
                surfaces (Dashboard, Sessions, Topics, Friends) are unreachable
                from the page they land on — restore it if that becomes a dead
                end again. It carried ThemeToggle's `-mx-2` trick: a 44px tap
                target occupying only the glyph's width in layout, which is what
                kept the row inside the viewport at the narrow end.
            {user && (
              <Tooltip label="Dashboard" side="bottom" align="end">
                <Link
                  to="/app"
                  aria-label="Dashboard"
                  className="-mx-2 inline-flex items-center justify-center p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LayoutDashboard className="size-6" />
                </Link>
              </Tooltip>
            )} */}
            <span className="hidden h-[38px] w-px bg-border md:block" />
            {/* The arbitrary variant sizes the icon, which ThemeToggle otherwise
                fixes at `size-4`. `-mx-2` cancels the button's own padding for
                layout — so it lines up as if it were just the glyph — while the
                button keeps its full 44px tap target.
                Scoped to the trigger by its data attribute: a bare `[&_svg]`
                is a descendant selector, so it also caught the icons in the
                open menu — and at 0,1,1 it outranked their own `size-3.5`. */}
            <ThemeToggle className="-mx-2 [&_[data-theme-trigger]_svg]:size-7" />
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
        <span className="font-mono text-sm font-bold tabular-nums text-accent-blue">
          23 ms
        </span>
        <Signal className="size-4 text-muted-foreground" strokeWidth={2} />
      </div>
    </div>
  )
}
*/
