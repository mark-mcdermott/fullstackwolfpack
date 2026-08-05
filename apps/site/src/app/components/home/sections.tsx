import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  Code,
  Gamepad2,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { WolfMark, raisedCtaClass } from '@fw/ui'
import { cn } from '@/lib/utils'

// Akela's creed + the terminal readout, as a bordered card that sits under the
// session launcher. Theme-aware: in dark the skyline burns through against a
// near-black scrim; in light the same photo is knocked back to a pale wash so
// the dark copy reads over it (the band used to be hard-dark in both themes,
// which left a black slab sitting in the middle of the light page).
export function CreedBand() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card light:bg-[#f8f6f4]">
      <img
        src="/images/creed-bg.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-45 dark:opacity-100 md:[mask-image:linear-gradient(to_right,transparent,black_30%,black_85%,transparent)]"
      />
      {/* Scrims are drawn in the card colour, so they follow the theme. */}
      <div className="absolute inset-0 bg-card/35 dark:bg-neutral-950/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/50 to-transparent dark:from-neutral-950 dark:via-neutral-950/40" />
      {/* Knock back the right so the terminal readout isn't cluttered by the
          image's baked-in neon text. */}
      <div className="absolute inset-0 bg-gradient-to-l from-card/90 via-card/30 to-transparent dark:from-neutral-950/90 dark:via-neutral-950/20" />
      {/* Inner rule on top of the art and its scrims — they are inset-0
          siblings, so a ring on the band itself would be painted over. */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl light:shadow-[inset_0_0_0_2px_#fdfdfb]" />

      <div className="relative flex min-h-[9rem] flex-col justify-center gap-6 p-6 md:flex-row md:items-center md:justify-between md:gap-8 md:px-8">
        <div className="max-w-md">
          <span className="block font-mono text-[10px] font-medium tracking-widest text-primary uppercase">
            The Wolfpack Creed
          </span>
          <p className="mt-3 font-heading text-2xl leading-[1.05] font-bold tracking-wide text-foreground uppercase sm:text-[1.75rem] dark:text-neutral-50">
            Discipline over motivation.
          </p>
          <p className="mt-2.5 max-w-sm font-mono text-xs leading-relaxed text-muted-foreground dark:text-neutral-300">
            Short sessions, stacked every day — that's how the pack levels up.
          </p>
        </div>

        <div className="shrink-0 border-border md:border-l md:pl-8 dark:border-white/15">
          <div className="flex flex-col gap-2 font-mono text-sm tracking-wide">
            <span className="text-primary">&gt; LOCK IN</span>
            <span className="text-blue-600 dark:text-blue-400">
              &gt; KEEP LEARNING
            </span>
            <span className="text-primary">&gt; LEVEL UP</span>
          </div>
          <div className="fw-barcode mt-4 h-3 w-44 text-muted-foreground dark:text-neutral-500" />
        </div>
      </div>
    </div>
  )
}


// The Wolf's Path — the six-step loop, laid out as a connected chain. Light
// draws it as pale hexagons on a dotted rail; dark lights the outlines up and
// runs a solid rail between them, with the final step shifting to violet as the
// "level up" payoff. Same markup either way; only the strokes change.
const PATH_STEPS: {
  icon?: LucideIcon
  glyph?: string
  wolf?: boolean
  title: string
  text: string
}[] = [
  {
    icon: Gamepad2,
    title: 'Choose a game',
    text: 'Pick a game mode that matches your mood.',
  },
  {
    icon: Code,
    title: 'Select a skill',
    text: 'Choose what you want to learn or improve.',
  },
  { icon: Clock, title: 'Play', text: 'Focus for 25 minutes. No distractions.' },
  {
    icon: BookOpen,
    title: 'Learn',
    text: 'Sharpen your mind with a 5-minute lesson.',
  },
  {
    glyph: 'XP',
    title: 'Earn XP',
    text: 'Complete missions, earn XP, and build streaks.',
  },
  {
    wolf: true,
    title: 'Level up',
    text: 'Unlock new content, harder missions, better you.',
  },
]

// A pointy-top hexagon drawn as SVG rather than clip-path, so it can carry a
// stroke — clip-path gives no border to work with, and the outline is the whole
// look here.
function PathHex({ last, children }: { last: boolean; children: ReactNode }) {
  return (
    <span className="relative flex size-[54px] shrink-0 items-center justify-center sm:size-[58px]">
      <svg
        viewBox="0 0 100 115"
        aria-hidden="true"
        className={cn(
          'absolute inset-0 size-full',
          last
            ? 'dark:drop-shadow-[0_0_7px_var(--color-violet-500)]'
            : 'dark:drop-shadow-[0_0_7px_var(--primary)]',
        )}
      >
        <polygon
          points="50,3 96,29 96,86 50,112 4,86 4,29"
          strokeWidth="3"
          className={cn(
            'light:fill-white light:stroke-[#e2dfde] dark:fill-[#12060c]',
            last ? 'dark:stroke-violet-500' : 'dark:stroke-primary',
          )}
        />
      </svg>
      <span
        className={cn(
          'relative flex items-center justify-center',
          last ? 'text-foreground dark:text-violet-300' : 'text-foreground',
        )}
      >
        {children}
      </span>
    </span>
  )
}

// The rail between two hexes. Absolutely positioned rather than a flex sibling:
// the columns are equal-width and their copy is wider than the hexes, so the
// rail has to run hex-edge to hex-edge across the gap, not between the columns.
// 29px is the hex's half-width, +4 for breathing room.
function PathRail() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-[26px] right-[calc(-50%+33px)] left-[calc(50%+33px)] hidden items-center gap-1 sm:top-[28px] md:flex"
    >
      <span className="h-0 flex-1 border-t light:border-dotted light:border-[#c9c4c2] dark:border-primary/70" />
      <ChevronRight className="size-3 shrink-0 light:text-[#9c9694] dark:text-primary" />
    </span>
  )
}

