import { Crown, Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api-client'
import { PageHeading, Panel, SectionLabel } from '@fw/ui'
import {
  type LeaderboardEntry,
  type LeaderboardView,
  ordinal,
} from '@/core/leaderboard'
import { cn } from '@/lib/utils'

// Gold / silver / bronze accents for the podium; everyone else is muted.
const RANK_ACCENT: Record<number, string> = {
  1: 'text-amber-400',
  2: 'text-slate-300',
  3: 'text-orange-400',
}

function EntryRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 sm:gap-4',
        entry.isMe && 'bg-primary/10',
      )}
    >
      <span
        className={cn(
          'w-12 shrink-0 font-mono text-sm font-bold tabular-nums',
          RANK_ACCENT[entry.rank] ?? 'text-muted-foreground',
        )}
      >
        {ordinal(entry.rank)}
      </span>
      <span className="flex-1 truncate text-sm font-bold uppercase">
        {entry.name}
        {entry.isMe && (
          <span className="ml-2 font-mono text-[10px] tracking-widest text-primary">
            You
          </span>
        )}
      </span>
      <span className="hidden font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:inline">
        Lv {entry.level}
      </span>
      {entry.streak > 0 && (
        <span className="hidden items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:flex">
          <Flame className="size-3" />
          {entry.streak}
        </span>
      )}
      <span className="w-20 text-right font-mono text-sm font-bold tabular-nums sm:w-24">
        {entry.xp.toLocaleString()} XP
      </span>
    </div>
  )
}

export function LeaderboardPage() {
  const [view, setView] = useState<LeaderboardView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.leaderboard
      .get()
      .then(setView)
      .catch(() => setError('Could not load the leaderboard.'))
  }, [])

  async function toggle() {
    if (!view || saving) return
    setSaving(true)
    setError(null)
    try {
      setView(await api.leaderboard.setOptIn(!view.optedIn))
    } catch {
      setError('Could not update your leaderboard setting.')
    } finally {
      setSaving(false)
    }
  }

  const meInTop = view?.me != null && view.entries.some((e) => e.isMe)

  return (
    <div>
      <PageHeading
        label="Leaderboard"
        title="Leaderboard"
        subtitle="The top learners by XP. Opt in to claim your spot."
      />

      {error && (
        <p role="alert" className="mb-4 font-mono text-xs text-destructive">
          {error}
        </p>
      )}

      {!view ? (
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Loading leaderboard…
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <Panel className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <SectionLabel>Your visibility</SectionLabel>
              <p className="mt-1 max-w-md font-mono text-xs text-muted-foreground">
                {view.optedIn
                  ? "You're on the public board — your name, level, and XP are visible to everyone."
                  : "You're hidden. Opt in to appear in the ranking; your name, level, and XP become public."}
              </p>
            </div>
            <button
              type="button"
              onClick={toggle}
              disabled={saving}
              className={cn(
                'flex items-center justify-center gap-2 px-5 py-2.5 font-mono text-xs tracking-widest uppercase disabled:opacity-50',
                view.optedIn
                  ? 'border border-border hover:bg-muted'
                  : 'bg-primary text-primary-foreground hover:bg-primary/80',
              )}
            >
              {saving
                ? 'Saving…'
                : view.optedIn
                  ? 'Leave leaderboard'
                  : 'Join leaderboard'}
            </button>
          </Panel>

          <Panel className="overflow-hidden p-0">
            {view.entries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Crown className="size-8 text-muted-foreground" />
                <p className="max-w-xs font-mono text-xs text-muted-foreground">
                  No one’s on the board yet. Opt in to be the first.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {view.entries.map((e) => (
                  <EntryRow key={e.rank} entry={e} />
                ))}
              </div>
            )}
          </Panel>

          {view.me && !meInTop && (
            <div>
              <SectionLabel>Your rank</SectionLabel>
              <Panel className="mt-2 overflow-hidden p-0">
                <EntryRow entry={view.me} />
              </Panel>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
