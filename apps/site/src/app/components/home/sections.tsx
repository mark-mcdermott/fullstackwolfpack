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
    // Pulls 8px back off the page stack's 24px gap-6, leaving 16px above the
    // band so it sits closer to the launcher than to the sections below. Same
    // trick as HomeHero's `-mb-6`, which cancels that gap outright.
    <div className="relative -mt-2 overflow-hidden rounded-2xl border border-border bg-card light:bg-[#f8f6f4] light:shadow-[var(--tile-shadow)]">
      {/* Decorative, so the art rides on a background rather than an <img>: the
          theme picks the plate via `--creed-image` (index.css), which keeps one
          DOM tree across themes and fetches only the matching file — light's
          slice is 18KB against dark's 2.4MB. Same seam as `--hero-image`. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[image:var(--creed-image)] bg-cover bg-center bg-no-repeat md:[mask-image:linear-gradient(to_right,transparent,black_30%,black_85%,transparent)]"
      />
      {/* Scrims parked. All three existed to tame the dark neon plate; light's
          purpose-cut slice is high-key and carries its own edge mask, so they
          only erased it. Restore (and re-tune) when dark gets its pass — dark
          still needs them for the copy to read over the neon.
      <div className="absolute inset-0 dark:bg-neutral-950/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/50 to-transparent dark:from-neutral-950 dark:via-neutral-950/40" />
      <div className="absolute inset-0 dark:bg-gradient-to-l dark:from-neutral-950/90 dark:via-neutral-950/20" /> */}
      {/* Inner rule on top of the art and its scrims — they are inset-0
          siblings, so a ring on the band itself would be painted over. */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl light:shadow-[inset_0_0_0_2px_#fdfdfb]" />

      {/* Vertical kana, set just clear of the copy rather than mid-band. Same
          treatment as the header's: it falls through to the sans stack, so it
          needs the variation-settings escape for the weight to land.
          In vertical-rl the inline axis runs vertically, so the element's
          *height* is the line length and its *width* is the column count.
          `whitespace-nowrap` is what keeps it one column — without it the run
          is capped by the space below `top-1/2` and breaks into a second; with
          it the box is content-sized, so translating by half its own height
          centres it. `w-fit` pins the block axis, since a wide box would stack
          that single column against its right edge, under the readout. */}
      <span
        aria-hidden="true"
        // Between md and 1023 the band is narrow enough that 38% lands on the
        // headline, so there it is anchored beside the readout instead. From the
        // right, not as a percentage: the readout is `shrink-0` at a constant
        // ~210px, so a right offset holds station while its left edge as a
        // percentage drifts from 72% to 78% across that range.
        className="pointer-events-none absolute top-1/2 left-[38%] hidden w-fit -translate-y-1/2 whitespace-nowrap [writing-mode:vertical-rl] font-bold tracking-wider text-primary [font-variation-settings:normal] md:block md:text-[15px] md:max-[1023px]:right-[222px] md:max-[1023px]:left-auto"
      >
        ウルフパック信条
      </span>

      {/* `min-h` is the band's size knob. It has to clear the copy column's own
          content height (~156px) to bind at all — below that the copy sets the
          height and changing this does nothing. */}
      <div className="relative flex min-h-[12rem] flex-col justify-center gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="max-w-md py-5 pl-8">
          <span className="block font-mono text-sm font-medium tracking-widest text-primary uppercase">
            The Wolfpack Creed
          </span>
          <p className="mt-2 font-heading text-2xl leading-[1.05] font-bold tracking-wide text-foreground uppercase sm:text-[2.125rem] dark:text-neutral-50">
            Discipline over motivation.
          </p>
          <p className="mt-2.5 max-w-sm font-mono text-[13px] font-light leading-relaxed text-hero-title">
            Short sessions, stacked every day —
            <br />
            that&rsquo;s how the pack levels up.
          </p>
        </div>

        {/* Terminal readout. Its own surface in light so it reads as a panel
            against the art rather than sitting loose on it. */}
        <div className="flex shrink-0 flex-col justify-center rounded-r-xl border-border md:self-stretch light:border-l light:border-[#e2dfde] light:bg-white light:p-4 light:shadow-[var(--field-shadow)] md:border-l md:pl-8 md:light:pl-4 dark:border-white/15">
          <div className="flex flex-col font-mono text-sm tracking-wide">
            {[
              { label: 'Lock in', tone: 'text-primary' },
              { label: 'Keep learning', tone: 'text-blue-600 dark:text-blue-400' },
              { label: 'Level up', tone: 'text-primary' },
            ].map(({ label, tone }) => (
              <span
                key={label}
                className={cn(
                  'flex items-center gap-1 border-b border-border py-1.5 uppercase dark:border-white/10',
                  tone,
                )}
              >
                <ChevronRight className="size-3.5 shrink-0" />
                {label}
              </span>
            ))}
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
    <span className="relative flex size-[62px] shrink-0 items-center justify-center sm:size-[70px]">
      <svg
        viewBox="0 0 100 115"
        aria-hidden="true"
        className={cn(
          'absolute inset-0 size-full',
          // Light lifts the tile off the rail; dark keeps the neon bloom it had.
          // `drop-shadow` rather than `box-shadow`: the shadow has to follow the
          // hexagon, and a box-shadow would trace the <svg>'s square box.
          'light:drop-shadow-[0_1px_2px_rgb(0_0_0/0.10)]',
          last
            ? 'dark:drop-shadow-[0_0_7px_var(--color-violet-500)]'
            : 'dark:drop-shadow-[0_0_7px_var(--primary)]',
        )}
      >
        {/* Same pointy-top hexagon as the plain polygon it replaced, with each
            vertex cut back 9 units and bridged by a quadratic — the corner
            radius has to live in the geometry, since stroke-linejoin would only
            round by half the 3-unit stroke (~0.8px at this render size). */}
        <path
          d="M42.16,7.43 Q50,3 57.84,7.43 L88.16,24.57 Q96,29 96,38 L96,77 Q96,86 88.16,90.43 L57.84,107.57 Q50,112 42.16,107.57 L11.84,90.43 Q4,86 4,77 L4,38 Q4,29 11.84,24.57 Z"
          strokeWidth="3"
          className={cn(
            'light:fill-white light:stroke-[#dad7d6] dark:fill-[#12060c]',
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
// 35px is the hex's half-width, +4 for breathing room; `top` is that same half
// less 1, to sit the rule on the hex's centre line. Both track the hex size —
// resize PathHex and these move with it.
function PathRail() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-[30px] right-[calc(-50%+39px)] left-[calc(50%+39px)] hidden items-center gap-1 sm:top-[34px] md:flex"
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
      <p className="mt-0.5 font-mono text-[11px] tracking-wider text-hero-title uppercase">
        A daily quest. Real progress.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-6 md:gap-x-0">
        {PATH_STEPS.map(({ icon: Icon, glyph, wolf, title, text }, i) => {
          const last = i === PATH_STEPS.length - 1
          return (
            <div key={title} className="relative flex flex-col items-center">
              {!last && <PathRail />}
              <PathHex last={last}>
                {Icon && <Icon className="size-8" strokeWidth={2} />}
                {glyph && (
                  <span className="font-heading text-[30px] text-primary">
                    {glyph}
                  </span>
                )}
                {wolf && <WolfMark className="h-8" />}
              </PathHex>
              {/* Mono rather than the heading face, matching the launcher's
                  section label; the step titles below take the challenge
                  card's label styling. */}
              <span className="mt-2.5 font-mono text-[22px] leading-none text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-1.5 font-mono text-xs leading-none font-semibold tracking-tight text-hero-title uppercase light:text-[#04040d]">
                {title}
              </h3>
              <p className="mt-1.5 max-w-[6rem] font-mono text-[10px] leading-[1.7] text-hero-title light:text-[#04040d]">
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
// light gave a purple haze, not the daylight strip the mock shows. Centred in
// both now: light's plate is a purpose-cut slice at the strip's own aspect, so
// it no longer needs the off-centre framing that pulled a band out of the
// hero's composition.
export function PathBanner() {
  return (
    <div
      aria-hidden="true"
      className="-mx-5 h-[120px] bg-[image:var(--path-banner)] bg-cover bg-center sm:-mx-7 sm:h-[150px] md:h-[178px]"
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
