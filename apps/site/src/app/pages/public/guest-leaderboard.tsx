import { ArrowRight, Crown, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { api } from '@/api-client'
import { PageHeading, Panel, SectionLabel } from '@fw/ui'
import { LEADERBOARD_TOP_N, ordinal, type LeaderboardView } from '@/core/leaderboard'
import { useAuth } from '@/hooks/auth-context'
import { guestXp } from '@/lib/guest-progress'
import {
  getClaimedUsername,
  setClaimedUsername,
} from '@/lib/guest-identity'
import { EntryRow } from '@/pages/app/leaderboard'

// Public leaderboard for guests: view-only. A guest's XP is local, so they're not
// on the board — but if their guest XP clears the cutoff, we surface a "you made
// the board! claim your username" moment that saves the name for signup.
export function GuestLeaderboard() {
  const { user, loading } = useAuth()
  const nav = useNavigate()
  const [view, setView] = useState<LeaderboardView | null>(null)
  const [claimOpen, setClaimOpen] = useState(false)
  const [name, setName] = useState('')
  const xp = guestXp()

  useEffect(() => {
    api.public.leaderboard().then(setView).catch(() => setView(null))
  }, [])

  // Would the guest's local XP place them on the visible board?
  const entries = view?.entries ?? []
  const boardFull = entries.length >= LEADERBOARD_TOP_N
  const cutoff = boardFull ? entries[entries.length - 1]!.xp : 0
  const wouldRank = xp > 0 && xp > cutoff
  const projectedRank = entries.filter((e) => e.xp > xp).length + 1
  const alreadyClaimed = getClaimedUsername() !== ''

  // Offer the claim moment once, when they first qualify and haven't named yet.
  useEffect(() => {
    if (wouldRank && !alreadyClaimed) setClaimOpen(true)
  }, [wouldRank, alreadyClaimed])

  // Signed-in users get the real (opt-in) board.
  if (!loading && user) return <Navigate to="/app/leaderboard" replace />

  function claim() {
    const n = name.trim()
    if (!n) return
    setClaimedUsername(n)
    setClaimOpen(false)
  }

  return (
    <div>
      <PageHeading
        label="Leaderboard"
        title="Leaderboard"
        subtitle="The top learners by XP. Sign up to claim your spot in the ranking."
      />

      {wouldRank && (
        <Panel className="mb-5 flex flex-wrap items-center justify-between gap-3 border-primary/40 bg-primary/10">
          <p className="flex items-center gap-2 text-sm">
            <Trophy className="size-4 shrink-0 text-primary" />
            You'd rank <span className="font-bold">{ordinal(projectedRank)}</span>{' '}
            with your <span className="font-bold">{xp.toLocaleString()} XP</span>.
            Sign up to claim it.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 font-mono text-[10px] tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            Claim my spot <ArrowRight className="size-3.5" />
          </Link>
        </Panel>
      )}

      <Panel className="overflow-hidden p-0">
        {!view ? (
          <p className="px-4 py-8 text-center font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Loading…
          </p>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Crown className="size-8 text-muted-foreground" />
            <p className="max-w-xs font-mono text-xs text-muted-foreground">
              No one's on the board yet — sign up and be the first.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((e) => (
              <EntryRow key={e.rank} entry={e} />
            ))}
          </div>
        )}
      </Panel>

      {claimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-sm flex-col gap-4 border border-border bg-background p-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <Trophy className="size-8 text-primary" />
              <SectionLabel>You made the leaderboard!</SectionLabel>
              <p className="text-sm text-muted-foreground">
                Your {xp.toLocaleString()} XP would rank{' '}
                <span className="font-bold text-foreground">
                  {ordinal(projectedRank)}
                </span>
                . Claim your username now — we'll use it when you sign up.
              </p>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && claim()}
              placeholder="Pick a username"
              maxLength={30}
              autoFocus
              className="border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={claim}
                disabled={!name.trim()}
                className="flex-1 bg-primary px-4 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:opacity-50"
              >
                Claim it
              </button>
              <button
                type="button"
                onClick={() => setClaimOpen(false)}
                className="border border-border px-4 py-2.5 font-mono text-xs tracking-widest uppercase hover:bg-muted"
              >
                Later
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                claim()
                if (name.trim()) nav('/signup')
              }}
              className="font-mono text-[10px] tracking-widest text-primary uppercase hover:underline"
            >
              Claim &amp; sign up now →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
