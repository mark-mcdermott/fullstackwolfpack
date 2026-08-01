import { ArrowDown } from 'lucide-react'
import { Panel } from '@fw/ui'

// The guest-home hero: the "your next level starts here" splash over the
// skyline, plus Akela's card (creed + daily challenge).
// Theme-aware (bg-card / border / foreground tokens flip light↔dark); the
// skyline photo stays dark in both themes with a `from-card` gradient fading it
// into the card so the copy reads.
//
// The CTA is deliberately an outlined *scroll link*, not a second primary: the
// launcher below owns the one solid button on the page. It used to quick-start
// with DEFAULT_SESSION, which is the launcher's own initial state — the same
// action twice, at the same visual weight. It earns its place on mobile, where
// the launcher's button sits well below the fold.
export function HomeHero() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_21rem]">
      {/* Splash card */}
      <Panel
        brackets={false}
        className="relative min-h-[19rem] overflow-hidden rounded-2xl p-0 md:min-h-[22rem] lg:min-h-[24.5rem]"
      >
        <img
          src="/images/footer-1.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-y-0 right-0 h-full w-full object-cover object-left brightness-105 contrast-[1.12] saturate-[1.25] [mask-image:linear-gradient(to_right,transparent,black_20%)] md:w-[62%]"
        />
        {/* Theme-colored wash: fades the photo into the card behind the copy,
            then clears well before the skyline so the neon stays punchy — a
            veil carried across the whole photo is what made it read hazy. */}
        <div className="absolute inset-0 bg-gradient-to-r from-card from-25% via-card/85 to-card/40 md:via-card/60 md:via-45% md:to-transparent md:to-64%" />

        <div className="relative flex h-full flex-col justify-center gap-6 p-6 sm:p-8">
          <div>
            <h1 className="font-heading text-3xl leading-[0.95] font-bold uppercase sm:text-4xl md:text-5xl">
              <span className="block text-foreground">Your next level</span>
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
            className="group inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-primary/50 px-6 font-mono text-xs font-semibold tracking-widest text-primary uppercase transition-colors hover:border-primary hover:bg-primary/10"
          >
            Build your session
            <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
          </a>
        </div>
      </Panel>

      {/* Akela — a dark media card: the full portrait (head + jacket) fills it
          and dissolves downward into a dark scrim so the creed reads over the
          fade and the challenge box sits on the darkened base. Stays dark in
          both themes (like the skyline bands). */}
      <Panel
        brackets={false}
        className="relative flex flex-col overflow-hidden rounded-2xl p-0"
      >
        {/* Dark base so the card stays dark where the portrait doesn't cover it
            — i.e. the md compact layout, where Akela shrinks to the right. */}
        <div className="pointer-events-none absolute inset-0 bg-neutral-950" />
        {/* Portrait pinned to the right (natural width via left:auto — the img
            is a replaced element, so no w-full); a small thumbnail in the md
            compact layout. */}
        <img
          src="/images/akela.png"
          alt="Akela, your AI mentor"
          className="pointer-events-none absolute inset-y-0 right-0 h-full object-cover object-[center_30%] md:max-lg:top-5 md:max-lg:right-5 md:max-lg:bottom-auto md:max-lg:h-auto md:max-lg:w-[100px] md:max-lg:rounded-xl lg:top-[5px] lg:bottom-auto lg:h-[75%]"
        />
        {/* Fade the portrait down to the challenge box (media layout only). */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-20% via-neutral-950/55 via-65% to-neutral-950/95 md:max-lg:hidden" />

        <div className="relative flex flex-1 flex-col p-5">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-bold tracking-widest text-white">
              AKELA
            </span>
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/70" />
          </div>

          <div className="mt-auto flex flex-col gap-4 md:max-lg:mt-4">
            <blockquote>
              <p className="font-mono text-xs leading-relaxed text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] max-md:max-w-[70%]">
                &ldquo;Discipline is choosing between what you want now and what
                you want most.&rdquo;
              </p>
              <cite className="mt-1.5 block font-mono text-xs text-primary not-italic">
                — Akela
              </cite>
            </blockquote>

            <div className="rounded-lg border border-white/15 bg-[#161616] p-3">
              <span className="block font-mono text-[10px] leading-none font-bold tracking-widest text-white/60 uppercase">
                Today&rsquo;s challenge
              </span>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="font-mono text-xs leading-relaxed text-white/80">
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
