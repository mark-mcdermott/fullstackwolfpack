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
    // `-mb-6` cancels the page stack's gap so the plate's bottom edge meets the
    // tile below it rather than floating clear of it.
    <section className="-mb-6 grid gap-6 md:grid-cols-[1fr_18rem]">
      {/* Splash. It breaks out of <main>'s px-5/py-6 with matching negative
          margins, so the plate runs edge to edge of the main column and flush
          under the header. At lg it spans both grid columns and Akela's card
          overlays its right end, rather than the plate stopping short of it.
          Transparent, not `bg-card`: the panel sits over the page itself. */}
      <Panel
        brackets={false}
        className="relative -mx-5 -mt-6 min-h-[19rem] overflow-hidden rounded-none border-0 bg-transparent p-0 sm:-mx-7 md:min-h-[22rem] md:col-span-2 md:col-start-1 md:row-start-1 lg:min-h-[28rem]"
      >
        {/* Decorative, so the art rides on a background rather than an <img>:
            the theme picks the plate via `--hero-image` (index.css), which keeps
            one DOM tree across themes and fetches only the matching file. The
            punch-up filters are dark-only — they were tuned for the neon plate
            and would blow out the high-key light one. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 h-full w-auto -translate-x-1/2 aspect-[var(--hero-aspect)] bg-[image:var(--hero-image)] bg-cover bg-center bg-no-repeat [mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)] dark:brightness-105 dark:contrast-[1.12] dark:saturate-[1.25]"
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

        <div className="relative flex h-full flex-col justify-center gap-6 p-6 sm:p-8">
          <div>
            {/* No weight utility: 400 is the heading font's pinned axis, so the
                headline just inherits it — no `font-variation-settings` escape
                needed when the wanted weight is the pin itself. */}
            <h1 className="font-heading text-3xl leading-[0.85] tracking-tight uppercase sm:text-4xl md:text-[80px]">
              <span className="block text-hero-title">Your next level</span>
              <span className="block text-primary">
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

          <a href="#start-session" className={cn(raisedCtaClass, 'group')}>
            Build your session
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </Panel>

      {/* Akela — a media card: the full portrait (head + jacket) fills it and
          dissolves downward into a scrim so the creed reads over the fade and
          the challenge box sits on the settled base. Theme-aware, so the card
          is light beside a light hero rather than a black slab. */}
      <Panel
        brackets={false}
        className="relative z-10 flex flex-col overflow-hidden rounded-2xl p-0 light:border-[#e2dfde] light:bg-[#f7f4f3] light:shadow-[var(--card-shadow)] md:col-start-2 md:row-start-1 md:mb-6"
      >
        {/* Base fill for where the portrait doesn't cover — i.e. the md compact
            layout, where Akela shrinks to the right. Follows the theme: the card
            used to be hard-dark in both, which left a black slab beside a light
            hero. */}
        <div className="pointer-events-none absolute inset-0 bg-card light:bg-[#f7f4f3] dark:bg-neutral-950" />
        {/* Portrait pinned to the right (natural width via left:auto — the img
            is a replaced element, so no w-full); a small thumbnail in the md
            compact layout. The mask feathers the photo's own dark backdrop into
            the card on the left and bottom — without it the image reads as a
            grey rectangle pasted onto the light card (invisible in dark, where
            the backdrop matches). The compact thumbnail keeps its hard rounded
            edge, so the mask is lifted there. */}
        <img
          src="/images/akela.png"
          alt="Akela, your AI mentor"
          className="pointer-events-none absolute inset-y-0 right-0 h-full object-cover object-[center_30%] [mask-image:linear-gradient(to_left,black_55%,transparent),linear-gradient(to_top,transparent,black_35%)] [mask-composite:intersect] md:top-[5px] md:bottom-auto md:h-[75%]"
        />
        {/* Fade the portrait down to the challenge box (media layout only). */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-20% via-card/70 via-65% to-card/95 light:via-[#f7f4f3]/70 light:to-[#f7f4f3]/95 dark:via-neutral-950/55 dark:to-neutral-950/95" />
        {/* The bright inner rule. It rides above the portrait and its scrim —
            both are inset-0 siblings, so a ring on the panel itself would be
            painted straight over. */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl light:shadow-[inset_0_0_0_2px_#fdfdfb]" />

        <div className="relative flex flex-1 flex-col p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold tracking-widest text-foreground dark:text-white">
                AKELA
              </span>
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/70" />
            </div>
            <span className="mt-1 block font-mono text-[10px] font-bold tracking-widest text-primary uppercase">
              Leader of the pack
            </span>
          </div>

          <div className="mt-auto flex flex-col gap-4 ">
            {/* The quote sits over the portrait, so it carries its own halo.
                A blurred shape rather than a radial-gradient background: a
                gradient still ends on a geometric curve, which reads as a
                visible oval no matter how long the ramp. Blurring a solid form
                has no edge to find. It is a sibling, not a background, because
                `filter` would blur the text with it. */}
            <blockquote className="relative max-w-[80%]">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-7 -inset-y-5 rounded-[50%] blur-2xl light:bg-[#f7f4f3] dark:bg-[#0a0a0a]"
              />
              <p className="relative font-mono text-[11px] leading-relaxed text-foreground drop-shadow-none dark:text-white dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                &ldquo;Discipline is choosing between what you want now and what
                you want most.&rdquo;
              </p>
              <cite className="relative mt-1.5 block font-mono text-[11px] font-bold text-primary not-italic">
                — Akela
              </cite>
            </blockquote>

            <div className="rounded-lg border border-border bg-muted/40 p-3 dark:border-white/15 dark:bg-[#161616]">
              <span className="block font-mono text-[10px] leading-none font-bold tracking-widest text-muted-foreground uppercase dark:text-white/60">
                Today&rsquo;s challenge
              </span>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="font-mono text-xs leading-relaxed text-muted-foreground dark:text-white/80">
                  Finish one JavaScript lesson without looking anything up.
                </p>
                <span className="shrink-0 font-mono text-xs font-bold text-primary">
                  0&nbsp;/&nbsp;1
                </span>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  )
}
