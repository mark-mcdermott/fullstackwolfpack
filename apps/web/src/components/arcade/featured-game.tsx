import { ArrowRight, Clock, Play } from 'lucide-react'
import { Link } from 'react-router'
import { Panel, SectionLabel } from '@fw/ui'
import type { GamePlaytime } from '@/core/playtime'
import {
  formatPlaytime,
  PLAY_XP_DAILY_CAP,
  PLAY_XP_PER_MINUTE,
} from '@/core/playtime'
import { relativeTime } from '@/core/progress'
import { SYSTEM_META } from '@/core/roms'
import type { RomEntry } from '@/lib/rom-catalog'
import { guestPlayXp } from '@/lib/guest-progress'
import { useAuth } from '@/hooks/auth-context'

// The arcade's featured title: cover art, what it is, who made it, and the two
// ways in — straight to the game, or into a play↔learn mission. The cover
// doubles as the card's ambient wash so each game colors its own hero.
export function FeaturedGame({
  game,
  playtime,
  onPlay,
}: {
  game: RomEntry
  playtime?: GamePlaytime
  onPlay: () => void
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <Panel
        brackets={false}
        className="relative flex overflow-hidden rounded-2xl p-0"
      >
        {game.coverImage && (
          <>
            <img
              src={game.coverImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-125 object-cover opacity-20 blur-2xl dark:opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-card/40" />
          </>
        )}

        <div className="relative flex flex-1 flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Play ${game.title}`}
            className="group relative aspect-[3/4] w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-neutral-950 transition-transform duration-200 hover:scale-[1.03] sm:w-44"
          >
            {game.coverImage && (
              <img
                src={game.coverImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="size-5" />
              </span>
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div>
              <SectionLabel>Arcade</SectionLabel>
              <h1 className="mt-2 font-heading text-3xl leading-[0.95] font-bold uppercase md:text-4xl">
                {game.title}
              </h1>
            </div>

            <p className="max-w-md font-mono text-sm text-muted-foreground">
              {game.description}
            </p>

            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {SYSTEM_META[game.system].label} · {game.author} · {game.license}{' '}
              · runs in your browser
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onPlay}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-mono text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90"
              >
                <Play className="size-4" />
                Play now
              </button>
              <MissionLink />
            </div>
          </div>
        </div>
      </Panel>

      <PlaytimeCard game={game} playtime={playtime} />
    </section>
  )
}

// Into the play↔learn loop rather than a free-play session — the launcher lives
// on whichever home the visitor has.
function MissionLink() {
  const home = useAuth().user ? '/app' : '/'
  return (
    <Link
      to={`${home}#start-session`}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 font-mono text-xs font-semibold tracking-widest uppercase transition-colors hover:border-primary hover:text-primary"
    >
      Start a mission
      <ArrowRight className="size-4" />
    </Link>
  )
}

// Time on this title (server-tracked once you have an account) or the play XP a
// guest has banked on this device.
function PlaytimeCard({
  game,
  playtime,
}: {
  game: RomEntry
  playtime?: GamePlaytime
}) {
  const signedIn = !!useAuth().user
  const played = playtime?.seconds ?? 0

  return (
    <Panel brackets={false} className="flex flex-col gap-4 rounded-2xl">
      <SectionLabel>{signedIn ? 'Your playtime' : 'Your run'}</SectionLabel>

      {signedIn ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-4xl font-bold tabular-nums">
              {played > 0 ? formatPlaytime(played) : '0m'}
            </span>
            <span className="font-mono text-xs text-muted-foreground uppercase">
              on {game.title}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3 font-mono text-[10px] tracking-widest uppercase">
            <span className="text-muted-foreground">Last played</span>
            <span>
              {playtime ? relativeTime(playtime.lastPlayedAt) : 'never'}
            </span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            <Clock className="mr-1 inline size-3" />
            Playtime is banked per title and feeds your XP.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-4xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {guestPlayXp()}
            </span>
            <span className="font-mono text-sm font-semibold text-muted-foreground">
              XP
            </span>
          </div>
          <dl className="flex flex-col gap-2 border-t border-border pt-3 font-mono text-[10px] tracking-widest uppercase">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Earn rate</dt>
              <dd>+{PLAY_XP_PER_MINUTE} XP / min</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Daily cap</dt>
              <dd>{PLAY_XP_DAILY_CAP} XP</dd>
            </div>
          </dl>
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            Play as long as you like — an account keeps the XP and tracks your
            time per title.
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <Link
              to="/signup"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-mono text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90"
            >
              Create a free account
              <ArrowRight className="size-4" />
            </Link>
            <p className="text-center font-mono text-[10px] text-muted-foreground">
              Already have one?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </>
      )}
    </Panel>
  )
}
