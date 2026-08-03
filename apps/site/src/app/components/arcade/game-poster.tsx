import { Clock, ImagePlus, Play, RotateCcw, Trash2 } from 'lucide-react'
import { useState, type DragEvent } from 'react'
import { formatPlaytime } from '@/core/playtime'
import { cn } from '@/lib/utils'

export type PosterGame = {
  title: string
  accent: string // tailwind text-color class → drives currentColor
  badge: string
  coverImage?: string // catalog cover (path under public/)
  coverUrl?: string // user's custom cover (object URL from IndexedDB) — wins
  playedSeconds?: number
  onPlay: () => void
  onDelete?: () => void
  onDropImage?: (file: File) => void
  onResetCover?: () => void
}

function imageFrom(e: DragEvent): File | null {
  return (
    [...e.dataTransfer.files].find((f) => f.type.startsWith('image/')) ?? null
  )
}

// A Netflix-style poster tile that's also a cover dropzone: drop an image and it
// crops to fit (preview + confirm handled by the gallery). Uses the custom cover
// if set, else the catalog cover, else a generated accent poster.
export function GamePoster({ game }: { game: PosterGame }) {
  const {
    title,
    accent,
    badge,
    coverImage,
    coverUrl,
    playedSeconds,
    onPlay,
    onDelete,
    onDropImage,
    onResetCover,
  } = game
  const [dragging, setDragging] = useState(false)
  const cover = coverUrl ?? coverImage

  return (
    <div
      onDragOver={
        onDropImage
          ? (e) => {
              e.preventDefault()
              setDragging(true)
            }
          : undefined
      }
      onDragLeave={() => setDragging(false)}
      onDrop={
        onDropImage
          ? (e) => {
              e.preventDefault()
              setDragging(false)
              const file = imageFrom(e)
              if (file) onDropImage(file)
            }
          : undefined
      }
      className={cn(
        'group relative aspect-[3/4] w-36 shrink-0 overflow-hidden border border-border bg-neutral-950 transition-transform duration-200 hover:z-10 hover:scale-[1.04] sm:w-40',
        dragging && 'ring-2 ring-primary',
      )}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${title}`}
        className="absolute inset-0 cursor-pointer text-left"
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <GeneratedPoster title={title} accent={accent} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-black/25" />

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

      {/* Drag-over prompt */}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-primary/25 text-white backdrop-blur-sm">
          <ImagePlus className="size-6" />
          <span className="font-mono text-[9px] tracking-widest uppercase">
            Drop cover
          </span>
        </div>
      )}

      {/* Reset a custom cover back to the default */}
      {coverUrl && onResetCover && (
        <button
          type="button"
          onClick={onResetCover}
          aria-label={`Reset ${title} cover`}
          title="Reset to default cover"
          className="absolute top-1.5 left-1.5 z-10 flex size-6 items-center justify-center border border-white/20 bg-black/50 text-white/80 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
        >
          <RotateCcw className="size-3" />
        </button>
      )}

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
