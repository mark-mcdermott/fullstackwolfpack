import { Check, X } from 'lucide-react'
// TEMP (single-title focus): `Search` + `Upload` come back with the search bar
// and the "Your library" lane.
// import { Search, Upload } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
// TEMP: `useId` belongs to the commented-out UploadPoster.
// import { useId } from 'react'
import { GamePoster, type PosterGame } from '@/components/arcade/game-poster'
import { SectionLabel, raisedCtaClass, raisedCtaCompactClass, secondaryCtaClass } from '@fw/ui'
import {
  type GamePlaytime,
  gameKey,
  type PlaytimeSource,
} from '@/core/playtime'
import { useCovers } from '@/hooks/use-covers'
import { coverCropToBlob } from '@/lib/crop-image'
import {
  // TEMP: ACCEPTED_EXTENSIONS + validateRom belong to the upload tile.
  // ACCEPTED_EXTENSIONS,
  type RomSystem,
  SYSTEM_META,
  // validateRom,
} from '@/core/roms'
// TEMP: EMBED_CATALOG returns with the "Web games" lane. The type stays —
// embeds are still playable via a deep link from the session launcher.
// import { EMBED_CATALOG } from '@/lib/embed-catalog'
import { type EmbedEntry } from '@/lib/embed-catalog'
import {
  type PlayableRom,
  ROM_CATALOG,
  type RomEntry,
  // TEMP: UploadedRom returns with the "Your library" lane.
  // type UploadedRom,
} from '@/lib/rom-catalog'
import { cn } from '@/lib/utils'

export type PlayableGame = PlayableRom | EmbedEntry

// TEMP: only the search bar filters lanes, so `matches` is parked with it.
// function matches(query: string, ...fields: string[]): boolean {
//   if (!query) return true
//   return fields.some((f) => f.toLowerCase().includes(query))
// }

// Float titles the user has played to the front of their lane (most recent
// first); everything unplayed keeps its original order behind them.
function sortByRecentlyPlayed<T extends { source: PlaytimeSource; id: string }>(
  items: T[],
  byGame: Map<string, GamePlaytime>,
): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const pa = byGame.get(gameKey(a.item))
      const pb = byGame.get(gameKey(b.item))
      if (pa && pb) return pb.lastPlayedAt.localeCompare(pa.lastPlayedAt)
      if (pa) return -1
      if (pb) return 1
      return a.index - b.index
    })
    .map((x) => x.item)
}

// A horizontal, scrollable poster row (Netflix-style lane).
function PosterRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-mono text-xs font-bold tracking-widest text-foreground uppercase">
        {title}
      </h2>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">{children}</div>
    </section>
  )
}

// TEMP: the "Add your ROM" tile returns with the "Your library" lane.
// function UploadPoster({
//   onUpload,
// }: {
//   onUpload: (file: File, system: RomSystem) => void
// }) {
//   const inputId = useId()
//   const [error, setError] = useState<string | null>(null)
//
//   function handleFiles(files: FileList | null) {
//     const file = files?.[0]
//     if (!file) return
//     const result = validateRom(file)
//     if (!result.ok) {
//       setError(result.error)
//       return
//     }
//     setError(null)
//     onUpload(file, result.system)
//   }
//
//   return (
//     <label
//       htmlFor={inputId}
//       className="group flex aspect-[3/4] w-36 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-muted/20 p-3 text-center text-muted-foreground transition-colors hover:border-primary hover:text-foreground sm:w-40"
//     >
//       <Upload className="size-5 text-primary" />
//       <span className="font-mono text-[10px] tracking-widest uppercase">
//         Add your ROM
//       </span>
//       <span className="font-mono text-[9px] text-muted-foreground">
//         {ACCEPTED_EXTENSIONS.join(' · ')}
//       </span>
//       <input
//         id={inputId}
//         type="file"
//         aria-label="Add your ROM"
//         accept={ACCEPTED_EXTENSIONS.join(',')}
//         className="sr-only"
//         onChange={(e) => handleFiles(e.target.files)}
//       />
//       {error && (
//         <span role="alert" className="font-mono text-[9px] text-destructive">
//           {error}
//         </span>
//       )}
//     </label>
//   )
// }

