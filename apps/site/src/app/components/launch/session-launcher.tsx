import {
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Code,
  Gamepad2,
  Sparkles,
  // Parked with <RatingStars>.
  // Star,
  // StarHalf,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { api } from '@/api-client'
import { AsyncView } from '@/components/layout/async-view'
import { SkillIcon } from '@/components/launch/skill-icon'
import { Panel, SectionLabel, raisedCtaClass } from '@fw/ui'
import type { MissionSession } from '@/components/mission/mission-view'
import type { Difficulty } from '@/core/generation'
import {
  DEFAULT_MINUTES,
  MAX_MINUTES,
  MIN_MINUTES,
  clampMinutes,
  stepMinutesDown,
  stepMinutesUp,
} from '@/core/session-minutes'
import { EMBED_CATALOG } from '@/lib/embed-catalog'
import { guestNextLessonPath, nextLessonPath } from '@/lib/open-course'
import { ROM_CATALOG } from '@/lib/rom-catalog'
import { setSessionTarget } from '@/lib/session-target'
import { useAsync } from '@/hooks/use-async'
import { useAuth } from '@/hooks/auth-context'
import { useRomLibrary } from '@/hooks/use-rom-library'
import { useTimer } from '@/hooks/timer-context'
import { cn } from '@/lib/utils'

// The launcher works for both signed-in users and guests. A normalized topic
// shape covers both the authed (TopicProgress) and public (guest) topic lists.
type LauncherTopic = {
  slug: string
  name: string
  difficulty: Difficulty
  lessonsCompleted: number
  lessonsTotal: number
}

type Game = { id: string; title: string; cover?: string; accent?: string }

// The always-present games: instant-play web games first (the one-click
// default), then the console ROM titles (NES/GB — launch the emulator). The
// user's own uploaded ROMs are appended per-device in the component.
const STATIC_GAMES: Game[] = [
  ...EMBED_CATALOG.map((g) => ({
    id: g.id,
    title: g.title,
    cover: g.coverImage,
    accent: g.accent,
  })),
  ...ROM_CATALOG.map((g) => ({
    id: g.id,
    title: `${g.title} (${g.system.toUpperCase()})`,
    cover: g.coverImage,
    accent: g.accent,
  })),
]

// Parked with <RatingStars> and the Difficulty control.
// // The course level as a read-only 0–5 star rating (half-stars allowed). Estimated
// // XP scales with the learn slice and the difficulty.
// const LEVEL_RATING: Record<Difficulty, number> = {
//   beginner: 1.5,
//   intermediate: 2.5,
//   advanced: 4.5,
// }
const LEVEL_MULT: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 1.2,
  advanced: 1.5,
}
const XP_PER_MIN = 40
const cleanTitle = (t: string) => t.replace(/\s*\([^)]*\)\s*$/, '')

// The app-home hero: one compact strip to start a play/learn focus session.
// Smart-defaulted so a returning user (or a guest) just picks and hits Start.
export function SessionLauncher({
  onStart,
}: {
  onStart?: (session: MissionSession) => void
}) {
  const guest = !useAuth().user
  const state = useAsync<LauncherTopic[]>(() =>
    guest
      ? api.public.topics().then((v) =>
          v.topics.map((t) => ({
            slug: t.slug,
            name: t.name,
            // Public topics carry no difficulty field yet; treat them as
            // intermediate for now (the JS course is intermediate).
            difficulty: 'intermediate' as Difficulty,
            lessonsCompleted: 0,
            lessonsTotal: 1, // public topics all have a built-in course
          })),
        )
      : api.data.topics().then((ts) =>
          ts.map((t) => ({
            slug: t.slug,
            name: t.name,
            difficulty: (t.difficulty as Difficulty) ?? 'beginner',
            lessonsCompleted: t.lessonsCompleted,
            lessonsTotal: t.lessonsTotal,
          })),
        ),
  )
  return (
    <AsyncView state={state}>
      {(topics) => (
        <LauncherForm topics={topics} guest={guest} onStart={onStart} />
      )}
    </AsyncView>
  )
}

function pickTopic(playable: LauncherTopic[]): LauncherTopic | undefined {
  return (
    playable.find(
      (t) => t.lessonsCompleted > 0 && t.lessonsCompleted < t.lessonsTotal,
    ) ?? playable[0]
  )
}

