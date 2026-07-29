import { ArrowRight } from 'lucide-react'
import { Panel } from '@fw/ui'

// The guest-home hero: the "your next level starts here" splash over the
// skyline + a first-mission CTA, plus Akela's card (creed + daily challenge).
// Theme-aware (bg-card / border / foreground tokens flip light↔dark); the
// skyline photo stays dark in both themes with a `from-card` gradient fading it
// into the card so the copy reads.
export function HomeHero() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_21rem]">
      {/* Splash card */}
      <Panel
        brackets={false}
        className="relative min-h-[16rem] overflow-hidden rounded-2xl p-0 md:min-h-[19rem]"
      >
        <img
          src="/images/footer-1.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-y-0 right-0 h-full w-full object-cover object-center md:w-[62%]"
        />
        {/* Theme-colored wash: fades the photo into the card, stronger on the
            left (behind the copy) and lighter on mobile-vs-desktop. */}
        <div className="absolute inset-0 bg-gradient-to-r from-card from-25% via-card/85 to-card/40 md:via-card/70 md:to-transparent" />

        <div className="relative flex h-full flex-col justify-center gap-6 p-6 sm:p-8">
          <div>
            <h1 className="font-heading text-3xl leading-[0.95] font-bold uppercase sm:text-4xl md:text-5xl">
              <span className="block text-foreground">Your next level</span>
              <span className="block text-primary">
                Starts here
                <span className="animate-pulse text-foreground">_</span>
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
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-primary px-6 font-mono text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90"
          >
            Start your first mission
            <ArrowRight className="size-4" />
          </a>
        </div>
      </Panel>

      {/* Akela — creed + today's challenge */}
      <Panel
        brackets={false}
        className="flex flex-col overflow-hidden rounded-2xl p-0"
      >
        <div className="relative h-44 shrink-0">
          <img
            src="/images/akela.png"
            alt="Akela, your AI mentor"
            className="h-full w-full object-cover object-[center_12%]"
          />
          <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-4">
            <span className="font-heading text-sm font-bold tracking-widest text-white">
              AKELA
            </span>
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/70" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <blockquote>
            <p className="font-mono text-xs leading-relaxed text-foreground">
              &ldquo;Discipline is choosing between what you want now and what
              you want most.&rdquo;
            </p>
            <cite className="mt-1.5 block font-mono text-xs text-primary not-italic">
              — Akela
            </cite>
          </blockquote>

          <div className="mt-auto rounded-lg border border-border p-3">
            <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Today&rsquo;s challenge
            </span>
            <div className="mt-1.5 flex items-end justify-between gap-3">
              <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                Finish one JavaScript lesson without looking anything up.
              </p>
              <span className="shrink-0 font-mono text-xs font-bold text-primary">
                0&nbsp;/&nbsp;1
              </span>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  )
}