export function WolfPath() {
  return (
    <section className="pt-6 pb-2 text-center sm:pt-8">
      <h2 className="font-heading text-[34px] tracking-wide text-foreground uppercase sm:text-[40px]">
        The Wolf&rsquo;s Path
      </h2>
      <p className="mt-0.5 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        A daily quest. Real progress.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-6 md:gap-x-0">
        {PATH_STEPS.map(({ icon: Icon, glyph, wolf, title, text }, i) => {
          const last = i === PATH_STEPS.length - 1
          return (
            <div key={title} className="relative flex flex-col items-center">
              {!last && <PathRail />}
              <PathHex last={last}>
                {Icon && <Icon className="size-5" strokeWidth={2} />}
                {glyph && (
                  <span className="font-heading text-[19px] text-primary">
                    {glyph}
                  </span>
                )}
                {wolf && <WolfMark className="h-5" />}
              </PathHex>
              <span className="mt-2.5 font-heading text-[22px] leading-none text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-1.5 font-mono text-[11px] font-bold tracking-widest text-foreground uppercase">
                {title}
              </h3>
              <p className="mt-1.5 max-w-[9.5rem] font-mono text-[11px] leading-[1.7] text-muted-foreground">
                {text}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// The banner strip under the path. Breaks out of <main>'s padding so it runs to
// the page edges like the hero plate, and takes its plate from `--path-banner`
// so each theme gets art that belongs to it — washing the night scene down for
// light gave a purple haze, not the daylight strip the mock shows. Light is
// framed off-centre so it reads as a city band rather than a second copy of the
// hero's composition.
export function PathBanner() {
  return (
    <div
      aria-hidden="true"
      className="-mx-5 h-[120px] bg-[image:var(--path-banner)] bg-cover bg-[position:88%_74%] sm:-mx-7 sm:h-[150px] md:h-[178px] dark:bg-cover dark:bg-center"
    />
  )
}

export function ReadyToJoin() {
  return (
    // Light reads as another eggshell tile with the shared inner rule; dark
    // lights the whole frame up instead — a primary border plus an outer glow,
    // which is what carries the row in the dark mock.
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card light:border-[#e2dfde] light:bg-[#f8f6f4] dark:border-primary/70 dark:shadow-[0_0_0_1px_var(--primary),0_0_28px_-4px_var(--primary)]">
      {/* Red glow bleeding in from the left. */}
      <div className="pointer-events-none absolute -top-12 -left-12 size-56 rounded-full bg-primary/20 blur-3xl" />
      {/* Moody wolf on the far right, faded into the card. */}
      <img
        src="/images/akela-eyes.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-y-0 right-0 hidden w-72 object-cover object-[70%_45%] opacity-90 [mask-image:linear-gradient(to_right,transparent,black_38%)] md:block"
      />
      <div className="absolute inset-y-0 right-0 hidden w-72 bg-gradient-to-l from-transparent via-card/45 to-card md:block light:via-[#f8f6f4]/40 light:to-[#f8f6f4]" />
      {/* Inner rule above the portrait and its scrim, both inset siblings. */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl light:shadow-[inset_0_0_0_2px_#fdfdfb]" />

      <div className="relative flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:gap-7 md:p-7">
        <WolfMark className="h-16 shrink-0 text-primary dark:drop-shadow-[0_0_10px_var(--primary)]" />
        <div className="flex-1">
          <h3 className="font-heading text-[30px] leading-none tracking-wide text-foreground uppercase">
            Ready to join the pack?
          </h3>
          <p className="mt-2 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
            Build discipline. Level up your skills.
            <br />
            Become unstoppable.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-center md:pr-32 lg:pr-56">
          <Link to="/signup" className={raisedCtaClass}>
            Create free account
            <ArrowRight className="size-5" />
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
