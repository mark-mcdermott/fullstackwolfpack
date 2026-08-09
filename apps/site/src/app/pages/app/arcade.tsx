import { BookOpen, Gamepad2, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ControlsReference } from '@/components/controls/controls-reference'
import { EmbedPlayer } from '@/components/embed-player'
import { FeaturedGame } from '@/components/arcade/featured-game'
// TEMP: RomGallery returns with the lanes below the featured title.
// import { RomGallery } from '@/components/rom-gallery'
import type { PlayableGame } from '@/components/rom-gallery'
import { EMBED_CATALOG } from '@/lib/embed-catalog'
import { ROM_CATALOG, type RomEntry } from '@/lib/rom-catalog'
import { RomPlayer } from '@/components/rom-player'
import { gameKey } from '@/core/playtime'
import { SYSTEM_META } from '@/core/roms'
import { usePlaytime } from '@/hooks/use-playtime'
import { useAuth } from '@/hooks/auth-context'
import { useRomLibrary } from '@/hooks/use-rom-library'
// TEMP (single-title focus): RomSystem returns with the upload handler.
// import type { RomSystem } from '@/core/roms'
import { Panel, SectionLabel, cardLiftClass } from '@fw/ui'
import { cn } from '@/lib/utils'

// TEMP (single-title focus): the arcade leads with one title while we make it
// perfect. Drop this and the gallery below returns to being the whole page.
const FEATURED_GAME_ID = 'tobu-tobu-girl'

export function ArcadePage() {
  const [selected, setSelected] = useState<PlayableGame | null>(null)
  // Uploads still resolve deep links; the gallery's library lane is parked.
  const { uploads } = useRomLibrary()
  const { byGame } = usePlaytime()
  const featured = ROM_CATALOG.find((r) => r.id === FEATURED_GAME_ID)

  // Deep-link from the session launcher: /app/arcade?game=<embed id> auto-launches.
  const [params, setParams] = useSearchParams()
  // Deep-link from the session launcher: /app/arcade?game=<id> auto-launches.
  // Uploaded ROMs live in IndexedDB (async), so re-run once `uploads` loads;
  // the param is only consumed when the game is actually found.
  useEffect(() => {
    const id = params.get('game')
    if (!id) return
    const game =
      EMBED_CATALOG.find((g) => g.id === id) ??
      ROM_CATALOG.find((g) => g.id === id) ??
      uploads.find((u) => u.id === id)
    if (game) {
      setSelected(game)
      setParams({}, { replace: true }) // so Exit returns to the gallery
    }
  }, [params, uploads, setParams])

  // TEMP: returns with the gallery's "Your library" lane.
  // async function handleUpload(file: File, system: RomSystem) {
  //   setSelected(await add(file, system))
  // }

  if (selected) {
    return selected.source === 'embed' ? (
      <EmbedPlayer game={selected} onExit={() => setSelected(null)} />
    ) : (
      <RomPlayer rom={selected} onExit={() => setSelected(null)} />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {featured && (
        <>
          <FeaturedGame
            game={featured}
            playtime={byGame.get(gameKey(featured))}
            onPlay={() => setSelected(featured)}
          />
          <LoopSteps />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Controls />
            <AboutRom game={featured} />
          </div>
        </>
      )}

      {/* TEMP: the full gallery — every lane — returns below the featured title.
      <RomGallery
        onSelect={setSelected}
        playtimeByGame={byGame}
        uploads={uploads}
        onUpload={(file, system) => void handleUpload(file, system)}
        onDelete={(id) => void remove(id)}
      />
      */}
    </div>
  )
}

const STEPS = [
  {
    icon: Gamepad2,
    title: 'Play',
    body: 'Start the game right here in the browser — no install, no account.',
  },
  {
    icon: Timer,
    title: 'Pause',
    body: 'Your play interval runs out (25 min by default) and the game pauses itself.',
  },
  {
    icon: BookOpen,
    title: 'Learn',
    body: 'One short lesson over the paused game, then straight back in.',
  },
]

// The arcade's whole premise, spelled out — it used to be a single line of
// subtitle copy.
function LoopSteps() {
  return (
    <Panel brackets={false} className={cn('rounded-2xl', cardLiftClass)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <SectionLabel>How the loop works</SectionLabel>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Set your own intervals when you start a mission
        </span>
      </div>
      <ol className="mt-4 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-lg border border-border bg-muted/20 p-4"
          >
            <step.icon className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-heading text-sm font-bold uppercase">
                <span className="mr-2 font-mono text-[10px] text-muted-foreground">
                  0{i + 1}
                </span>
                {step.title}
              </p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

// The live key map — the same reference the player shows, reflecting whatever
// the user has remapped.
function Controls() {
  const signedIn = !!useAuth().user
  return (
    <Panel
      brackets={false}
      className={cn('flex flex-col gap-4 rounded-2xl', cardLiftClass)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <SectionLabel>Controls</SectionLabel>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Keyboard · gamepad · touch
        </span>
      </div>
      {/* The pad diagram has a fixed minimum width — let it scroll on a phone
          rather than stretching the page. */}
      <div className="flex min-w-0 justify-start overflow-x-auto sm:justify-center">
        <ControlsReference compact />
      </div>
      <p className="font-mono text-[11px] text-muted-foreground">
        {signedIn ? (
          <>
            Remap any button in{' '}
            <Link to="/app/settings" className="text-primary hover:underline">
              Settings → Arcade controls
            </Link>
            .
          </>
        ) : (
          <>On a phone, on-screen touch controls appear over the game.</>
        )}
      </p>
    </Panel>
  )
}

// Why this title is here: a homebrew ROM whose license clears redistribution.
function AboutRom({ game }: { game: RomEntry }) {
  const rows: [string, string][] = [
    ['System', SYSTEM_META[game.system].label],
    ['Emulator core', SYSTEM_META[game.system].core],
    ['Author', game.author],
    ['License', game.license],
  ]
  return (
    <Panel
      brackets={false}
      className={cn('flex flex-col gap-4 rounded-2xl', cardLiftClass)}
    >
      <SectionLabel>About this ROM</SectionLabel>
      <dl className="flex flex-col gap-2 font-mono text-[11px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="tracking-widest text-muted-foreground uppercase">
              {label}
            </dt>
            <dd className="min-w-0 truncate text-right">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
        Bundled titles are homebrew with licenses that allow redistribution —
        nothing here is a commercial ROM.
      </p>
      <Link
        to="/app/credits"
        className="mt-auto font-mono text-[10px] tracking-widest text-primary uppercase hover:underline"
      >
        Licenses &amp; credits →
      </Link>
    </Panel>
  )
}
