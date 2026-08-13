import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  Code,
  Gamepad2,
  type LucideIcon,
} from 'lucide-react'
import { useId, type ReactNode } from 'react'
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
        className="absolute inset-0 bg-[image:var(--creed-image)] bg-cover bg-[position:78%_center] bg-no-repeat md:bg-center md:[mask-image:linear-gradient(to_right,transparent,black_30%,black_85%,transparent)] dark:brightness-[0.82] dark:saturate-[0.85]"
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
        <div className="flex shrink-0 flex-col justify-center rounded-r-xl border-border p-4 md:self-stretch light:border-l light:border-[#e2dfde] light:bg-white light:shadow-[var(--field-shadow)] md:border-l dark:border-white/15 dark:bg-[#0b1018]">
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
// runs a solid rail between them, with only the final step lit as the
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

// The hexagon's six corners, in the same 0 0 100 115 space as the outline
// below. They are the *cut* corners — the path rounds each vertex with a
// quadratic, so these are the apexes of those curves, not where the straight
// edges would have met.
const HEX_VERTICES: { x: number; y: number; top?: boolean }[] = [
  { x: 50, y: 4.6, top: true },
  { x: 93.6, y: 30.4 },
  { x: 93.6, y: 84.6 },
  { x: 50, y: 110.4 },
  { x: 6.4, y: 84.6 },
  { x: 6.4, y: 30.4 },
]

const HEX_D =
  'M42.16,7.43 Q50,3 57.84,7.43 L88.16,24.57 Q96,29 96,38 L96,77 Q96,86 88.16,90.43 L57.84,107.57 Q50,112 42.16,107.57 L11.84,90.43 Q4,86 4,77 L4,38 Q4,29 11.84,24.57 Z'

// A pointy-top hexagon drawn as SVG rather than clip-path, so it can carry a
// stroke — clip-path gives no border to work with, and the outline is the whole
// look here.
//
// Dark is where the work is. The mock's tile is not a stroked shape with a
// shadow on it; it is a lamp. Four things build that, and dropping any one of
// them takes the neon with it:
//
//   1. a bloom in three passes — a tight white-hot core, a mid halo and a wide
//      soft one. One large `drop-shadow` reads as fog; stacking radii is what
//      gives the falloff a filament's shape.
//   2. an interior that is lit rather than filled: a radial from the card
//      colour at the middle out to the accent at low alpha, so the glass
//      catches the tube nearest the edges.
//   3. nodes at the corners. The mock puts a dot on every vertex and a brighter
//      one at the apex — that single detail is most of why the shape reads as
//      built out of light rather than drawn.
//   4. the stroke itself at full strength, since it is the filament.
function PathHex({
  last,
  children,
}: {
  last: boolean
  children: ReactNode
}) {
  const fillId = useId()
  // One accent in the UI. The final step used to be violet, which put a second
  // dominant hue on the page competing with the brand red — and violet is a
  // colour the artwork already owns. The last step still reads as the payoff,
  // but through *light* rather than hue: it is the only node that blooms.
  const accent = 'var(--primary)'
  return (
    <span className="relative flex size-[62px] shrink-0 items-center justify-center sm:size-[70px]">
      <svg
        viewBox="0 0 100 115"
        aria-hidden="true"
        className={cn(
          'absolute inset-0 size-full',
          'light:drop-shadow-[0_1px_2px_rgb(0_0_0/0.10)]',
          // Glow is a budget, and six glowing nodes spend it on nothing. Only
          // the final step blooms now; the five before it are crisp. The row
          // reads as five quiet steps leading to one lit one, which is the
          // story the section is telling anyway.
          last
            ? 'dark:[filter:drop-shadow(0_0_1.5px_color-mix(in_oklab,#ffc0a8_85%,transparent))_drop-shadow(0_0_5px_color-mix(in_oklab,#ff5a3c_72%,transparent))_drop-shadow(0_0_14px_color-mix(in_oklab,var(--primary)_50%,transparent))]'
            : 'dark:[filter:drop-shadow(0_0_1px_color-mix(in_oklab,var(--primary)_28%,transparent))]',
        )}
      >
        <defs>
          {/* Lit from the rim inwards, so the middle stays dark enough for the
              glyph and the edges pick the tube up. */}
          <radialGradient id={fillId} cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor="var(--card)" />
            <stop offset="58%" stopColor="var(--card)" />
            <stop
              offset="100%"
              stopColor={accent}
              stopOpacity={last ? 0.3 : 0.2}
            />
          </radialGradient>
        </defs>
        <path
          d={HEX_D}
          strokeWidth="2.6"
          className={cn(
            'light:fill-white light:stroke-[#dad7d6]',
            'dark:stroke-primary',
            // The unlit steps sit back a little so the last one leads.
            last ? '' : 'dark:opacity-80',
          )}
          // Light keeps its flat white; dark takes the lit interior. Set as an
          // attribute rather than a class so the gradient id can reach it, and
          // overridden back to white by the `light:fill-white` above.
          fill={`url(#${fillId})`}
        />
        {/* Corner nodes. Light renders none — they are a neon artefact, and on
            a white tile they would read as dirt. */}
        {HEX_VERTICES.map(({ x, y, top }) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={top ? 2.4 : 1.7}
            className={cn(
              'light:hidden',
              top ? 'dark:fill-[#ffd9c8]' : 'dark:fill-[#ff7a55]',
              last ? '' : 'dark:opacity-70',
            )}
          />
        ))}
      </svg>
      <span
        className={cn(
          'relative flex items-center justify-center',
          'text-foreground',
        )}
      >
        {children}
      </span>
    </span>
  )
}

