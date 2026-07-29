import {
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Code,
  Gamepad2,
  Star,
  StarHalf,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { api } from '@/api-client'
import { AsyncView } from '@/components/layout/async-view'
import { SkillIcon } from '@/components/launch/skill-icon'
import { Panel, SectionLabel } from '@fw/ui'
import type { Difficulty } from '@/core/generation'
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

// The course level as a read-only 0–5 star rating (half-stars allowed). Estimated
// XP scales with the learn slice and the difficulty.
const LEVEL_RATING: Record<Difficulty, number> = {
  beginner: 1.5,
  intermediate: 2.5,
  advanced: 4.5,
}
const LEVEL_MULT: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 1.2,
  advanced: 1.5,
}
const XP_PER_MIN = 40
const cleanTitle = (t: string) => t.replace(/\s*\([^)]*\)\s*$/, '')

// The app-home hero: one compact strip to start a play/learn focus session.
// Smart-defaulted so a returning user (or a guest) just picks and hits Start.
export function SessionLauncher() {
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
      {(topics) => <LauncherForm topics={topics} guest={guest} />}
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
}: {
  topics: LauncherTopic[]
  guest: boolean
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
  const [playMinutes, setPlayMinutes] = useState(25)
  const [learnMinutes, setLearnMinutes] = useState(5)
  const [learnFirst, setLearnFirst] = useState(false)
  const [starting, setStarting] = useState(false)

  const currentTopic = playable.find((t) => t.slug === topicSlug)
  const currentGame = games.find((g) => g.id === gameId) ?? games[0]
  const estimatedXp = Math.round(learnMinutes * XP_PER_MIN * LEVEL_MULT[level])
  const ready = !!currentGame && !!currentTopic

  // The order swap reorders the two time fields (learn-first opens a lesson
  // before the game; play-first drops straight into the game).
  const first = learnFirst
    ? { label: 'Learn time', name: 'Learn', value: learnMinutes, set: setLearnMinutes }
    : { label: 'Play time', name: 'Play', value: playMinutes, set: setPlayMinutes }
  const second = learnFirst
    ? { label: 'Play time', name: 'Play', value: playMinutes, set: setPlayMinutes }
    : { label: 'Learn time', name: 'Learn', value: learnMinutes, set: setLearnMinutes }

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
      className="flex scroll-mt-24 flex-col gap-5 rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <SectionLabel>Start a session</SectionLabel>
        <span className="hidden font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:inline">
          Play a game · learn between rounds
        </span>
      </div>

      {/* Game · skill · difficulty · times · XP+go, spread evenly across the
          row so the XP block sits near the right edge (no giant middle gap). */}
      <div className="flex flex-wrap items-start gap-x-6 gap-y-6 min-[1150px]:flex-nowrap min-[1150px]:justify-between min-[1150px]:gap-x-4">
        {/* game + skill break together; `contents` flattens them into the even
            single row at xl. */}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-6 min-[1150px]:contents">
          <Control label="Choose a game" className="w-full sm:w-52">
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
              subtitle={currentGame ? 'Ready to play' : 'Pick a game to begin'}
              selected={!!currentGame}
              onClick={cycleGame}
            />
          </Control>

          <Control label="Choose a skill" className="w-full sm:w-52">
            <SelectCard
              icon={
                currentTopic ? (
                  <SkillIcon topic={currentTopic} />
                ) : (
                  <Code className="size-6 shrink-0 text-muted-foreground" />
                )
              }
              title={currentTopic ? currentTopic.name : 'Select a skill'}
              subtitle={currentTopic ? 'Ready to learn' : 'Pick a skill to focus on'}
              selected={!!currentTopic}
              onClick={cycleTopic}
            />
          </Control>
        </div>

        {/* difficulty + play/learn break together. */}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-6 min-[1150px]:contents">
          <Control label="Skill difficulty">
            <RatingStars rating={currentTopic ? LEVEL_RATING[level] : null} />
          </Control>

          <div className="flex items-start gap-2">
            <Control label={first.label}>
              <TimeStepper
                value={first.value}
                onChange={first.set}
                name={first.name}
              />
            </Control>
            <div className="flex flex-col gap-1.5">
              <FieldLabel aria-hidden="true" className="opacity-0">
                swap
              </FieldLabel>
              <div className="flex h-16 items-center">
                <button
                  type="button"
                  onClick={() => setLearnFirst((v) => !v)}
                  aria-label="Swap play/learn order"
                  title="Swap which comes first"
                  className="flex h-11 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <ArrowLeftRight className="size-4" />
                </button>
              </div>
            </div>
            <Control label={second.label}>
              <TimeStepper
                value={second.value}
                onChange={second.set}
                name={second.name}
              />
            </Control>
          </div>
        </div>

        {/* Estimated XP + go. At xl it's a fixed-width column on the right
            (histogram right edge lines up with the button below). At medium
            widths it takes a full second row — XP left, START right — so it
            doesn't orphan on the left as items wrap. */}
        <div className="flex flex-col gap-3 md:max-[1149px]:w-full md:max-[1149px]:flex-row md:max-[1149px]:items-end md:max-[1149px]:justify-between md:max-[1149px]:gap-6 min-[1150px]:w-52">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Estimated XP</FieldLabel>
            <div className="flex h-16 items-center">
              {ready ? (
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      +{estimatedXp}
                    </span>
                    <span className="font-mono text-sm font-semibold text-muted-foreground">
                      XP
                    </span>
                  </span>
                  <XpBars />
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-lg font-bold">
                      <span className="text-blue-600 dark:text-blue-400">--</span>
                      <span className="text-muted-foreground"> XP</span>
                    </span>
                    <XpBars muted />
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] leading-tight text-muted-foreground">
                    Complete the selections to see your XP
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={start}
            disabled={!ready || starting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-mono text-sm font-semibold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-50 md:max-[1149px]:w-auto md:max-[1149px]:px-8"
          >
            {starting ? 'Starting…' : 'Start mission'}
            <ArrowRight className="size-4" />
          </button>
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
        'font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

// A "select a game / skill" card — icon + title + subtitle + a next chevron.
// Renders a placeholder when nothing's chosen (or nothing's available); shows a
// coral border once a selection is active. Clicking cycles to the next option.
function SelectCard({
  icon,
  title,
  subtitle,
  selected,
  onClick,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-16 w-full items-center gap-3 rounded-lg border bg-card px-3 text-left transition-colors',
        selected
          ? 'border-primary/60 hover:border-primary'
          : 'border-border hover:border-muted-foreground/50',
      )}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="truncate font-heading text-sm font-bold text-foreground">
          {title}
        </div>
        <div className="truncate font-mono text-[11px] text-muted-foreground">
          {subtitle}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

// Read-only difficulty rating — full/half/empty stars for a 0–5 value. A half
// star overlays a lucide StarHalf (coral left half) on an empty outline.
function RatingStars({ rating }: { rating: number | null }) {
  const r = rating ?? 0
  return (
    <div className="flex items-center gap-1" aria-label={`Difficulty ${r} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (r >= i) {
          return <Star key={i} className="size-5 fill-primary text-primary" />
        }
        if (r >= i - 0.5) {
          return (
            <span key={i} className="relative inline-flex size-5">
              <Star className="size-5 fill-transparent text-muted-foreground/40" />
              <StarHalf className="absolute inset-0 size-5 fill-primary text-primary" />
            </span>
          )
        }
        return (
          <Star
            key={i}
            className="size-5 fill-transparent text-muted-foreground/40"
          />
        )
      })}
    </div>
  )
}

function TimeStepper({
  value,
  onChange,
  name,
}: {
  value: number
  onChange: (v: number) => void
  name: string
}) {
  const clamp = (v: number) => Math.min(120, Math.max(1, v))
  return (
    <div className="flex h-11 items-stretch border border-border focus-within:border-primary">
      <input
        type="number"
        min={1}
        max={120}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 1))}
        aria-label={`${name} minutes`}
        className="w-11 bg-transparent pl-3 text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="flex items-center pr-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        min
      </span>
      <div className="flex flex-col border-l border-border">
        <button
          type="button"
          aria-label={`Increase ${name.toLowerCase()} time`}
          onClick={() => onChange(clamp(value + 5))}
          className="flex flex-1 items-center justify-center px-1.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Decrease ${name.toLowerCase()} time`}
          onClick={() => onChange(clamp(value - 5))}
          className="flex flex-1 items-center justify-center border-t border-border px-1.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// Decorative rising histogram next to the estimated-XP readout.
const XP_BARS = [
  8, 12, 7, 15, 11, 19, 14, 24, 18, 30, 22, 38, 28, 46, 36, 56, 44, 68, 54, 82,
  66, 100,
]
function XpBars({ muted = false }: { muted?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-8 w-20 items-end gap-px',
        muted
          ? 'text-muted-foreground/50'
          : 'text-blue-600 dark:text-blue-400',
      )}
      aria-hidden="true"
    >
      {XP_BARS.map((h, i) => (
        <div
          key={i}
          className="min-w-0 flex-1 rounded-sm bg-current"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}
