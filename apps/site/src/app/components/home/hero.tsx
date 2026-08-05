import { ArrowRight } from 'lucide-react'
import { Panel } from '@fw/ui'
// import { cn } from '@/lib/utils' // parked with XP_CHIPS

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
    <section className="grid gap-6 lg:grid-cols-[1fr_21rem]">
      {/* Splash card */}
      <Panel
        brackets={false}
        className="relative min-h-[19rem] overflow-hidden rounded-2xl p-0 md:min-h-[22rem] lg:min-h-[24.5rem]"
      >
        {/* Decorative, so the art rides on a background rather than an <img>:
            the theme picks the plate via `--hero-image` (index.css), which keeps
            one DOM tree across themes and fetches only the matching file. The
            punch-up filters are dark-only — they were tuned for the neon plate
            and would blow out the high-key light one. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 h-full w-full bg-[image:var(--hero-image)] bg-cover bg-left [mask-image:linear-gradient(to_right,transparent,black_20%)] md:w-[90%] dark:brightness-105 dark:contrast-[1.12] dark:saturate-[1.25]"
        />
        {/* Theme-colored wash: fades the photo into the card behind the copy,
            then clears well before the skyline so the neon stays punchy — a
            veil carried across the whole photo is what made it read hazy. */}
        <div className="absolute inset-0 bg-gradient-to-r from-card from-25% via-card/85 to-card/40 md:via-card/60 md:via-45% md:to-transparent md:to-64%" />

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
            <h1 className="font-heading text-3xl leading-[0.95] font-bold uppercase sm:text-4xl md:text-7xl">
              <span className="block text-hero-title">Your next level</span>
              <span className="block text-primary">
                Starts here
                <span className="animate-pulse text-primary">_</span>
              </span>
            </h1>
            <div className="mt-5 flex flex-col gap-0.5 font-mono text-sm tracking-wide text-muted-foreground sm:text-base">
              <span>Sharpen your skills.</span>
              <span>Complete real missions.</span>
              <span>Level up every day.</span>
            </div>
          </div>

          <a
            href="#start-session"
            className="group inline-flex h-12 w-fit items-center justify-center gap-2.5 rounded-lg bg-primary px-7 font-mono text-xs font-semibold tracking-widest text-primary-foreground uppercase shadow-[0_0_0_0_transparent] transition-all hover:bg-primary/90 dark:shadow-[0_0_24px_-4px] dark:shadow-primary/60"
          >
            Build your session
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </Panel>

      {/* Akela — a media card: the full portrait (head + jacket) fills it and
          dissolves downward into a scrim so the creed reads over the fade and
          the challenge box sits on the settled base. Theme-aware, so the card
          is light beside a light hero rather than a black slab. */}
      <Panel
        brackets={false}
        className="relative flex flex-col overflow-hidden rounded-2xl p-0"
      >
        {/* Base fill for where the portrait doesn't cover — i.e. the md compact
            layout, where Akela shrinks to the right. Follows the theme: the card
            used to be hard-dark in both, which left a black slab beside a light
            hero. */}
        <div className="pointer-events-none absolute inset-0 bg-card dark:bg-neutral-950" />
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
          className="pointer-events-none absolute inset-y-0 right-0 h-full object-cover object-[center_30%] [mask-image:linear-gradient(to_left,black_55%,transparent),linear-gradient(to_top,transparent,black_35%)] [mask-composite:intersect] md:max-lg:top-5 md:max-lg:right-5 md:max-lg:bottom-auto md:max-lg:h-auto md:max-lg:w-[100px] md:max-lg:rounded-xl md:max-lg:[mask-image:none] lg:top-[5px] lg:bottom-auto lg:h-[75%]"
        />
        {/* Fade the portrait down to the challenge box (media layout only). */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-20% via-card/70 via-65% to-card/95 md:max-lg:hidden dark:via-neutral-950/55 dark:to-neutral-950/95" />

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

          <div className="mt-auto flex flex-col gap-4 md:max-lg:mt-4">
            <blockquote>
              <p className="font-mono text-xs leading-relaxed text-foreground drop-shadow-none max-md:max-w-[70%] dark:text-white dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                &ldquo;Discipline is choosing between what you want now and what
                you want most.&rdquo;
              </p>
              <cite className="mt-1.5 block font-mono text-xs text-primary not-italic">
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
