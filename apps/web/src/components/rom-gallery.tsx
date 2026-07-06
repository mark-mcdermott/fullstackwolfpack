import { Clock, Play, Search, Trash2, Upload } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Panel, Pill } from '@fw/ui'
import {
  formatPlaytime,
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
import { cn } from '@/lib/utils'

export type PlayableGame = PlayableRom | EmbedEntry

type Filter = RomSystem | 'web' | null

const SYSTEMS_IN_CATALOG = [
  ...new Set(ROM_CATALOG.map((rom) => rom.system)),
] as RomSystem[]

const TABS: [string, Filter][] = [
  ['All', null],
  ['Web', 'web'],
  ...SYSTEMS_IN_CATALOG.map(
    (system) => [SYSTEM_META[system].label, system] as [string, Filter],
  ),
]

// One tile for any lane — catalog ROM, embed, or a user upload. Same shape;
// uploads add a remove button via `onDelete`.
function GameTile({
  accent,
  title,
  subtitle,
  badge,
  description,
  playedSeconds,
  onPlay,
  onDelete,
}: {
  accent: string
  title: string
  subtitle: string
  badge: string
  description: string
  playedSeconds?: number
  onPlay: () => void
  onDelete?: () => void
}) {
  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className={cn('font-mono text-2xl font-bold', accent)}>
          {title.slice(0, 2).toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          <Pill>{badge}</Pill>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Remove ${title}`}
              className="border border-border p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold uppercase">{title}</h3>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {subtitle}
        </p>
      </div>
      {playedSeconds !== undefined && playedSeconds > 0 && (
        <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-primary/80 uppercase">
          <Clock className="size-3" />
          {formatPlaytime(playedSeconds)} played
        </p>
      )}
      <p className="line-clamp-3 font-mono text-xs text-muted-foreground">
        {description}
      </p>
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${title}`}
        className="mt-auto flex cursor-pointer items-center justify-center gap-2 bg-primary px-4 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
      >
        <Play className="size-4" />
        Play
      </button>
    </Panel>
  )
}

function UploadTile({
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
    <Panel className="flex flex-col gap-3 border-dashed">
      <Upload className="size-5 text-primary" />
      <div>
        <h3 className="text-lg font-bold uppercase">Add your ROM</h3>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Bring your own · stays on this device
        </p>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        {ACCEPTED_EXTENSIONS.join(' · ')}
      </p>
      <label
        htmlFor={inputId}
        className="mt-auto flex cursor-pointer items-center justify-center gap-2 border border-border px-4 py-2.5 font-mono text-xs tracking-widest uppercase hover:bg-muted"
      >
        <Upload className="size-4" />
        Choose file
      </label>
      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <p role="alert" className="font-mono text-xs text-destructive">
          {error}
        </p>
      )}
    </Panel>
  )
}

function matches(query: string, ...fields: string[]): boolean {
  if (!query) return true
  return fields.some((f) => f.toLowerCase().includes(query))
}

// Float titles the user has played to the front of their lane (most recent
// first); everything unplayed keeps its original order behind them. ISO
// timestamps sort lexicographically, so a string compare is a time compare.
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
  const [filter, setFilter] = useState<Filter>(null)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()

  const uploadedRoms = useMemo<UploadedRom[]>(
    () =>
      filter === 'web'
        ? []
        : sortByRecentlyPlayed(
            uploads.filter(
              (rom) =>
                (!filter || rom.system === filter) && matches(q, rom.title),
            ),
            playtimeByGame,
          ),
    [uploads, filter, q, playtimeByGame],
  )

  const embeds = useMemo<EmbedEntry[]>(
    () =>
      filter !== null && filter !== 'web'
        ? []
        : sortByRecentlyPlayed(
            EMBED_CATALOG.filter((g) => matches(q, g.title, g.author)),
            playtimeByGame,
          ),
    [filter, q, playtimeByGame],
  )

  const roms = useMemo<RomEntry[]>(
    () =>
      filter === 'web'
        ? []
        : sortByRecentlyPlayed(
            ROM_CATALOG.filter(
              (rom) =>
                (!filter || rom.system === filter) &&
                matches(q, rom.title, rom.author),
            ),
            playtimeByGame,
          ),
    [filter, q, playtimeByGame],
  )

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 border border-border px-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games..."
          aria-label="Search games"
          className="w-full bg-transparent py-2 font-mono text-xs outline-none"
        />
      </div>
      <div className="mb-6 flex flex-wrap gap-4 border-b border-border">
        {TABS.map(([label, value]) => (
          <button
            key={label}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              'pb-2 font-mono text-xs tracking-widest uppercase',
              filter === value
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {embeds.map((game) => (
          <GameTile
            key={game.id}
            accent={game.accent}
            title={game.title}
            subtitle={`${game.author} · ${game.license}`}
            badge="Web"
            description={game.description}
            playedSeconds={playtimeByGame.get(gameKey(game))?.seconds}
            onPlay={() => onSelect(game)}
          />
        ))}
        {roms.map((rom) => (
          <GameTile
            key={rom.id}
            accent={rom.accent}
            title={rom.title}
            subtitle={`${rom.author} · ${rom.license}`}
            badge={SYSTEM_META[rom.system].label}
            description={rom.description}
            playedSeconds={playtimeByGame.get(gameKey(rom))?.seconds}
            onPlay={() => onSelect(rom)}
          />
        ))}
        {uploadedRoms.map((rom) => (
          <GameTile
            key={rom.id}
            accent="text-primary"
            title={rom.title}
            subtitle="Your library · on this device"
            badge={SYSTEM_META[rom.system].label}
            description="Your own ROM — stored on this device, never uploaded."
            playedSeconds={playtimeByGame.get(gameKey(rom))?.seconds}
            onPlay={() => onSelect(rom)}
            onDelete={() => onDelete(rom.id)}
          />
        ))}
        {filter !== 'web' && <UploadTile onUpload={onUpload} />}
      </div>
    </div>
  )
}