// The connectors between steps. Three layouts to serve, because the grid is
// 2 / 3 / 6 across: what is a mid-row link at one width is a line wrap at
// another, so each step renders every variant it might need and the breakpoint
// picks one. `cols` is which grid this variant belongs to.
// One rail treatment, not two. The final segment used to shift to violet to
// match the old violet end-node; with the accent unified, the distinction it
// was drawing no longer exists.
function PathRailAcross({ cols }: { cols: 2 | 3 | 6 }) {
  // The rule runs the whole span and the chevron sits *over* it — the mock's
  // line does not break for the arrowhead, and splitting it into two halves
  // (which is what the last pass did) left a gap either side of the glyph that
  // read as two links rather than one.
  const line = cn(
    'pointer-events-none absolute inset-x-0 top-1/2 h-0 border-t',
    'light:border-dotted light:border-[#8a888a]',
    // The rail is connective tissue, not a focal point: it keeps its colour and
    // loses its bloom, so the glow budget goes to the node it leads to.
    'dark:border-primary/70',
  )
  // Each segment is capped at both ends, as the mock is — the caps are what
  // stop the rule dying into the bloom and make each link read as its own run.
  const cap = cn(
    'pointer-events-none absolute top-1/2 size-[3.5px] -translate-y-1/2 rounded-full light:hidden',
    'dark:bg-[#ffb499] dark:opacity-80',
  )
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute top-[30px] right-[calc(-50%+39px)] left-[calc(50%+39px)] h-0 items-center justify-center sm:top-[34px]',
        cols === 2 && 'flex sm:hidden',
        cols === 3 && 'hidden sm:flex md:hidden',
        cols === 6 && 'hidden md:flex',
      )}
    >
      <span className={line} />
      <span className={cn(cap, '-left-px')} />
      <span className={cn(cap, '-right-px')} />
      {/* Brighter than its own rule, which is how the mock separates the two —
          the arrowhead is the lit end of the segment, not more of the line. */}
      <ChevronRight
        className={cn(
          'relative size-[18px] shrink-0 dark:size-6',
          'light:text-[#1e222b]',
          'dark:text-[#ffb499]',
        )}
        strokeWidth={2.25}
      />
    </span>
  )
}

// At a line wrap the path cannot run to its neighbour — the next number is at
// the far left of the row below. So it turns: out of the last hex in the row,
// right past the column edge, and down to the middle of the row gap. Its
// partner (`PathRailEnter`) picks the line up there and carries it back.
//
// `bottom: -18px` rather than a height, because the cells are as tall as their
// copy and that varies: -18 is half of the grid's `gap-y-9`, so the turn always
// lands exactly on the gap's midline whatever the row measures.
function PathRailTurn({ cols }: { cols: 2 | 3 }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute top-[30px] -bottom-[18px] left-[calc(50%+39px)] -right-2 rounded-tr-md border-t border-r sm:top-[34px]',
        'light:border-dotted light:border-[#c9c4c2] dark:border-primary/70',
        cols === 2 && 'block sm:hidden',
        cols === 3 && 'hidden sm:block md:hidden',
      )}
    />
  )
}

// The return leg: along the gap's midline from where the turn left off, then
// down into the first hex of the row. The negative right inset is what reaches
// back across the row — one cell plus one gap per column to the right of this
// one, plus the 8px the turn sits outside the grid — so the two elbows meet
// instead of reading as two unrelated stubs.
function PathRailEnter({ cols }: { cols: 2 | 3 }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -top-[18px] left-1/2 h-12 rounded-tl-md border-t border-l sm:h-[52px]',
        'light:border-dotted light:border-[#c9c4c2] dark:border-primary/70',
        cols === 2 && 'right-[calc(-100%-24px)] block sm:hidden',
        cols === 3 && 'hidden right-[calc(-200%-40px)] sm:block md:hidden',
      )}
    />
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
              {/* Which connector this step needs depends on where it sits in
                  the row, and that differs per breakpoint — so the decision is
                  made once per grid here and the variants hide themselves. */}
              {!last && (i + 1) % 2 !== 0 && <PathRailAcross cols={2} />}
              {!last && (i + 1) % 2 === 0 && <PathRailTurn cols={2} />}
              {i % 2 === 0 && i > 0 && <PathRailEnter cols={2} />}
              {!last && (i + 1) % 3 !== 0 && (
                <PathRailAcross cols={3} />
              )}
              {!last && (i + 1) % 3 === 0 && <PathRailTurn cols={3} />}
              {i % 3 === 0 && i > 0 && <PathRailEnter cols={3} />}
              {!last && (
                <PathRailAcross cols={6} />
              )}
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
      className="-mx-5 h-[120px] rounded-2xl bg-[image:var(--path-banner)] bg-cover bg-top sm:-mx-7 sm:h-[150px] md:h-[178px] dark:mx-[calc(50%-50vw)] dark:brightness-[0.72] dark:saturate-[0.7] dark:relative dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--background)_55%,transparent)_0%,color-mix(in_oklab,var(--background)_18%,transparent)_45%,color-mix(in_oklab,var(--background)_60%,transparent)_100%)] dark:aspect-[var(--banner-aspect)] dark:h-auto dark:max-h-[17.5rem] dark:min-h-[120px] dark:rounded-none dark:bg-[position:50%_31%] sm:dark:min-h-[150px] md:dark:min-h-[178px]"
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
    <section className="join-frame relative -mt-[19px] -mb-[34px] overflow-hidden rounded-2xl dark:mt-14 dark:-mb-2 border border-border bg-card light:border-[#e2dfde] light:bg-[#f8f6f4] light:shadow-[var(--tile-shadow)] dark:border-[#5c0405] dark:shadow-[0_0_22px_-10px_rgb(180_12_12/0.3)]">
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
        <WolfMark className="my-3 h-20 shrink-0 text-foreground dark:text-primary" />
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
