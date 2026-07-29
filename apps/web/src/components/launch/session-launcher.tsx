import { ArrowLeftRight, ArrowRight } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { api } from '@/api-client'
import { AsyncView } from '@/components/layout/async-view'
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

// The always-present games: instant-play web games first (the one-click
// default), then the console ROM titles (NES/GB — launch the emulator). The
// user's own uploaded ROMs are appended per-device in the component.
const STATIC_GAMES = [
  ...EMBED_CATALOG.map((g) => ({ id: g.id, title: g.title })),
  ...ROM_CATALOG.map((g) => ({
    id: g.id,
    title: `${g.title} (${g.system.toUpperCase()})`,
  })),
]
const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced']

// The app-home hero: one row to start a play/learn focus session. Smart-defaulted
// so a returning user (or a guest) just hits Start.
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
  const games = useMemo(
    () => [
      ...STATIC_GAMES,
      ...uploads.map((u) => ({
        id: u.id,
        title: `${u.title} (${u.system.toUpperCase()})`,
      })),
    ],
    [uploads],
  )
  const [gameId, setGameId] = useState(STATIC_GAMES[0]?.id ?? '')
  const [topicSlug, setTopicSlug] = useState(initial?.slug ?? '')
  const [level, setLevel] = useState<Difficulty>(
    (initial?.difficulty as Difficulty) ?? 'beginner',
  )
  const [playMinutes, setPlayMinutes] = useState(25)
  const [learnMinutes, setLearnMinutes] = useState(5)
  const [learnFirst, setLearnFirst] = useState(false)
  const [starting, setStarting] = useState(false)

  const currentTopic = playable.find((t) => t.slug === topicSlug)

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
    <Panel className="flex flex-col gap-4 border-primary/30">
      <div className="flex items-center justify-between">
        <SectionLabel>Start a session</SectionLabel>
        <span className="hidden font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:inline">
          Play a game · learn between rounds
        </span>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Game">
            <Select value={gameId} onChange={setGameId}>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Topic">
            <Select value={topicSlug} onChange={onTopicChange}>
              {playable.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Level">
            <Select value={level} onChange={(v) => setLevel(v as Difficulty)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex items-end gap-2">
          <TimeField label={first.label} value={first.value} onChange={first.set} />
          <button
            type="button"
            onClick={() => setLearnFirst((v) => !v)}
            aria-label="Swap play/learn order"
            title="Swap which comes first"
            className="mb-0.5 flex size-9 shrink-0 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <ArrowLeftRight className="size-4" />
          </button>
          <TimeField label={second.label} value={second.value} onChange={second.set} />
        </div>

        <button
          type="button"
          onClick={start}
          disabled={!topicSlug || starting}
          className="inline-flex h-[42px] items-center justify-center gap-2 bg-primary px-6 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:opacity-50"
        >
          {starting ? 'Starting…' : 'Start session'}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </Panel>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-[42px] border border-border bg-transparent px-2 text-sm capitalize outline-none focus:border-primary"
    >
      {children}
    </select>
  )
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className={cn(
          'font-mono text-[10px] tracking-widest uppercase',
          label === 'Play' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label} min
      </span>
      <input
        type="number"
        min={1}
        max={120}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="h-[42px] w-16 border border-border bg-transparent px-2 text-sm tabular-nums outline-none focus:border-primary"
      />
    </label>
  )
}
