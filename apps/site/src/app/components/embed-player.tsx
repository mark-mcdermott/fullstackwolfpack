import { GraduationCap, LogOut, Maximize, Minimize } from 'lucide-react'
import { Panel, Pill, SectionLabel } from '@fw/ui'
import { FocusLessonOverlay } from '@/components/focus/focus-lesson-overlay'
import { SessionTimerInline } from '@/components/focus/session-timer-inline'
import { useFullscreen } from '@/hooks/use-fullscreen'
import { usePlaytimeTracker } from '@/hooks/use-playtime-tracker'
import { useTimer } from '@/hooks/timer-context'
import {
  embedGameUrl,
  embedGamesCrossOrigin,
  type EmbedEntry,
} from '@/lib/embed-catalog'
import { cn } from '@/lib/utils'

// Plays a self-hosted HTML5 game (the embed lane) in a sandboxed iframe.
//
// Sandbox: always `allow-scripts allow-pointer-lock` (never `allow-forms` /
// `allow-popups` / `allow-top-navigation` / `allow-modals`). `allow-same-origin`
// is added ONLY when games are served same-origin (the default) — vetted static
// games need it for canvas/WebGL/storage. Set VITE_GAMES_ORIGIN to serve them
// from a separate sandbox origin; then `allow-same-origin` is dropped and the
// game code gets full cross-origin isolation. `referrerpolicy="no-referrer"`
// keeps the parent URL out of the frame either way.
export function EmbedPlayer({
  game,
  onExit,
}: {
  game: EmbedEntry
  onExit: () => void
}) {
  const fs = useFullscreen<HTMLDivElement>()
  const timer = useTimer()
  usePlaytimeTracker(game)

  // During a focus session's learn phase, the real lesson overlays the (still
  // mounted) game; finishing it advances the timer back to play.
  const inSession = timer.active
  const learnPhase = inSession && timer.step?.phase === 'learn'

  const sandbox = embedGamesCrossOrigin()
    ? 'allow-scripts allow-pointer-lock'
    : 'allow-scripts allow-same-origin allow-pointer-lock'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Now playing</SectionLabel>
          <h1 className="mt-1 text-3xl font-semibold uppercase">{game.title}</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SessionTimerInline />
          <div className="flex items-center gap-3">
            <Pill>Web</Pill>
            <button
              type="button"
              onClick={onExit}
              className="flex items-center justify-center gap-2 border border-border px-4 py-2.5 font-mono text-xs tracking-widest uppercase hover:bg-muted"
            >
              <LogOut className="size-4" /> Exit
            </button>
          </div>
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
        <div
          ref={fs.ref}
          className={cn(
            'relative w-full bg-black',
            fs.isFullscreen ? 'h-full' : 'aspect-video',
          )}
        >
          <iframe
            title={game.title}
            src={embedGameUrl(game)}
            className="absolute inset-0 h-full w-full border-0"
            sandbox={sandbox}
            allow="autoplay; gamepad; fullscreen"
            referrerPolicy="no-referrer"
          />
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {inSession && timer.step?.phase === 'play' && (
            <button
              type="button"
              onClick={timer.skip}
              className="flex items-center justify-center gap-2 bg-primary px-4 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
            >
              <GraduationCap className="size-4" /> Learn now
            </button>
          )}
          {fs.supported && (
            <button
              type="button"
              onClick={fs.toggle}
              className="flex items-center justify-center gap-2 border border-border px-4 py-2.5 font-mono text-xs tracking-widest uppercase hover:bg-muted"
            >
              {fs.isFullscreen ? (
                <Minimize className="size-4" />
              ) : (
                <Maximize className="size-4" />
              )}
              {fs.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </button>
          )}
        </div>
        {/* Attribution at play time — satisfies the keep-the-notice / credit obligation. */}
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {game.author} ·{' '}
          <a
            href={game.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {game.license}
          </a>
        </p>
      </div>

      {learnPhase && <FocusLessonOverlay onResume={timer.skip} />}
    </div>
  )
}
