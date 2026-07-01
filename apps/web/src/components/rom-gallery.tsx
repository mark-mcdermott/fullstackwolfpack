import { Play, Search, Upload } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Panel, Pill } from '@/components/ui-kit'
import {
  ACCEPTED_EXTENSIONS,
  type RomSystem,
  SYSTEM_META,
  validateRom,
} from '@/core/roms'
import {
  type PlayableRom,
  ROM_CATALOG,
  type RomEntry,
  uploadedRomFromFile,
} from '@/lib/rom-catalog'
import { cn } from '@/lib/utils'

const SYSTEMS_IN_CATALOG = [
  ...new Set(ROM_CATALOG.map((rom) => rom.system)),
] as RomSystem[]

const TABS: [string, RomSystem | null][] = [
  ['All', null],
  ...SYSTEMS_IN_CATALOG.map(
    (system) => [SYSTEM_META[system].label, system] as [string, RomSystem],
  ),
]

function RomTile({
  rom,
  onSelect,
}: {
  rom: RomEntry
  onSelect: (rom: PlayableRom) => void
}) {
  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className={cn('font-mono text-2xl font-bold', rom.accent)}>
          {rom.title.slice(0, 2).toUpperCase()}
        </span>
        <Pill>{SYSTEM_META[rom.system].label}</Pill>
      </div>
      <div>
        <h3 className="text-lg font-bold uppercase">{rom.title}</h3>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {rom.author} · {rom.license}
        </p>
      </div>
      <p className="line-clamp-3 font-mono text-xs text-muted-foreground">
        {rom.description}
      </p>
      <button
        type="button"
        onClick={() => onSelect(rom)}
        aria-label={`Play ${rom.title}`}
        className="mt-auto flex items-center justify-center gap-2 bg-primary px-4 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
      >
        <Play className="size-4" />
        Play
      </button>
    </Panel>
  )
}

function UploadTile({
  onSelect,
}: {
  onSelect: (rom: PlayableRom) => void
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
    onSelect(uploadedRomFromFile(file, result.system))
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

export function RomGallery({
  onSelect,
}: {
  onSelect: (rom: PlayableRom) => void
}) {
  const [system, setSystem] = useState<RomSystem | null>(null)
  const [query, setQuery] = useState('')

  const roms = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ROM_CATALOG.filter(
      (rom) =>
        (!system || rom.system === system) &&
        (!q ||
          rom.title.toLowerCase().includes(q) ||
          rom.author.toLowerCase().includes(q)),
    )
  }, [system, query])

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
            onClick={() => setSystem(value)}
            className={cn(
              'pb-2 font-mono text-xs tracking-widest uppercase',
              system === value
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roms.map((rom) => (
          <RomTile key={rom.id} rom={rom} onSelect={onSelect} />
        ))}
        <UploadTile onSelect={onSelect} />
      </div>
    </div>
  )
}
