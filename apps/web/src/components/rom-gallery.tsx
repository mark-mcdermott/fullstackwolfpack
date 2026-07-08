import { Search, Upload } from 'lucide-react'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { GamePoster, type PosterGame } from '@/components/arcade/game-poster'
import {
  type GamePlaytime,
  gameKey,
  type PlaytimeSource,
} from '@/core/playtime'
import {
  ACCEPTED_EXTENSIONS,
  type RomSystem,
  SYSTEM_META,
  validateRom,
} from '@/core/roms'
import { EMBED_CATALOG, type EmbedEntry } from '@/lib/embed-catalog'
import {
  type PlayableRom,
  ROM_CATALOG,
  type RomEntry,
  type UploadedRom,
} from '@/lib/rom-catalog'

export type PlayableGame = PlayableRom | EmbedEntry

function matches(query: string, ...fields: string[]): boolean {
  if (!query) return true
  return fields.some((f) => f.toLowerCase().includes(query))
}

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

function UploadPoster({
  onUpload,
}: {
  onUpload: (file: File, system: RomSystem) => void
}) {
  const inputId = useId()
  const [error, setError] = useState<string | null>(null)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const result = validateRom(file)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    onUpload(file, result.system)
  }

  return (
    <label
      htmlFor={inputId}
      className="group flex aspect-[2/3] w-36 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-muted/20 p-3 text-center text-muted-foreground transition-colors hover:border-primary hover:text-foreground sm:w-40"
    >
      <Upload className="size-5 text-primary" />
      <span className="font-mono text-[10px] tracking-widest uppercase">
        Add your ROM
      </span>
      <span className="font-mono text-[9px] text-muted-foreground">
        {ACCEPTED_EXTENSIONS.join(' · ')}
      </span>
      <input
        id={inputId}
        type="file"
        aria-label="Add your ROM"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <span role="alert" className="font-mono text-[9px] text-destructive">
          {error}
        </span>
      )}
    </label>
  )
}

export function RomGallery({
  onSelect,
  uploads,
  onUpload,
  onDelete,
  playtimeByGame,
}: {
  onSelect: (game: PlayableGame) => void
  uploads: UploadedRom[]
  onUpload: (file: File, system: RomSystem) => void
  onDelete: (id: string) => void
  playtimeByGame: Map<string, GamePlaytime>
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const played = (game: { source: PlaytimeSource; id: string }) =>
    playtimeByGame.get(gameKey(game))?.seconds

  const embedPoster = (g: EmbedEntry): PosterGame => ({
    title: g.title,
    accent: g.accent,
    badge: 'Web',
    coverImage: g.coverImage,
    playedSeconds: played(g),
    onPlay: () => onSelect(g),
  })
  const romPoster = (r: RomEntry): PosterGame => ({
    title: r.title,
    accent: r.accent,
    badge: SYSTEM_META[r.system].label,
    coverImage: r.coverImage,
    playedSeconds: played(r),
    onPlay: () => onSelect(r),
  })
  const uploadPoster = (r: UploadedRom): PosterGame => ({
    title: r.title,
    accent: 'text-primary',
    badge: SYSTEM_META[r.system].label,
    playedSeconds: played(r),
    onPlay: () => onSelect(r),
    onDelete: () => onDelete(r.id),
  })

  const embeds = useMemo(
    () =>
      sortByRecentlyPlayed(
        EMBED_CATALOG.filter((g) => matches(q, g.title, g.author)),
        playtimeByGame,
      ),
    [q, playtimeByGame],
  )
  const roms = useMemo(
    () =>
      sortByRecentlyPlayed(
        ROM_CATALOG.filter((r) => matches(q, r.title, r.author)),
        playtimeByGame,
      ),
    [q, playtimeByGame],
  )
  const uploadedRoms = useMemo(
    () =>
      sortByRecentlyPlayed(
        uploads.filter((r) => matches(q, r.title)),
        playtimeByGame,
      ),
    [uploads, q, playtimeByGame],
  )

  const romsBySystem = useMemo(() => {
    const groups = new Map<RomSystem, RomEntry[]>()
    for (const r of roms) {
      const list = groups.get(r.system) ?? []
      list.push(r)
      groups.set(r.system, list)
    }
    return groups
  }, [roms])

  const nothingFound =
    q !== '' && embeds.length + roms.length + uploadedRoms.length === 0

  return (
    <div className="flex flex-col gap-7">
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

      {q ? (
        // Search results: one flat poster grid.
        nothingFound ? (
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
        )
      ) : (
        <>
          {embeds.length > 0 && (
            <PosterRow title="Web games">
              {embeds.map((g) => (
                <GamePoster key={g.id} game={embedPoster(g)} />
              ))}
            </PosterRow>
          )}
          {[...romsBySystem].map(([system, list]) => (
            <PosterRow key={system} title={SYSTEM_META[system].label}>
              {list.map((r) => (
                <GamePoster key={r.id} game={romPoster(r)} />
              ))}
            </PosterRow>
          ))}
          <PosterRow title="Your library">
            {uploadedRoms.map((r) => (
              <GamePoster key={r.id} game={uploadPoster(r)} />
            ))}
            <UploadPoster onUpload={onUpload} />
          </PosterRow>
        </>
      )}
    </div>
  )
}
