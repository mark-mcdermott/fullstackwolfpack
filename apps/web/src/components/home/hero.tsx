import { Rocket, Star, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Panel } from '@fw/ui'

// The guest-home hero: the "your next level starts here" splash over the
// skyline, plus Akela's daily-challenge card. Theme-aware (bg-card / border /
// foreground tokens flip light↔dark); the skyline photo stays dark in both
// themes with a `from-card` gradient fading it into the card so the copy reads.
//
// Stats are marketing placeholders for now — no pack-stats endpoint exists yet.
const STATS: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: Users, value: '12,482', label: 'Pack members' },
  { icon: Rocket, value: '1,404', label: 'Current hunts' },
  { icon: Star, value: '210', label: 'XP today' },
]

export function HomeHero() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Splash card */}
      <Panel
        brackets={false}
        className="relative min-h-[17rem] overflow-hidden rounded-2xl p-0 md:min-h-[20rem]"
      >
        <img
          src="/images/footer-1.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-y-0 right-0 h-full w-full object-cover object-center md:w-[64%]"
        />
        {/* Theme-colored wash: fades the photo into the card, stronger on the
            left (behind the copy) and lighter on mobile-vs-desktop. */}
        <div className="absolute inset-0 bg-gradient-to-r from-card from-25% via-card/85 to-card/40 md:via-card/70 md:to-transparent" />

        <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
          <div>
            <h1 className="font-heading text-3xl leading-[0.95] font-bold uppercase sm:text-4xl md:text-5xl">
              <span className="block text-foreground">Your next level</span>
              <span className="block text-primary">
                Starts here.
                <span className="ml-0.5 animate-pulse text-foreground">_</span>
              </span>
            </h1>
            <div className="mt-5 flex flex-col gap-0.5 font-mono text-sm tracking-wide text-muted-foreground sm:text-base">
              <span>Play.</span>
              <span>Pause.</span>
              <span>Learn.</span>
              <span>Return stronger.</span>
            </div>
          </div>

          <dl className="grid max-w-md grid-cols-3 divide-x divide-border border border-border bg-card/70 backdrop-blur-sm">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5 px-3 py-3">
                <Icon className="size-5 shrink-0 text-primary" />
                <div className="flex flex-col leading-tight">
                  <dd className="text-base font-bold tabular-nums text-primary">
                    {value}
                  </dd>
                  <dt className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                    {label}
                  </dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Panel>

      {/* Akela's daily challenge */}
      <Panel
        brackets={false}
        className="flex flex-col overflow-hidden rounded-2xl p-0"
      >
        <div className="relative h-52 shrink-0">
          <img
            src="/images/akela.png"
            alt="Akela, your AI mentor"
            className="h-full w-full object-cover object-[center_10%]"
          />
          <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-4">
            <span className="font-heading text-sm font-bold tracking-widest text-white">
              AKELA
            </span>
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/70" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            &ldquo;Today&rsquo;s challenge: Finish one JavaScript lesson without
            looking anything up.&rdquo;
          </p>
          <Link
            to="/signup"
            className="inline-flex h-10 w-full items-center justify-center gap-2 bg-primary px-4 font-mono text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90"
          >
            Accept Challenge
          </Link>
        </div>
      </Panel>
    </section>
  )
}
