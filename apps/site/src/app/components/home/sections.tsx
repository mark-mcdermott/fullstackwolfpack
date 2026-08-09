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
import { WolfMark, raisedCtaClass, raisedCtaCompactClass } from '@fw/ui'
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
              { label: 'Keep learning', tone: 'text-accent-blue' },
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
  // No number here on purpose: the interval is the user's to set, and this line
  // used to quote the old 25-minute default back at them.
  {
    icon: Clock,
    title: 'Play',
    text: 'Lock in for as long as you want. No distractions.',
  },
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
// light gave a purple haze, not the daylight strip the mock shows.
//
// Anchored to the top, not centred. The strip is wider than the plate's aspect,
// so `cover` scales to the width and trims the height — 14px at the desktop
// size. The rider's ears sit 7px from the plate's top edge, so splitting that
// trim across both edges clipped them; sending all of it to the bottom costs
// only rooftop.
// Dark runs the strip full bleed and square-cornered, the way the mock has it —
// the one band on the page that breaks the card rhythm. Three notes on that:
//
//   · `mx-[calc(50%-50vw)]` is the full-bleed escape. The element is a block
//     with auto width, so the two negative margins add the viewport back:
//     container − 2(½container − ½vw) = vw. It outranks the unprefixed `-mx-5`
//     and `sm:-mx-7` on specificity, so it holds at every breakpoint.
//   · the height comes from the *art's own aspect* rather than a fixed
//     120/150/178, so the band never crops while it is growing — a fixed height
//     against a viewport-wide element turns 4:1 art into a 19:1 letterbox on an
//     ultrawide and `cover` answers by throwing away most of the picture.
//   · but it stops growing at 17.5rem. Every other block on the page is capped
//     to the 1160px content column; letting the band keep pace with the
//     *window* instead made it tower over its neighbours on a wide screen.
//
// Which is also why the art is the 6:1 crop rather than the mock's 4:1 one.
// The mock's proportion assumes the band is as wide as the page — once it is as
// wide as the *window* and the page is not, a 4:1 frame either towers or gets
// cropped to a sliver, and at 1920 that sliver puts the rider's head on the top
// edge. 6:1 is the shape a strip actually wants, which is what light's asset has
// been all along. What the crop spends is the rooftop; what it keeps is the
// rider and the sign.
//
// Dark takes the trim at 31% rather than inheriting `bg-top`'s 0%. Nothing
// moves below ~1690px — there the band matches the art and no overflow exists —
// but by 3440 the trim is 289px, and taking it all off the bottom pins the
// rider's head to the top edge. 31% buys the head clearance while stopping
// short of 50%, which starts cutting the ears off the wolf sign. It is a
// percentage so the shift grows with the crop: 12px at 1920, 90px at 3440.
// Dark-only because light's card overflows by just 14px, and the note above
// about the rider's ears is exactly why that 14px all goes to the bottom.
//
// The `min-h` trio is the other end of the same ratio. A 6:1 frame is generous
// on a wide screen and a sliver on a phone — 65px at 390 — so the floors hold
// the heights the band already had below the crossover at ~1075px, and the
// aspect takes over above it. Net effect is one ramp: 120 → 178 → 238 → 280.
//   · light is untouched — it keeps the inset card, which is what its own mock
//     shows, and both themes still read the same `--path-banner`.
export function PathBanner() {
  return (
    <div
      aria-hidden="true"
      className="-mx-5 h-[120px] rounded-2xl bg-[image:var(--path-banner)] bg-cover bg-top sm:-mx-7 sm:h-[150px] md:h-[178px] dark:mx-[calc(50%-50vw)] dark:aspect-[var(--banner-aspect)] dark:h-auto dark:max-h-[17.5rem] dark:min-h-[120px] dark:rounded-none dark:bg-[position:50%_31%] sm:dark:min-h-[150px] md:dark:min-h-[178px]"
    />
  )
}

