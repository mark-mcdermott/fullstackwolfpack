// import { Signal } from 'lucide-react' // parked with LatencyReadout
// import { LayoutDashboard } from 'lucide-react' // parked with the dashboard link
// import { Link } from 'react-router' // parked with the dashboard link
import { useState } from 'react'
import { NavLink } from 'react-router'
import { ThemeToggle, WolfMark } from '@fw/ui'
import { formatClock } from '@/core/focus-session'
import { useAuth } from '@/hooks/auth-context'
import { useDueReviewCount } from '@/hooks/use-due-reviews'
import { useTimer } from '@/hooks/timer-context'
import { useMissionExit } from '@/lib/mission-exit-store'
import { cn } from '@/lib/utils'
import { FwMobileMenu } from './fw-mobile-menu'

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
  badge?: number
}[] = [
  // "Mission" is the launcher at the root, not `/play` — `/play` is Arcade's.
  { to: '/', label: 'Mission', end: true },
  // Named for the one topic on the menu rather than the category, while that
  // is true. Goes back to "Skill(s)" pointing at /skill when there is more
  // than one — /skill still serves the same browse page.
  { to: '/javascript', label: 'JavaScript' },
  { to: '/play', label: 'Arcade' },
  // Parked. There is no guest community surface yet; this pointed at the real
  // page behind RequireAuth so a logged-out click funnelled to /login rather
  // than 404ing on /community.
  // { to: '/app/friends', label: 'Community', minWidth: 'hidden md:flex' },
  // Parked alongside Community — the bar is Play / Learn / Arcade for now.
  // { to: '/leaderboard', label: 'Leaderboard', minWidth: 'hidden lg:flex' },
]

// Signed-in only, appended to NAV below.
//
// The review page has existed and worked for a while behind /app/review with
// nothing linking to it. It stays off the bar for guests for the same reason
// Community is parked above: review cards are keyed to a user id, so a guest
// has nothing to review and the link would funnel to /login. That changes if
// guest cards ever land in localStorage the way guest progress already does.
//
// Shown to everyone now that guests have a review queue of their own
// (lib/guest-review), so it no longer dead-ends at /login — the reason the
// Community item above is still parked.
//
// 820, and like the `lg` it replaces that is measured rather than guessed. It
// used to be `lg` because a fourth roomy item overflowed 768px by 32px with the
// health readout and its divider on the bar too; those are `lg` now (see the
// right-hand cluster below), so this is the two of them trading places rather
// than a fourth item being squeezed in beside it.
//
// The threshold is 820 rather than `md` because it has to clear the *light*
// bar, which is a card inset from the page edges and so has 56px less to give
// than dark at the same width. At 768 that leaves 4px either side of the nav —
// it fits, but the badge sits on the theme control. Slack runs (width - 742)/2
// per side in light, so 820 buys 39px there and 68 in dark. Between 768 and 820
// the bar is the three-item nav, same as below `md`.
const reviewItem = (signedIn: boolean, due: number) => ({
  to: signedIn ? '/app/review' : '/review',
  label: 'Review',
  minWidth: 'hidden min-[820px]:flex',
  badge: due,
})

// The active underline is a fixed width — roughly the width of "ARCADE" — so it
// reads as a consistent marker rather than shrink-wrapping each label. Every
// item reserves it (transparent when inactive) to keep the row from reflowing.
// It is centred on the label rather than being the item's own width, because
// the items size to their labels — see the gap below.
//
// One size, no compact step. There used to be a 44px/16px/18px one for phones,
// from when this nav ran at every width; below `sm` it is the mobile menu's
// list now, so the only widths this renders at are ones with room for the real
// thing. The compact step was in any case narrower than the labels it held —
// a 44px cell under a ~76px "JAVASCRIPT" — so the overflow ate the gap and the
// items ran together.
const UNDERLINE_WIDTH = 'w-[72px]'

// Between the labels, so every gap is the one you actually see.
//
// The items used to be fixed 72px cells, which spaces them evenly centre to
// centre — but the labels run 58px ("Review") to 90px ("JavaScript") and
// overhang their cells by the difference, so what the eye got was 31 / 34 /
// 50px. Arcade and Review are the two shortest, so the hole between them was
// half again the others. Even centres are only even spacing when the things
// being centred are the same width.
const NAV_GAP = 'gap-9'

