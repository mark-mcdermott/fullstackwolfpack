import { Clock, Play, Trash2 } from 'lucide-react'
import { formatPlaytime } from '@/core/playtime'
import { cn } from '@/lib/utils'

export type PosterGame = {
  title: string
  accent: string // tailwind text-color class → drives currentColor
  badge: string
  coverImage?: string
  playedSeconds?: number
  onPlay: () => void
  onDelete?: () => void
}

// A Netflix-style poster tile. Uses the game's cover image when it has one, else
// a generated accent poster. Portrait 2:3, hover-scales, play on hover.
export function GamePoster({ game }: { game: PosterGame }) {
  const { title, accent, badge, coverImage, playedSeconds, onPlay, onDelete } =
    game
  return (
    <div className="group relative aspect-[2/3] w-36 shrink-0 overflow-hidden border border-border bg-neutral-950 transition-transform duration-200 hover:z-10 hover:scale-[1.04] sm:w-40">
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${title}`}
        className="absolute inset-0 cursor-pointer text-left"
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <GeneratedPoster title={title} accent={accent} />
        )}

        {/* legibility wash for the title */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-black/25" />

        {/* hover: play affordance */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Play className="size-5" />
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2.5">
          <span className="font-mono text-[9px] tracking-widest text-primary uppercase">
            {badge}
          </span>
          <h3 className="line-clamp-2 text-sm leading-tight font-bold text-white uppercase">
            {title}
          </h3>
          {playedSeconds !== undefined && playedSeconds > 0 && (
            <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest text-white/70 uppercase">
              <Clock className="size-2.5" /> {formatPlaytime(playedSeconds)}
            </span>
          )}
        </div>
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Remove ${title}`}
          className="absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center border border-white/20 bg-black/50 text-white/80 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  )
}

// Original generated cover art — an accent-driven poster (gradient wash, pixel
// grid, a diagonal bar, and the title's monogram). No third-party art.
function GeneratedPoster({ title, accent }: { title: string; accent: string }) {
  const mono = title.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || '??'
  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-neutral-950', accent)}>
      <div className="absolute inset-0 opacity-45 [background:radial-gradient(135%_95%_at_28%_8%,currentColor,transparent_62%)]" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 opacity-25 [background:linear-gradient(to_top,currentColor,transparent_75%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(0deg,currentColor_0_1px,transparent_1px_7px),repeating-linear-gradient(90deg,currentColor_0_1px,transparent_1px_7px)]" />
      <div className="absolute -inset-x-6 top-[36%] h-7 -rotate-[10deg] bg-current opacity-30" />
      <span className="absolute inset-0 flex items-center justify-center pb-6 font-mono text-6xl font-black tracking-tighter opacity-95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
        {mono}
      </span>
    </div>
  )
}