export function RomGallery({
  onSelect,
  playtimeByGame,
  // TEMP: the upload props return with the "Your library" lane.
  // uploads,
  // onUpload,
  // onDelete,
}: {
  onSelect: (game: PlayableGame) => void
  playtimeByGame: Map<string, GamePlaytime>
  // uploads: UploadedRom[]
  // onUpload: (file: File, system: RomSystem) => void
  // onDelete: (id: string) => void
}) {
  // TEMP: search spans every lane, so it's parked until they're all back.
  // const [query, setQuery] = useState('')
  // const q = query.trim().toLowerCase()

  const { covers, setCover, removeCover } = useCovers()
  // A dropped image, cropped to 2:3, awaiting confirm.
  const [pending, setPending] = useState<{
    gameId: string
    url: string
    blob: Blob
  } | null>(null)

  async function handleDropCover(gameId: string, file: File) {
    try {
      const blob = await coverCropToBlob(file)
      setPending((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return { gameId, url: URL.createObjectURL(blob), blob }
      })
    } catch {
      /* not a usable image — ignore */
    }
  }
  async function confirmCover() {
    if (!pending) return
    await setCover(pending.gameId, pending.blob)
    URL.revokeObjectURL(pending.url)
    setPending(null)
  }
  function cancelCover() {
    if (pending) URL.revokeObjectURL(pending.url)
    setPending(null)
  }

  const played = (game: { source: PlaytimeSource; id: string }) =>
    playtimeByGame.get(gameKey(game))?.seconds

  // Shared cover wiring: custom cover from IndexedDB, drop-to-set, reset.
  const coverProps = (id: string) => ({
    coverUrl: covers.get(id),
    onDropImage: (file: File) => handleDropCover(id, file),
    onResetCover: covers.has(id) ? () => void removeCover(id) : undefined,
  })

  // TEMP: poster mappers for the two parked lanes.
  // const embedPoster = (g: EmbedEntry): PosterGame => ({
  //   title: g.title,
  //   accent: g.accent,
  //   badge: 'Web',
  //   coverImage: g.coverImage,
  //   playedSeconds: played(g),
  //   onPlay: () => onSelect(g),
  //   ...coverProps(g.id),
  // })
  const romPoster = (r: RomEntry): PosterGame => ({
    title: r.title,
    accent: r.accent,
    badge: SYSTEM_META[r.system].label,
    coverImage: r.coverImage,
    playedSeconds: played(r),
    onPlay: () => onSelect(r),
    ...coverProps(r.id),
  })
  // const uploadPoster = (r: UploadedRom): PosterGame => ({
  //   title: r.title,
  //   accent: 'text-primary',
  //   badge: SYSTEM_META[r.system].label,
  //   playedSeconds: played(r),
  //   onPlay: () => onSelect(r),
  //   onDelete: () => onDelete(r.id),
  //   ...coverProps(r.id),
  // })

  // const embeds = useMemo(
  //   () =>
  //     sortByRecentlyPlayed(
  //       EMBED_CATALOG.filter((g) => matches(q, g.title, g.author)),
  //       playtimeByGame,
  //     ),
  //   [q, playtimeByGame],
  // )
  const roms = useMemo(
    () =>
      sortByRecentlyPlayed(
        // TEMP: one system at a time — drop this filter to bring NES back.
        ROM_CATALOG.filter((r) => r.system === 'gb'),
        playtimeByGame,
      ),
    [playtimeByGame],
  )
  // const uploadedRoms = useMemo(
  //   () =>
  //     sortByRecentlyPlayed(
  //       uploads.filter((r) => matches(q, r.title)),
  //       playtimeByGame,
  //     ),
  //   [uploads, q, playtimeByGame],
  // )

  const romsBySystem = useMemo(() => {
    const groups = new Map<RomSystem, RomEntry[]>()
    for (const r of roms) {
      const list = groups.get(r.system) ?? []
      list.push(r)
      groups.set(r.system, list)
    }
    return groups
  }, [roms])

  // const nothingFound =
  //   q !== '' && embeds.length + roms.length + uploadedRoms.length === 0

  return (
    <div className="flex flex-col gap-7">
      {/* TEMP: search comes back once there is more than one lane to search.
      <div className="flex items-center gap-2 border border-border px-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games..."
          aria-label="Search games"
          className="w-full bg-transparent py-2 font-mono text-xs outline-none"
        />
      </div>
      */}

      {/* TEMP: search results — one flat poster grid across every lane.
      {nothingFound ? (
        <p className="font-mono text-xs text-muted-foreground">
          No games match “{query}”.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {embeds.map((g) => (
            <GamePoster key={g.id} game={embedPoster(g)} />
          ))}
          {roms.map((r) => (
            <GamePoster key={r.id} game={romPoster(r)} />
          ))}
          {uploadedRoms.map((r) => (
            <GamePoster key={r.id} game={uploadPoster(r)} />
          ))}
        </div>
      )}
      */}

      {/* TEMP: the "Web games" lane.
      {embeds.length > 0 && (
        <PosterRow title="Web games">
          {embeds.map((g) => (
            <GamePoster key={g.id} game={embedPoster(g)} />
          ))}
        </PosterRow>
      )}
      */}

      {[...romsBySystem].map(([system, list]) => (
        <PosterRow key={system} title={SYSTEM_META[system].label}>
          {list.map((r) => (
            <GamePoster key={r.id} game={romPoster(r)} />
          ))}
        </PosterRow>
      ))}

      {/* TEMP: the "Your library" lane (uploads + the "Add your ROM" tile).
      <PosterRow title="Your library">
        {uploadedRoms.map((r) => (
          <GamePoster key={r.id} game={uploadPoster(r)} />
        ))}
        <UploadPoster onUpload={onUpload} />
      </PosterRow>
      */}

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={cancelCover}
        >
          <div
            className="flex flex-col items-center gap-4 border border-border bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <SectionLabel>New cover — cropped to fit</SectionLabel>
            <img
              src={pending.url}
              alt="Cover preview"
              className="aspect-[3/4] w-44 border border-border object-cover"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmCover}
                className={cn(raisedCtaClass, raisedCtaCompactClass, 'cta-blaze')}
              >
                <Check className="size-4" /> Use this cover
              </button>
              <button
                type="button"
                onClick={cancelCover}
                className={secondaryCtaClass}
              >
                <X className="size-4" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