function LauncherForm({
  topics,
  guest,
  onStart,
}: {
  topics: LauncherTopic[]
  guest: boolean
  onStart?: (session: MissionSession) => void
}) {
  const timer = useTimer()
  const nav = useNavigate()
  const playable = topics.filter((t) => t.lessonsTotal > 0)
  const initial = pickTopic(playable)

  const { uploads } = useRomLibrary()
  // The user's own uploaded ROMs (IndexedDB, per-device) are selectable too.
  const games = useMemo<Game[]>(
    () =>
      [
        ...STATIC_GAMES,
        ...uploads.map((u) => ({
          id: u.id,
          title: `${u.title} (${u.system.toUpperCase()})`,
        })),
      ]
        // TEMP: focus the game row on a single title for now — drop this
        // filter to bring the full catalog + uploads back.
        .filter((g) => g.id === 'tobu-tobu-girl'),
    [uploads],
  )
  // const [gameId, setGameId] = useState(STATIC_GAMES[0]?.id ?? '')
  const [gameId, setGameId] = useState('tobu-tobu-girl') // TEMP: single-title focus
  const [topicSlug, setTopicSlug] = useState(initial?.slug ?? '')
  const [level, setLevel] = useState<Difficulty>(
    (initial?.difficulty as Difficulty) ?? 'beginner',
  )
  const [playMinutes, setPlayMinutes] = useState(DEFAULT_MINUTES)
  const [learnMinutes, setLearnMinutes] = useState(DEFAULT_MINUTES)
  const [learnFirst, setLearnFirst] = useState(false)
  const [starting, setStarting] = useState(false)

  const currentTopic = playable.find((t) => t.slug === topicSlug)
  const currentGame = games.find((g) => g.id === gameId) ?? games[0]
  const estimatedXp = Math.round(learnMinutes * XP_PER_MIN * LEVEL_MULT[level])
  const ready = !!currentGame && !!currentTopic

  // The order swap reorders the two time fields (learn-first opens a lesson
  // before the game; play-first drops straight into the game).
  const first = learnFirst
    ? { label: 'Learn', name: 'Learn', value: learnMinutes, set: setLearnMinutes }
    : { label: 'Play', name: 'Play', value: playMinutes, set: setPlayMinutes }
  const second = learnFirst
    ? { label: 'Play', name: 'Play', value: playMinutes, set: setPlayMinutes }
    : { label: 'Learn', name: 'Learn', value: learnMinutes, set: setLearnMinutes }

  function onTopicChange(slug: string) {
    setTopicSlug(slug)
    const t = playable.find((x) => x.slug === slug)
    setLevel((t?.difficulty as Difficulty) ?? 'beginner')
  }

  // The select cards cycle to the next option (or pick the first from empty).
  function cycleGame() {
    if (!games.length) return
    const i = games.findIndex((g) => g.id === gameId)
    setGameId(games[(i + 1 + games.length) % games.length].id)
  }
  function cycleTopic() {
    if (!playable.length) return
    const i = playable.findIndex((t) => t.slug === topicSlug)
    onTopicChange(playable[(i + 1 + playable.length) % playable.length].slug)
  }

  async function start() {
    if (!topicSlug || starting) return
    setStarting(true)
    try {
      // In-place mission transition: hand the chosen session to the parent to
      // morph into the mission view instead of navigating to a game/lesson route.
      if (onStart) {
        onStart({
          gameId,
          gameTitle: currentGame ? cleanTitle(currentGame.title) : gameId,
          skillName: currentTopic?.name ?? '',
          topicSlug,
          difficulty: level,
          playMinutes,
          learnMinutes,
          learnFirst,
          estimatedXp,
        })
        return
      }
      // Guests have no persistent difficulty track — the level selector is just
      // a session preference for them, so skip the server write.
      if (!guest && currentTopic && level !== currentTopic.difficulty) {
        await api.courses.setDifficulty(topicSlug, level).catch(() => {})
      }
      setSessionTarget({ gameId, topicSlug })
      timer.start({
        playMinutes,
        learnMinutes,
        rounds: 1,
        startPhase: learnFirst ? 'learn' : 'play',
        loop: true, // keep the play↔learn loop going until the user ends it
      })
      // Play-first → drop into the game; learn-first → open the lesson first.
      // Guests use the public arcade (/play) + guest lesson routes.
      const arcadePath = guest ? '/play' : '/app/arcade'
      if (learnFirst) {
        nav(await (guest ? guestNextLessonPath : nextLessonPath)(topicSlug))
      } else {
        nav(`${arcadePath}?game=${encodeURIComponent(gameId)}`)
      }
    } catch {
      setStarting(false)
    }
  }

  return (
    <Panel
      id="start-session"
      brackets={false}
      className="flex scroll-mt-24 flex-col gap-5 rounded-2xl px-5 pt-5 pb-3 sm:px-5 sm:pt-6 light:bg-[#f8f5f2] light:shadow-[inset_0_0_0_2px_#fdfdfb,var(--tile-shadow)]"
    >
      <div className="flex items-center justify-between gap-4">
        <SectionLabel className="text-sm">Configure your mission</SectionLabel>
        <span className="hidden font-mono text-[10px] font-normal tracking-wider text-hero-title uppercase sm:inline">
          Each mission. Every day. Real progress.
        </span>
      </div>

      {/* Responsive control row. >=1150: everything on one line (XP + START in a
          right-hand column). 1024–1149: drop XP + difficulty, one line, START
          centered in the leftover gap. md (768–1023): drop XP + difficulty and
          run everything on one line, START inline and sized to its text.
          sm (640–767): a two-column grid — [game·skill] / [play·learn] /
          [start], START spanning both. <768: cards stack, difficulty returns,
          XP stays hidden, START centered.
          The play/learn swap is hidden across sm and md: it is the one control
          that can go without losing a setting (the order still defaults), and
          dropping it is what buys the md single line its last ~52px. */}
      {/* The row gap only ever shows once this wraps. Between md and 1023 the
          button is the wrapped line and 24px reads as a hole above it — the same
          range that already takes it to half width, so the two go together. */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-6 min-[430px]:max-md:grid min-[430px]:max-md:grid-cols-2 min-[430px]:max-md:items-start min-[430px]:max-md:gap-y-4 md:max-lg:flex-nowrap md:max-lg:gap-y-2 md:max-[1150px]:justify-center min-[1150px]:flex-nowrap min-[1150px]:justify-between">
        {/* game + skill — full-width stacked cards below md; fluid width sharing
            the md single line (title wraps as they narrow); fixed w-52 at
            >=1024. */}
        <Control
          label="Game"
          className="w-full min-w-0 min-[430px]:max-md:w-auto md:max-lg:w-auto md:max-lg:min-w-0 md:max-lg:flex-1 lg:w-52"
        >
          <SelectCard
            icon={
              currentGame?.cover ? (
                <img
                  src={currentGame.cover}
                  alt=""
                  className="size-10 shrink-0 rounded-md object-cover"
                />
              ) : (
                <Gamepad2
                  className={cn(
                    'size-6 shrink-0',
                    currentGame ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              )
            }
            title={currentGame ? cleanTitle(currentGame.title) : 'Select a game'}
            subtitle={currentGame ? 'Arcade mode' : 'Pick a game to begin'}
            onClick={cycleGame}
          />
        </Control>

        <Control
          label="Skill"
          className="w-full min-w-0 min-[430px]:max-md:w-auto md:max-lg:w-auto md:max-lg:min-w-0 md:max-lg:flex-1 lg:w-52"
        >
          <SelectCard
            icon={
              currentTopic ? (
                <SkillIcon topic={currentTopic} />
              ) : (
                <Code className="size-6 shrink-0 text-muted-foreground" />
              )
            }
            title={currentTopic ? currentTopic.name : 'Select a skill'}
            subtitle={
              currentTopic ? 'Ready to learn' : 'Pick a skill to focus on'
            }
            onClick={cycleTopic}
          />
        </Control>

        {/* Parked — the read-only difficulty stars. It only ever surfaced at
            >=1150 and is out of the row at every width now. RatingStars and
            LEVEL_RATING stay below, so this is a one-block restore.
        <Control label="Difficulty" className="max-[1150px]:hidden">
          <RatingStars rating={currentTopic ? LEVEL_RATING[level] : null} />
        </Control> */}

        {/* play + learn — a centered row of their own below md; inline on the
            shared line at md and up. */}
        <div className="flex items-start gap-2 max-md:w-full max-md:justify-center min-[430px]:max-md:col-span-2 min-[430px]:max-md:grid min-[430px]:max-md:grid-cols-5 min-[430px]:max-md:gap-x-2">
          <Control
            label={first.label}
            className="min-w-0 min-[430px]:max-md:col-span-2"
          >
            <TimeStepper
              value={first.value}
              onChange={first.set}
              name={first.name}
              className="min-[430px]:max-md:w-full"
            />
          </Control>
          <div className="flex flex-col gap-1.5 md:max-lg:hidden min-[430px]:max-md:items-center">
            <FieldLabel aria-hidden="true" className="opacity-0">
              swap
            </FieldLabel>
            <div className="flex h-16 items-center">
              <button
                type="button"
                onClick={() => setLearnFirst((v) => !v)}
                aria-label="Swap play/learn order"
                title="Swap which comes first"
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-hero-title transition-colors hover:border-primary hover:text-primary light:shadow-[var(--field-shadow)]"
              >
                <ArrowLeftRight className="size-3.5" />
              </button>
            </div>
          </div>
          <Control
            label={second.label}
            className="min-w-0 min-[430px]:max-md:col-span-2"
          >
            <TimeStepper
              value={second.value}
              onChange={second.set}
              name={second.name}
              className="min-[430px]:max-md:w-full"
            />
          </Control>
        </div>

        {/* Estimated XP + go. At >=1150 XP sits above the button in a fixed
            column (histogram right edge lines up with the button); the XP
            readout is the first to drop (768–1149), and START then goes inline
            at the end of the row. */}
        <div className="flex flex-col items-center gap-1 max-lg:w-full min-[430px]:max-md:col-span-2 md:max-lg:w-auto md:max-lg:shrink-0 md:max-lg:gap-1.5 lg:flex-1 lg:flex-row lg:items-start lg:gap-4">
          <div className="flex flex-col gap-1.5 max-[1150px]:hidden min-[1150px]:shrink-0">
            <FieldLabel>Reward</FieldLabel>
            <div className="flex h-16 items-center">
              {ready ? (
                <div className="flex w-full items-center justify-between gap-2">
                  {/* The reward, set in the text colours rather than the accent:
                      the figure is the loudest number in the row, and in cyan it
                      was a fifth headline colour competing with red/green/amber.
                      Cyan survives as the sparkle only — a supporting mark, not
                      the thing you read. `self-center` because the row is
                      baseline-aligned and an icon has no useful baseline. */}
                  <span className="flex items-baseline gap-1.5">
                    <Sparkles
                      className="size-3.5 self-center text-accent-blue"
                      aria-hidden="true"
                    />
                    <span className="text-2xl font-medium tabular-nums text-foreground">
                      +{estimatedXp}
                    </span>
                    <span className="font-mono text-sm font-semibold text-muted-foreground">
                      XP
                    </span>
                  </span>
                  {/* Parked with XpBars below — START occupies this slot now. */}
                  {/* <XpBars /> */}
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between gap-2">
                    {/* Placeholder follows the ready state: no headline cyan on
                        a figure that isn't a figure yet. */}
                    <span className="font-mono text-lg font-bold text-muted-foreground">
                      -- XP
                    </span>
                    {/* Parked with XpBars below. */}
                    {/* <XpBars muted /> */}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] leading-tight text-muted-foreground">
                    Complete the selections to see your XP
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* The button carries no label of its own, so wherever it shares a line
              with the fields it sat a label-height above them. This column
              reserves exactly what Control reserves — a transparent label row,
              then a 64px box that centres its child — which is the same trick
              the play/learn swap uses to sit on that line. Both the md single
              line and the >=1150 row need it; everywhere else the three
              wrappers collapse (`contents` / `hidden`) and the button goes back
              to being a direct child of the column, so nothing moves. */}
          <div className="contents md:flex md:flex-col md:gap-1.5 lg:flex-1">
          <FieldLabel
            aria-hidden="true"
            className="hidden opacity-0 md:block"
          >
            start
          </FieldLabel>
          <div className="contents md:flex md:h-16 md:items-center">
          <button
            type="button"
            onClick={start}
            disabled={!ready}
            className={cn(
              raisedCtaClass,
              'cta-flare',
              // Tighter than the hero's CTA by design: `px-3` halves the side
              // padding. From lg up it just takes the base `w-full` and fills
              // the flex-1 column it sits in — that column starts one row-gap
              // after the field before it and ends on the card's padding, so
              // filling it is what squares the button with the tile edge. It
              // used to be `w-auto` centred in the leftover space (lg–1149) and
              // `w-fit` right-aligned under the XP histogram (>=1150); the
              // histogram is parked and START took its slot.
              'w-full px-3 disabled:opacity-50 max-[430px]:w-auto md:max-lg:w-auto',
              // Glow + expand as the mission kicks off (the launcher then fades out).
              starting && 'scale-[1.04] shadow-[0_0_45px] shadow-primary/70',
            )}
          >
            {starting ? 'Starting…' : 'Start mission'}
            <ArrowRight className="size-4" />
          </button>
          </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function Control({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex h-16 items-center">{children}</div>
    </div>
  )
}

function FieldLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-mono text-[10px] font-normal tracking-wider text-hero-title uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

// A "select a game / skill" card — icon + title + subtitle + a next chevron.
// Renders a placeholder when nothing's chosen (or nothing's available).
// Clicking cycles to the next option. Styled to match the time steppers — same
// border, radius and --field-shadow — so every control in the row reads alike.
function SelectCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-16 w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 text-left transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none light:shadow-[var(--field-shadow)]"
    >
      {/* The card is at its narrowest on the md single line (131px at 768) —
          narrower even than the two-column band. The leading square is what
          gives way there: it is decorative next to a title that already names
          the choice. `contents` so the wrapper is transparent at every other
          width; `hidden` drops the subtree and its flex gap together. */}
      <span className="contents md:max-lg:hidden">{icon}</span>
      <div className="min-w-0 flex-1">
        {/* 2x title on the big stacked mobile cards; normal size but wrapping
            once the cards are a narrow column (430 up — the two-column band and
            the md line both qualify); single-line truncated at >=1024.
            The step has to land with the columns, not at md: at text-lg a
            one-word title like "JavaScript" is wider than a 110px text column
            and, having nowhere to wrap, spilled over the chevron. */}
        <div className="font-sans text-lg leading-tight font-semibold text-hero-title min-[430px]:text-sm min-[430px]:leading-normal lg:truncate">
          {title}
        </div>
        {/* "Ready to play / learn" — hidden below 1024. */}
        <div className="truncate font-mono text-[11px] text-muted-foreground max-lg:hidden">
          {subtitle}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-hero-title" />
    </button>
  )
}

// Parked with the Difficulty control in the row above.
// // Read-only difficulty rating — full/half/empty stars for a 0–5 value. A half
// // star overlays a lucide StarHalf (coral left half) on an empty outline.
// function RatingStars({ rating }: { rating: number | null }) {
//   const r = rating ?? 0
//   return (
//     <div className="flex items-center gap-1" aria-label={`Difficulty ${r} of 5`}>
//       {[1, 2, 3, 4, 5].map((i) => {
//         if (r >= i) {
//           return <Star key={i} className="size-5 fill-primary text-primary" />
//         }
//         if (r >= i - 0.5) {
//           return (
//             <span key={i} className="relative inline-flex size-5">
//               <Star className="size-5 fill-transparent text-muted-foreground/40" />
//               <StarHalf className="absolute inset-0 size-5 fill-primary text-primary" />
//             </span>
//           )
//         }
//         return (
//           <Star
//             key={i}
//             className="size-5 fill-transparent text-muted-foreground/40"
//           />
//         )
//       })}
//     </div>
//   )
// }
//
function TimeStepper({
  value,
  onChange,
  name,
  className,
}: {
  value: number
  onChange: (v: number) => void
  name: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-11 items-stretch rounded-lg border border-border bg-card focus-within:border-primary light:shadow-[var(--field-shadow)]',
        className,
      )}
    >
      <input
        type="number"
        min={MIN_MINUTES}
        max={MAX_MINUTES}
        value={value}
        onChange={(e) => onChange(clampMinutes(Number(e.target.value) || MIN_MINUTES))}
        aria-label={`${name} minutes`}
        className="w-11 flex-1 bg-transparent pl-3 text-base font-semibold tabular-nums text-hero-title outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="flex items-center pr-2 font-mono text-[10px] tracking-wide text-hero-title uppercase">
        min
      </span>
      <div className="flex flex-col border-l border-border">
        <button
          type="button"
          aria-label={`Increase ${name.toLowerCase()} time`}
          onClick={() => onChange(stepMinutesUp(value))}
          className="flex flex-1 items-center justify-center px-1.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Decrease ${name.toLowerCase()} time`}
          onClick={() => onChange(stepMinutesDown(value))}
          className="flex flex-1 items-center justify-center border-t border-border px-1.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// Parked — START took this slot beside the XP readout.
// // Decorative rising histogram next to the estimated-XP readout.
// const XP_BARS = [
//   8, 12, 7, 15, 11, 19, 14, 24, 18, 30, 22, 38, 28, 46, 36, 56, 44, 68, 54, 82,
//   66, 100,
// ]
// function XpBars({ muted = false }: { muted?: boolean }) {
//   return (
//     <div
//       className={cn(
//         'flex h-8 w-20 items-end gap-px',
//         muted
//           ? 'text-muted-foreground/50'
//           : 'text-accent-blue',
//       )}
//       aria-hidden="true"
//     >
//       {XP_BARS.map((h, i) => (
//         <div
//           key={i}
//           className="min-w-0 flex-1 rounded-sm bg-current"
//           style={{ height: `${h}%` }}
//         />
//       ))}
//     </div>
//   )
// }
//