import { ArrowRight } from 'lucide-react'
import { Panel, raisedCtaClass } from '@fw/ui'
import { cn } from '@/lib/utils'

// Parked. Floating XP chips scattered over the skyline — the "you are earning"
// motif from the mock. Positions are hand-placed against the photo so they sit
// in the sky rather than on the figure; hidden below `md`, where the photo is
// masked down to a narrow strip and they would collide with the copy.
/*
const XP_CHIPS: { className: string; tone: string }[] = [
  { className: 'top-[14%] left-[46%]', tone: 'text-blue-300 border-blue-400/40' },
  { className: 'top-[30%] left-[70%]', tone: 'text-blue-300 border-blue-400/40' },
  { className: 'top-[52%] left-[40%]', tone: 'text-blue-300 border-blue-400/40' },
  { className: 'top-[64%] left-[78%]', tone: 'text-primary border-primary/40' },
  { className: 'top-[40%] left-[88%]', tone: 'text-primary border-primary/40' },
]
*/

// The guest-home hero: the "your next level starts here" splash over the
// skyline, plus Akela's card (creed + daily challenge).
// Theme-aware (bg-card / border / foreground tokens flip light↔dark); the
// skyline photo stays dark in both themes with a `from-card` gradient fading it
// into the card so the copy reads.
//
// The CTA is a *scroll link*, not a second action: it jumps to the launcher
// rather than quick-starting DEFAULT_SESSION, which would be the same action
// twice. The mock gives it solid-primary weight, so the page now carries two
// solid buttons (this and START MISSION) — they are the same journey, one
// scrolling to the other, and it earns the weight on mobile where the
// launcher's button sits well below the fold.
export function HomeHero() {
  return (
    // Two layouts, one tree. At lg this is the grid that lets Akela's card
    // overlay the plate, and `-mb-6` cancels the page stack's gap so the plate's
    // bottom edge meets the tile below it rather than floating clear of it.
    //
    // Below lg it is `display: contents` — the section stops generating a box,
    // so the plate and Akela become children of the page stack itself (a
    // `flex flex-col gap-6` in guest-home) and can be ordered against the
    // launcher that follows them. That is the only way to get Akela *below* the
    // launcher without hoisting it out of this component: `order` cannot reach
    // across a wrapper element. The stack's own gap-6 replaces this grid's.
    <section className="contents lg:-mb-6 lg:grid lg:gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Splash. It breaks out of <main>'s px-5/py-6 with matching negative
          margins, so the plate runs edge to edge of the main column and flush
          under the header. At lg it spans both grid columns and Akela's card
          overlays its right end, rather than the plate stopping short of it.
          Below lg the two stack instead: the plate is a fixed box (740px at md,
          not viewport-tracking), so a 320px card sitting on it buried 42-45% of
          the art — and in light that is exactly where the seated figure is.
          `max-lg:-mb-6` carries the flush bottom edge once the section is
          `contents` and its own -mb-6 no longer applies.
          Transparent, not `bg-card`: the panel sits over the page itself. */}
      <Panel
        brackets={false}
        className="relative -mx-5 -mt-6 min-h-[19rem] overflow-hidden rounded-none border-0 bg-transparent p-0 max-lg:-mb-6 sm:-mx-7 md:min-h-[22rem] lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:min-h-[28rem]"
      >
        {/* Decorative, so the art rides on a background rather than an <img>:
            the theme picks the plate via `--hero-image` (index.css), which keeps
            one DOM tree across themes and fetches only the matching file. The
            punch-up filters are dark-only — they were tuned for the neon plate
            and would blow out the high-key light one.

            Placed the same way in both themes, at every width. That only works
            because the two plates now share a composition and an exact size
            (1280x650), so one `--hero-aspect` covers both and neither needs a
            per-theme nudge to keep its subject off the headline.

            The wolf sits at ~51.5% of the artwork, so centring the plate centres
            *him* — which is right at lg and up, where Akela's card overlays the
            plate's right end and leaves him at ~73% of the visible band, but
            reads as dead-centre below lg, where nothing overlays and the whole
            plate is the visible band. So below lg he is placed directly: `left`
            is where he should land in the plate and the translate is where he
            already sits in the art, which puts him at that same 73% at every
            width without a per-breakpoint nudge.

            He lands right of the headline rather than on it, so the art's left
            edge pulls in past the plate at the wider end of this range. That is
            the mask's left fade doing its job — the plate is transparent, so the
            art ramps into the page behind the headline instead of butting
            against it. Zooming the art to fill that edge instead was the
            alternative, and it cost the rooftop and the moon.

            sm and md take a deeper translate. `left` is subtracted from, so past
            51.5% the art walks back left and takes the wolf with it — he settles
            near 65% instead of 73%, and the left edge pulls in that much less.
            This is the band where the plate is widest with nothing overlaying
            it, so it is the one that carries the most bare edge. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-[73%] h-full w-auto -translate-x-[51.5%] aspect-[var(--hero-aspect)] bg-[image:var(--hero-image)] bg-cover bg-center bg-no-repeat [mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)] sm:-translate-x-[60%] lg:left-1/2 lg:-translate-x-1/2 dark:brightness-[0.94] dark:contrast-[1.0] dark:saturate-[0.76] dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:bg-[radial-gradient(120%_80%_at_50%_18%,color-mix(in_oklab,var(--background)_30%,transparent)_0%,color-mix(in_oklab,var(--background)_10%,transparent)_46%,transparent_78%)]"
        />

        {/* Parked with XP_CHIPS above.
        {XP_CHIPS.map(({ className, tone }, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute hidden rounded border bg-black/30 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest backdrop-blur-[2px] md:block',
              className,
              tone,
            )}
          >
            XP
          </span>
        ))} */}

        {/* `isolate` is load-bearing, not tidiness: it opens a stacking context so
            the glow below can sit at z-index -1 *inside* this layer — under the
            copy but still above the plate art, which is the only place a
            legibility pool does anything. Without it the -1 escapes to <main>
            and lands under the art, where the art hides it. */}
        <div className="hero-glow relative isolate flex h-full flex-col justify-center gap-6 p-6 sm:p-8">
          <div>
            {/* No weight utility: 400 is the heading font's pinned axis, so the
                headline just inherits it — no `font-variation-settings` escape
                needed when the wanted weight is the pin itself. */}
            <h1 className="font-heading text-3xl leading-[0.85] tracking-tight uppercase sm:text-4xl md:text-[80px]">
              {/* Dark grades each line top-to-bottom, sampled off the mock.
                  `bg-clip-text` over a transparent fill, so the flat token
                  colour still carries light. */}
              <span className="block text-hero-title dark:bg-[linear-gradient(180deg,#ffffff_0%,#e6e4e1_28%,#c8c6c2_55%,#b4b2af_80%,#6a6a68_100%)] dark:bg-clip-text dark:text-transparent">
                Your next level
              </span>
              <span className="block text-primary dark:bg-[linear-gradient(180deg,#f00004_0%,#d40103_30%,#b00102_60%,#8c0103_85%,#6e0206_100%)] dark:bg-clip-text dark:text-transparent">
                Starts here
                {/* `inline-block` so the transform lands at all — and scale-x
                    rather than a smaller font-size, so the cursor loses width
                    without also losing its stroke weight. */}
                <span className="inline-block -translate-y-[4px] scale-x-[0.67] animate-pulse text-primary">
                  _
                </span>
              </span>
            </h1>
            <div className="mt-5 flex flex-col gap-0.5 font-mono text-sm font-light tracking-tight text-hero-title sm:text-base">
              <span>Sharpen your skills.</span>
              <span>Complete real missions.</span>
              <span>Level up every day.</span>
            </div>
          </div>

          <a href="#start-session" className={cn(raisedCtaClass, 'cta-ember group')}>
            Build your session
            {/* Red in dark, matching the mock — this is the only one of the
                three CTAs whose arrow is not white. */}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5 dark:text-[#ea2a22]" />
          </a>
        </div>
      </Panel>

      {/* Akela — a media card: the full portrait (head + jacket) fills it and
          dissolves downward into a scrim so the creed reads over the fade and
          the challenge box sits on the settled base. Theme-aware, so the card
          is light beside a light hero rather than a black slab. */}
      <Panel
        brackets={false}
        className="relative z-10 flex flex-col overflow-hidden rounded-2xl p-0 light:border-[#dbd7d7] light:bg-[#f7f4f3] light:shadow-[var(--card-shadow)] max-lg:order-1 lg:col-start-2 lg:row-start-1 lg:mb-6"
      >
        {/* Base fill behind the portrait — it is a cutout on transparency, and
            in the lg column layout Akela shrinks to the right besides. Follows
            the theme: the card used to be hard-dark in both, which left a black
            slab beside a light hero. */}
        <div className="pointer-events-none absolute inset-0 bg-card light:bg-[#f7f4f3]" />
        {/* Portrait pinned to the right (natural width via left:auto — the img
            is a replaced element, so no w-full); a small thumbnail once the card
            is the narrow lg column. The artwork carries no backdrop of its own, so the
            card colour reads behind it in either theme and the mask is left
            with one job: softening where the card crops the jacket, out to the
            left and down into the scrim below. */}
        <img
          src="/images/akela.webp"
          alt="Akela, your AI mentor"
          className="pointer-events-none absolute inset-y-0 right-0 h-full object-cover object-[center_30%] dark:brightness-[0.82] dark:contrast-[0.94] [mask-image:linear-gradient(to_left,black_55%,transparent),linear-gradient(to_top,transparent,black_35%)] [mask-composite:intersect] lg:top-[5px] lg:bottom-auto lg:h-[75%]"
        />
        {/* Fade the portrait down to the challenge box (media layout only). */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-20% via-card/70 via-65% to-card/95 light:via-[#f7f4f3]/70 light:to-[#f7f4f3]/95" />
        {/* The bright inner rule. It rides above the portrait and its scrim —
            both are inset-0 siblings, so a ring on the panel itself would be
            painted straight over. */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl light:shadow-[inset_0_0_0_2px_#fdfdfb]" />

        <div className="relative flex flex-1 flex-col p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-3xl font-bold tracking-wide text-foreground dark:text-white">
                AKELA
              </span>
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/70 dark:shadow-none" />
            </div>
            <span className="mt-1 block font-mono text-[11px] font-semibold tracking-tighter text-primary uppercase [word-spacing:-0.08em]">
              Leader of the pack
            </span>
          </div>

          <div className="mt-auto flex flex-col">
            {/* The quote sits over the portrait, so it carries its own halo.
                A blurred shape rather than a radial-gradient background: a
                gradient still ends on a geometric curve, which reads as a
                visible oval no matter how long the ramp. Blurring a solid form
                has no edge to find. It is a sibling, not a background, because
                `filter` would blur the text with it. */}
            <blockquote className="relative max-w-[75%]">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-7 -inset-y-5 rounded-[50%] blur-2xl light:bg-[#f7f4f3] dark:bg-[#0a0a0a]"
              />
              <p className="relative font-mono text-[11px] leading-relaxed tracking-tight drop-shadow-none light:text-[#313241] dark:text-white dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                &ldquo;Discipline is choosing between what you want now and what
                you want most.&rdquo;
              </p>
              <cite className="relative mt-1.5 block font-mono text-[11px] font-bold text-primary not-italic">
                — Akela
              </cite>
            </blockquote>

            {/* Parked: a card inside a card. The quote takes the foot of the
                panel on its own now — it was already `mt-auto`'d, so nothing
                else had to move. Restore this and the wrapper's `gap-4` 
                together; without the gap the two would sit flush.
            {/* Inner rule is uneven by design — 10px along the top and right, 1px
                on the left and bottom — so it reads as a lit edge rather than a
                uniform ring. Built as an eggshell fill plus an inset interior
                plate rather than four inset shadows: the bevel is wider than the
                10px corner radius, and an inner corner can never be rounder than
                the outer one it is cut from, so a shadow (or a border) leaves a
                square notch at the top right. The plate carries its own radius. * /}
            <div className="relative rounded-lg border border-border pt-5 pr-5 pb-4 pl-3 light:border-[#dddfe3] light:bg-[#fcfcfb] dark:border-white/15 dark:bg-[#161616]">
              {/* Opaque, not `bg-muted/40`: the plate now sits on the eggshell
                  rather than on the card, and 40% over the lighter fill washed
                  the bevel out to half its contrast. This is that blend, fixed. * /}
              <div className="pointer-events-none absolute top-[10px] right-[10px] bottom-px left-px rounded-md light:bg-[#f7f4f4]" />
              <span className="relative block font-mono text-xs leading-none font-semibold tracking-tight text-hero-title uppercase light:text-[#04040d]">
                Today&rsquo;s challenge
              </span>
              <div className="relative mt-3 flex items-end justify-between gap-3">
                <p className="font-mono text-[11px] leading-relaxed tracking-tight text-hero-title">
                  Finish one JavaScript lesson without looking anything up.
                </p>
                <span className="shrink-0 font-mono text-xs font-bold text-primary">
                  0&nbsp;/&nbsp;1
                </span>
              </div>
            </div>
            */}
          </div>
        </div>
      </Panel>
    </section>
  )
}