export function FwHeader() {
  // While a mission is on screen, clicking the brand leaves it (same as the
  // bar's ✕ / "take a break") instead of re-navigating to the already-current
  // route, which would do nothing and strand you in the session.
  const missionExit = useMissionExit()
  // While a mission runs the bar's right-hand cluster becomes the clock. The
  // health pip and the theme control are page furniture; a countdown you are
  // actually racing is not, and it is the one thing worth a fixed position on
  // screen while the session is live.
  const timer = useTimer()
  const onMission = timer.active && !!timer.step
  const { user } = useAuth()
  const dueReviews = useDueReviewCount()
  const nav = [...NAV, reviewItem(!!user, dueReviews)]
  // The mobile menu's own state, held here because its scrim is: see the scrim
  // below, and FwMobileMenu's header comment.
  const [menuOpen, setMenuOpen] = useState(false)
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
      {/* The page dimmed behind the open mobile menu. One token-driven wash
          covers both themes — `--background` is white in light and near-black
          in dark, so the veil goes the way the theme does.
          It lives here, a level above the bar, for what it must *not* cover:
          the brand and the menu button stay lit in the mock, and a `fixed
          inset-0` element inside the bar row could not be kept under them. The
          wrapper below takes `relative z-10` to sit over it; <main> has no
          z-index of its own, so it stays under. */}
      {menuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-background/65 sm:hidden"
        />
      )}
      {/* Light only: the same max-width and horizontal padding as <main>, so the
          card's edges land exactly on the tiles' edges below. Left bare in dark,
          where the bar is full-bleed and there is no card edge to align. */}
      <div className="relative z-10 mx-auto w-full max-w-page light:px-5 light:pt-3 sm:light:px-7 sm:light:pt-4">
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
        <div
          className={cn(
            'flex items-center justify-between gap-2 px-3 py-2 md:gap-4 md:px-9 md:py-4',
            'light:rounded-xl light:border light:border-border light:bg-[#f7f3f2] light:shadow-[var(--card-shadow)]',
            // Dark: separate the bar with *light*, not darkness. It used to be
            // transparent over the darkest part of the page, which read as a
            // heavy band with the wordmark sinking into it. A surface a hair
            // above the page, plus a hairline of light along the bottom edge,
            // makes it belong to the page instead of sitting on top of it.
            'dark:bg-white/[0.022] dark:shadow-[inset_0_-1px_0_rgb(255_255_255/0.05)]',
          )}
        >
          {/* Brand. The two outer cells are `flex-auto` — content-sized, then an
              equal share of what is left — which centres the nav in the gap
              between them. (`justify-between` alone would let the wider brand
              push it off-centre.)
              They were `flex-1`, basis 0, which makes the two cells equal
              *widths* instead and so centres the nav in the bar. Those are the
              same thing only while the brand and the right-hand cluster weigh
              about the same, which stopped being true when the health readout
              moved to `lg`: between md and lg the right side is one icon, and
              the nav sat hard against the wordmark with the empty half of the
              bar to its right. Equal gaps is what actually reads as centred. */}
          <NavLink
            to="/"
            onClick={(e) => {
              if (missionExit) {
                e.preventDefault()
                missionExit()
              }
            }}
            className="flex flex-auto shrink-0 items-center gap-2 md:gap-[14px]"
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
          {/* Off the bar below `sm` and into FwMobileMenu instead. Four labels
              at the compact step still measure ~250px, which on a 375px phone
              leaves them shoulder to shoulder with the brand and each other —
              the row fit, but only just, and it read as crammed. */}
          <nav className={cn('hidden items-center sm:flex', NAV_GAP)}>
            {nav.map(({ to, label, end, minWidth, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={cn(
                  // Sized to its label, so the gap between items is the gap you
                  // see. `relative` hangs the underline and the badge off it.
                  'group relative flex flex-col items-center',
                  minWidth ?? 'flex',
                )}
              >
                {({ isActive }) => (
                  <>
                    {/* Count of what is waiting. Absolutely positioned so it
                        cannot widen the fixed-width cell and throw the nav's
                        centre-to-centre spacing out. */}
                    {!!badge && (
                      <span
                        aria-label={`${badge} review${badge === 1 ? '' : 's'} due`}
                        className="absolute -top-1 -right-0.5 z-10 inline-flex min-w-[17px] items-center justify-center rounded-full bg-primary px-1 py-px font-mono text-[10px]/[13px] font-bold text-primary-foreground tabular-nums shadow-[0_1px_3px_rgb(0_0_0/0.35)]"
                      >
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                    {/* The active label is plain foreground, not primary — only
                        the underline carries the accent. */}
                    <span
                      className={cn(
                        'font-heading text-2xl tracking-wide uppercase transition-colors',
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {label}
                    </span>
                    {/* Out of flow, so only the label participates in the bar's
                        vertical centring — in flow it dragged the label upward.
                        Centred on the label rather than spanning it: the item is
                        the label's width now, and a `w-full` rule would shrink
                        and stretch with each one instead of reading as the same
                        marker moving along the bar.
                        Light keeps the flat accent bar. Dark lights it up: the
                        rule itself ramps from near-black at both ends to a hot
                        core, and `::after` lays a blurred ellipse over the
                        middle for the bloom. Both are centre-weighted because
                        that is what the mock does — a uniform glow along the
                        whole bar reads as a highlighter, not neon. */}
                    <span
                      className={cn(
                        'absolute top-full left-1/2 mt-1 h-[3px] -translate-x-1/2 transition-colors',
                        UNDERLINE_WIDTH,
                        isActive ? 'bg-primary' : 'bg-transparent',
                        isActive &&
                          'dark:bg-[linear-gradient(to_right,#3d0101_0%,#8c0200_22%,#f50104_50%,#8c0200_78%,#3d0101_100%)]',
                        // Bloom parked in the contrast pass: a glowing 3px
                        // rule competed with the hero for first look, and the
                        // graded bar above already reads as lit without it.
                        // isActive &&
                        //   'dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:-inset-y-[5px] dark:after:bg-[radial-gradient(ellipse_at_center,rgba(245,1,4,0.55)_0%,rgba(245,1,4,0.18)_45%,transparent_72%)] dark:after:blur-[3px] dark:after:content-[""]',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Latency readout + API health + light/dark toggle */}
          <div className="flex flex-auto items-center justify-end gap-2 md:gap-[23px]">
            {/* <LatencyReadout /> */}
            {onMission && timer.step ? (
              <span className="flex items-center gap-2.5 font-mono text-[13px] text-foreground">
                <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  {timer.step.phase === 'play' ? 'Play' : 'Learn'}
                </span>
                <span className="text-base tabular-nums">
                  {formatClock(timer.secondsLeft)}
                </span>
                <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  {timer.paused ? 'paused' : `${timer.currentRound}/${timer.rounds}`}
                </span>
              </span>
            ) : (
              <>
                {/* `lg`, so that md–lg spends the room on Review instead. Of the
                    two this is the one worth dropping: it reports a condition
                    that is almost always the same, while Review is the only way
                    to a queue that is only ever waiting because you built it.
                    (Was `md`; before that `user ? 'lg:flex' : 'md:flex'`, to buy
                    the parked dashboard link room — restore that pair here and
                    on the divider below if the link ever comes back.) */}
                <span className="hidden items-center gap-3.5 font-mono text-[13px] text-foreground lg:flex">
                  <span className="size-2.5 rounded-full bg-green-500 dark:bg-green-500/65" />
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
                <span className="hidden h-[38px] w-px bg-border lg:block" />
            {/* The arbitrary variant sizes the icon, which ThemeToggle otherwise
                fixes at `size-4`. `-mx-2` cancels the button's own padding for
                layout — so it lines up as if it were just the glyph — while the
                button keeps its full 44px tap target.
                Scoped to the trigger by its data attribute: a bare `[&_svg]`
                is a descendant selector, so it also caught the icons in the
                open menu — and at 0,1,1 it outranked their own `size-3.5`. */}
                {/* Hidden below `sm` with the nav — the menu that replaces it
                    there carries the same three options. */}
                <ThemeToggle className="-mx-2 hidden sm:block [&_[data-theme-trigger]_svg]:size-7" />
              </>
            )}
            {/* Outside the ternary: the nav is gone from the bar at this width
                whether or not a mission is running, so the way back to it
                cannot be either. */}
            <FwMobileMenu items={nav} open={menuOpen} onOpenChange={setMenuOpen} />
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