export function ReadyToJoin() {
  return (
    // Light reads as another eggshell tile with the shared inner rule; dark
    // lights the whole frame up instead — a primary border plus an outer glow,
    // which is what carries the row in the dark mock.
    // The negative margins trim the page stack's gap-6 above and `main`'s pb-6
    // below, so this row sits tight to the banner and the footer rather than
    // floating between them. `-mb` overshoots main's 24px on purpose: the gap
    // the eye reads is that plus the footer's own 24px top padding, so pulling
    // 10px into the footer's box lands 14px between the card and its first
    // line. Safe because the footer paints no background — and done here rather
    // than on the footer's padding, which every other page shares.
    //
    // Dark reverses both. Its banner runs full bleed to the window edges and
    // carries a lot more weight than light's inset card, so butting this row up
    // against it reads as one continuous slab; the space is what lets the lit
    // frame register as its own object, and the same goes for the footer under
    // it — a glowing frame needs air on both sides or the glow bleeds into its
    // neighbours. Both outrank the base negatives on specificity, so they
    // replace them rather than adding to them. It is not symmetric: 80px above,
    // where the full-bleed banner needs the separation, and 40px below, where
    // the footer is loose text that would drift away from the page if it were
    // given the same. Note the bottom is still negative — main's pb-6 and the
    // footer's own pt-6 already stack to 48px on their own.
    <section className="join-frame relative -mt-[19px] -mb-[34px] overflow-hidden rounded-2xl dark:mt-14 dark:-mb-2 border border-border bg-card light:border-[#e2dfde] light:bg-[#f8f6f4] light:shadow-[var(--tile-shadow)] dark:border-[#7a0406] dark:shadow-[0_0_28px_-6px_rgb(180_12_12/0.55)]">
      {/* Red glow parked.
      <div className="pointer-events-none absolute -top-12 -left-12 size-56 rounded-full bg-primary/20 blur-3xl" /> */}
      {/* Moody wolf on the far right, on a background rather than an <img> so
          the theme picks the plate via `--eyes-image` — one DOM tree across
          themes, and only the matching file is fetched. Light keeps the grey
          pencil head; dark takes the near-black one its mock has.

          Full strength from the right edge back to the near eye's outer corner,
          then out over 25px. The stops are in px, not %, because the ramp is
          anchored to a feature in the art — and the two plates put that feature
          in different places, so the ramp moves with them: the amber starts at
          x=138 of light's 576px plate (69px into this 288px box) against x=122
          of dark's (61px). Reusing light's stops left dark's near eye sitting
          inside the fade at about two-thirds opacity.

          Both plates are exactly 2x the box, so `contain` fits them edge to
          edge and there is no object-position left to tune — it is `contain`
          rather than `cover` so that a plate whose ratio drifts letterboxes
          into the card instead of silently losing an eye to a crop. The
          card-coloured
          scrim that used to sit over this is parked; it faded the same edge
          again and nothing could reach full strength. */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 hidden w-72 bg-[image:var(--eyes-image)] bg-contain bg-center bg-no-repeat opacity-90 [mask-image:linear-gradient(to_right,transparent_45px,black_70px)] md:block dark:[mask-image:linear-gradient(to_right,transparent_36px,black_61px)]"
      />
      {/* <div className="absolute inset-y-0 right-0 hidden w-72 bg-gradient-to-l from-transparent via-card/45 to-card md:block light:via-[#f8f6f4]/40 light:to-[#f8f6f4]" /> */}
      {/* Inner rule above the portrait and its scrim, both inset siblings. */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl light:shadow-[inset_0_0_0_2px_#fdfdfb]" />

      <div className="relative flex flex-col items-start gap-5 px-6 py-5 md:flex-row md:items-center md:gap-7 md:px-7 md:py-[26px]">
        {/* Light keeps `text-foreground`, matching the header's mark; dark runs
            it red, which is what its mock has and what the glow underneath was
            already implying. The breathing room is margin, not padding: `h-20`
            is a border-box height, so padding would eat into the glyph rather
            than sit around it — `py-3` here would render the mark smaller than
            it was at h-16. */}
        <WolfMark className="my-3 h-20 shrink-0 text-foreground dark:text-primary dark:drop-shadow-[0_0_10px_var(--primary)]" />
        <div className="flex-1">
          {/* 300 rather than the heading font's pinned 400, which needs the
              variation-settings escape or the pin swallows it — the same dance
              `raisedCtaClass` does. Tracking steps back one stop from `widest`
              rather than two: 0.1em read as a strapline, but `wide` overshot
              and closed the line up tighter than the mock's, which is airier
              than either. */}
          <h3 className="font-heading text-[40px] leading-none font-light tracking-wider text-foreground uppercase [font-variation-settings:normal]">
            Ready to join the pack?
          </h3>
          <p className="mt-2 max-w-md font-mono text-xs leading-loose text-hero-title light:text-[#04040d]">
            Build discipline. Level up your skills.
            <br />
            Become unstoppable.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-center md:pr-32 lg:pr-56">
          {/* The compact step of the raised CTA — 40px, and the size the Skill
              and Arcade card CTAs take too. The padding it carries (including
              the restated `dark:`, without which this grows to 52px in dark)
              lives in `raisedCtaCompactClass`; the font size stays light's,
              since dark's is on the shared class, one size for all three. */}
          <Link
            to="/signup"
            className={cn(raisedCtaClass, raisedCtaCompactClass, 'cta-blaze')}
          >
            Create free account
            <ArrowRight className="size-5" />
          </Link>
          <span className="font-mono text-[11px] font-light text-hero-title light:text-[#04040d] dark:text-[#878b83]">
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
