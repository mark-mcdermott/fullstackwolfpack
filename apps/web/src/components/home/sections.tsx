import {
  ArrowRight,
  BookOpen,
  Clock,
  Code,
  Crosshair,
  Gamepad2,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { WolfMark } from '@fw/ui'
import { cn } from '@/lib/utils'

// Akela's creed + the terminal readout, as a bordered card that sits under the
// session launcher. The skyline photo stays dark in both themes; the copy over
// it is light.
export function CreedBand() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <img
        src="/images/creed-bg.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-neutral-950/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-transparent" />
      {/* Darken the right so the terminal readout isn't cluttered by the
          image's baked-in neon text. */}
      <div className="absolute inset-0 bg-gradient-to-l from-neutral-950/90 via-neutral-950/20 to-transparent" />

      <div className="relative flex min-h-[9rem] flex-col justify-center gap-6 p-6 md:flex-row md:items-center md:justify-between md:gap-8 md:px-8">
        <blockquote className="max-w-md">
          <span
            aria-hidden="true"
            className="block font-heading text-5xl leading-none text-primary"
          >
            &ldquo;
          </span>
          <p className="-mt-3 font-mono text-sm leading-relaxed text-neutral-100">
            Discipline is choosing between what you want now and what you want
            most.
          </p>
          <cite className="mt-2 block font-mono text-xs tracking-widest text-primary uppercase not-italic">
            — Akela
          </cite>
        </blockquote>

        <div className="shrink-0 border-white/15 md:border-l md:pl-8">
          <div className="flex flex-col gap-2 font-mono text-sm tracking-wide">
            <span className="text-primary">&gt; LOCK IN</span>
            <span className="text-blue-400">&gt; KEEP LEARNING</span>
            <span className="text-primary">&gt; LEVEL UP</span>
          </div>
          <div className="fw-barcode mt-4 h-3 w-44 text-neutral-500" />
        </div>
      </div>
    </div>
  )
}

const FEATURES: {
  icon: LucideIcon
  color: string
  title: string
  text: string
}[] = [
  {
    icon: Crosshair,
    color: 'text-primary',
    title: 'Practice with purpose',
    text: 'Complete bite-sized missions that build real-world skills.',
  },
  {
    icon: BookOpen,
    color: 'text-fuchsia-500',
    title: 'Learn by doing',
    text: 'Learn in context. Apply it immediately. Level up fast.',
  },
  {
    icon: Gamepad2,
    color: 'text-blue-500',
    title: 'Play. Focus. Win.',
    text: 'Stay in flow with timer-based sessions and epic rewards.',
  },
  {
    icon: Trophy,
    color: 'text-amber-400',
    title: 'Track & improve',
    text: 'See your progress, earn XP, and climb the leaderboard.',
  },
]

export function BuiltForDevs() {
  return (
    <section className="py-8 text-center sm:py-10">
      <h2 className="font-heading text-2xl font-bold tracking-wide text-foreground uppercase sm:text-3xl">
        Built for developers. Designed like a game.
      </h2>
      <p className="mt-2 font-mono text-sm text-muted-foreground">
        Real skills. Real missions. Real progress.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-y-10 sm:grid-cols-2 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-border">
        {FEATURES.map(({ icon: Icon, color, title, text }) => (
          <div key={title} className="flex flex-col items-center gap-3 px-6">
            <Icon className={cn('size-10', color)} strokeWidth={2} />
            <h3 className="font-mono text-sm font-bold tracking-wide text-foreground uppercase">
              {title}
            </h3>
            <p className="max-w-[14rem] font-mono text-xs leading-relaxed text-muted-foreground">
              {text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Gamepad2,
    title: 'Choose a game',
    text: 'Pick a game mode that matches your mood.',
  },
  {
    icon: Code,
    title: 'Select a skill',
    text: 'Learn on the skill you want to level up.',
  },
  {
    icon: Clock,
    title: 'Play & learn',
    text: 'Complete missions while learning between rounds.',
  },
  {
    icon: Star,
    title: 'Earn & level up',
    text: 'Earn XP, unlock content, and become unstoppable.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-8 text-center sm:py-10">
      <h2 className="font-heading text-2xl font-bold tracking-wide text-foreground uppercase sm:text-3xl">
        How it works
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div
            key={title}
            className="relative rounded-xl border border-border p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary font-mono text-xs font-bold text-primary">
                {i + 1}
              </span>
              <Icon className="size-6 text-foreground" strokeWidth={2} />
            </div>
            <h3 className="mt-4 font-mono text-sm font-bold tracking-wide text-foreground uppercase">
              {title}
            </h3>
            <p className="mt-1.5 font-mono text-xs leading-relaxed text-muted-foreground">
              {text}
            </p>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-9 -right-4 hidden h-px w-4 border-t border-dashed border-muted-foreground/40 lg:block"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export function ReadyToJoin() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Red glow bleeding in from the left. */}
      <div className="pointer-events-none absolute -top-12 -left-12 size-56 rounded-full bg-primary/20 blur-3xl" />
      {/* Moody wolf on the far right, faded into the card. */}
      <img
        src="/images/akela.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-y-0 right-0 hidden w-72 object-cover object-[center_20%] opacity-70 md:block"
      />
      <div className="absolute inset-y-0 right-0 hidden w-72 bg-gradient-to-l from-transparent via-card/70 to-card md:block" />

      <div className="relative flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:gap-6 md:p-7">
        <WolfMark className="h-14 shrink-0 text-primary" />
        <div className="flex-1">
          <h3 className="font-heading text-xl font-bold tracking-wide text-foreground uppercase">
            Ready to join the pack?
          </h3>
          <p className="mt-1.5 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
            Create your free account to save progress, unlock lessons, and join
            the community.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-center md:pr-56">
          <Link
            to="/signup"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-mono text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90"
          >
            Create free account
            <ArrowRight className="size-4" />
          </Link>
          <span className="font-mono text-[11px] text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </span>
        </div>
      </div>
    </section>
  )
}
