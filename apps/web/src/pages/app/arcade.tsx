import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EmbedPlayer } from '@/components/embed-player'
import { RomGallery, type PlayableGame } from '@/components/rom-gallery'
import { EMBED_CATALOG } from '@/lib/embed-catalog'
import { ROM_CATALOG } from '@/lib/rom-catalog'
import { RomPlayer } from '@/components/rom-player'
import { usePlaytime } from '@/hooks/use-playtime'
import { useRomLibrary } from '@/hooks/use-rom-library'
import type { RomSystem } from '@/core/roms'
import { PageHeading } from '@fw/ui'

export function ArcadePage() {
  const [selected, setSelected] = useState<PlayableGame | null>(null)
  const { uploads, add, remove } = useRomLibrary()
  const { byGame } = usePlaytime()

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

  async function handleUpload(file: File, system: RomSystem) {
    setSelected(await add(file, system))
  }

  if (selected) {
    return selected.source === 'embed' ? (
      <EmbedPlayer game={selected} onExit={() => setSelected(null)} />
    ) : (
      <RomPlayer rom={selected} onExit={() => setSelected(null)} />
    )
  }

  return (
    <div>
      <PageHeading
        label="Arcade"
        title="Arcade"
        subtitle="Pick a game and play it right here — at your interval the app pauses it for a lesson."
      />
      <RomGallery
        onSelect={setSelected}
        uploads={uploads}
        onUpload={(file, system) => void handleUpload(file, system)}
        onDelete={(id) => void remove(id)}
        playtimeByGame={byGame}
      />
      <div className="mt-6">
        <Link
          to="/app/credits"
          className="font-mono text-[10px] tracking-widest text-primary uppercase hover:underline"
        >
          Licenses & credits →
        </Link>
      </div>
    </div>
  )
}
