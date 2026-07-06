import { GraduationCap, LogOut, Maximize, Minimize, Play } from 'lucide-react'
import { useState } from 'react'
import { Panel, Pill, SectionLabel } from '@fw/ui'
import { useFullscreen } from '@/hooks/use-fullscreen'
import { usePlaytimeTracker } from '@/hooks/use-playtime-tracker'
import { embedGameUrl, type EmbedEntry } from '@/lib/embed-catalog'
import { cn } from '@/lib/utils'

// Plays a self-hosted HTML5 game (the embed lane) in a sandboxed iframe.
//
// Sandbox: `allow-scripts allow-same-origin` lets these vetted, source-reviewed,
// first-party static games use canvas/WebGL/storage and run reliably. It does
// trade away cross-frame isolation; the hardening path (tracked in the roadmap)
// is to serve `public/games/` from a separate origin so `allow-same-origin` can
// be dropped. No `allow-forms`/`allow-popups`/`allow-top-navigation`.
export function EmbedPlayer({
  game,
  onExit,
}: {
  game: EmbedEntry
  onExit: () => void
}) {
  const [lessonOpen, setLessonOpen] = useState(false)
  const fs = useFullscreen<HTMLDivElement>()
  usePlaytimeTracker(game)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Now playing</SectionLabel>
          <h1 className="mt-1 text-3xl font-semibold uppercase">{game.title}</h1>
        </div>
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
            sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            allow="autoplay; gamepad; fullscreen"
          />

          {lessonOpen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center">
              <GraduationCap className="size-8 text-primary" />
              <div>
                <SectionLabel>Interval reached</SectionLabel>
                <h2 className="mt-1 text-2xl font-bold uppercase">
                  Time to learn
                </h2>
                <p className="mx-auto mt-2 max-w-sm font-mono text-xs text-muted-foreground">
                  The game is paused. This is where your next lesson drops in —
                  finish it to keep your streak, then jump back in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLessonOpen(false)}
                className="flex items-center justify-center gap-2 bg-primary px-4 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
              >
                <Play className="size-4" /> Resume game
              </button>
            </div>
          )}
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLessonOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary px-4 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            <GraduationCap className="size-4" /> Pause for lesson
          </button>
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
    </div>
  )
}
