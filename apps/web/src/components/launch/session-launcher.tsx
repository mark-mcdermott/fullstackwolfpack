import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Gamepad2,
  Star,
} from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
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

// Difficulty ⇄ 5-star mapping (the enum has three rungs; stars just make it
// tactile). Estimated XP scales with the learn slice and the difficulty.
const LEVEL_STARS: Record<Difficulty, number> = {
  beginner: 2,
  intermediate: 4,
  advanced: 5,
}
const LEVEL_MULT: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 1.2,
  advanced: 1.5,
}
const XP_PER_MIN = 40
function starToLevel(i: number): Difficulty {
  return i <= 2 ? 'beginner' : i <= 4 ? 'intermediate' : 'advanced'
}

// The app-home hero: one panel to start a play/learn focus session. Smart-
// defaulted so a returning user (or a guest) just picks and hits Start.
export function SessionLauncher() {
  const guest = !useAuth().user
  const state = useAsync<LauncherTopic[]>(() =>
    guest
      ? api.public.topics().then((v) =>
          v.topics.map((t) => ({
            slug: t.slug,
            name: t.name,
            difficulty: 'beginner' as Difficulty,
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
  const estimatedXp = Math.round(learnMinutes * XP_PER_MIN * LEVEL_MULT[level])

  function onTopicChange(slug: string) {
    setTopicSlug(slug)
    const t = playable.find((x) => x.slug === slug)
    setLevel((t?.difficulty as Difficulty) ?? 'beginner')
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

  const first = learnFirst
    ? { label: 'Learn', value: learnMinutes, set: setLearnMinutes }
    : { label: 'Play', value: playMinutes, set: setPlayMinutes }
  const second = learnFirst
    ? { label: 'Play', value: playMinutes, set: setPlayMinutes }
    : { label: 'Learn', value: learnMinutes, set: setLearnMinutes }

  return (
    <Panel brackets={false} className="flex flex-col gap-6 rounded-2xl p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <SectionLabel>Start a session</SectionLabel>
        <span className="hidden font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:inline">
          Play a game · learn between rounds
        </span>
      </div>

      {/* Choose a game — a scrollable cover carousel. */}
      <div className="flex flex-col gap-3">
        <FieldLabel>Choose a game</FieldLabel>
        <GameCarousel games={games} selected={gameId} onSelect={setGameId} />
      </div>

      {/* Choose a skill — the playable topics as icon tiles. */}
      <div className="flex flex-col gap-3">
        <FieldLabel>Choose a skill</FieldLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {playable.map((t) => (
            <SkillCard
              key={t.slug}
              topic={t}
              selected={t.slug === topicSlug}
              onSelect={() => onTopicChange(t.slug)}
            />
          ))}
        </div>
      </div>

      {/* Difficulty · play/learn times (+ order swap) · estimated XP. */}
      <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Difficulty</FieldLabel>
          <StarRating level={level} onChange={setLevel} />
        </div>

        <div className="flex items-end gap-2">
          <TimeStepper
            label={first.label}
            value={first.value}
            onChange={first.set}
          />
          <button
            type="button"
            onClick={() => setLearnFirst((v) => !v)}
            aria-label="Swap play/learn order"
            title="Swap which comes first"
            className="flex h-11 w-9 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeftRight className="size-4" />
          </button>
          <TimeStepper
            label={second.label}
            value={second.value}
            onChange={second.set}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:ml-auto">
          <FieldLabel>Estimated XP</FieldLabel>
          <div className="flex items-center gap-3">
            <span className="flex items-baseline gap-1 text-green-600 dark:text-green-500">
              <span className="text-2xl font-bold tabular-nums">
                +{estimatedXp}
              </span>
              <span className="font-mono text-sm font-semibold">XP</span>
            </span>
            <XpBars />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={start}
        disabled={!topicSlug || starting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-mono text-sm font-semibold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {starting ? 'Starting…' : 'Start mission'}
        <ArrowRight className="size-4" />
      </button>
    </Panel>
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

function GameCarousel({
  games,
  selected,
  onSelect,
}: {
  games: Game[]
  selected: string
  onSelect: (id: string) => void
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const nudge = (dir: number) =>
    scroller.current?.scrollBy({ left: dir * 340, behavior: 'smooth' })
  return (
    <div className="flex items-stretch gap-2">
      <Chevron dir="left" onClick={() => nudge(-1)} />
      <div
        ref={scroller}
        className="flex flex-1 gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {games.map((g) => (
          <GameCard
            key={g.id}
            game={g}
            selected={g.id === selected}
            onSelect={() => onSelect(g.id)}
          />
        ))}
      </div>
      <Chevron dir="right" onClick={() => nudge(1)} />
    </div>
  )
}

function Chevron({
  dir,
  onClick,
}: {
  dir: 'left' | 'right'
  onClick: () => void
}) {
  const Icon = dir === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'left' ? 'Scroll games left' : 'Scroll games right'}
      className="hidden w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:flex"
    >
      <Icon className="size-4" />
    </button>
  )
}

function GameCard({
  game,
  selected,
  onSelect,
}: {
  game: Game
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative flex h-28 w-40 shrink-0 flex-col overflow-hidden rounded-xl border-2 text-left transition-colors',
        selected
          ? 'border-primary'
          : 'border-border hover:border-muted-foreground/50',
      )}
    >
      <span className="truncate px-3 pt-2 pb-1.5 font-heading text-sm font-bold tracking-wide text-foreground uppercase">
        {game.title}
      </span>
      <div className="relative flex-1 bg-muted">
        {game.cover ? (
          <img
            src={game.cover}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gamepad2
              className={cn('size-8', game.accent ?? 'text-muted-foreground')}
            />
          </div>
        )}
      </div>
      {selected && (
        <span className="absolute top-0 right-0 flex size-6 items-center justify-center rounded-bl-lg bg-primary text-primary-foreground">
          <Check className="size-4" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

function SkillCard({
  topic,
  selected,
  onSelect,
}: {
  topic: LauncherTopic
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 px-2 py-4 transition-colors',
        selected
          ? 'border-primary'
          : 'border-border hover:border-muted-foreground/50',
      )}
    >
      <SkillIcon topic={topic} />
      <span className="w-full truncate text-center font-mono text-xs font-medium text-foreground">
        {topic.name}
      </span>
    </button>
  )
}

function StarRating({
  level,
  onChange,
}: {
  level: Difficulty
  onChange: (l: Difficulty) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(starToLevel(i))}
          aria-label={`Set difficulty: ${starToLevel(i)}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'size-5',
              i <= LEVEL_STARS[level]
                ? 'fill-primary text-primary'
                : 'fill-transparent text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  )
}

function TimeStepper({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const clamp = (v: number) => Math.min(120, Math.max(1, v))
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel className={label === 'Play' ? 'text-primary' : undefined}>
        {label} time
      </FieldLabel>
      <div className="flex h-11 items-stretch border border-border focus-within:border-primary">
        <input
          type="number"
          min={1}
          max={120}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 1))}
          aria-label={`${label} minutes`}
          className="w-11 bg-transparent pl-3 text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="flex items-center pr-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          min
        </span>
        <div className="flex flex-col border-l border-border">
          <button
            type="button"
            aria-label={`Increase ${label.toLowerCase()} time`}
            onClick={() => onChange(clamp(value + 5))}
            className="flex flex-1 items-center justify-center px-1.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Decrease ${label.toLowerCase()} time`}
            onClick={() => onChange(clamp(value - 5))}
            className="flex flex-1 items-center justify-center border-t border-border px-1.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>
    </label>
  )
}

// Decorative rising histogram next to the estimated-XP readout.
const XP_BARS = [
  8, 12, 7, 15, 11, 19, 14, 24, 18, 30, 22, 38, 28, 46, 36, 56, 44, 68, 54, 82,
  66, 100,
]
function XpBars() {
  return (
    <div
      className="flex h-9 w-28 items-end gap-px text-green-600 dark:text-green-500"
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
