import { useState } from 'react'
import { Link } from 'react-router'
import { EmbedPlayer } from '@/components/embed-player'
import { RomGallery, type PlayableGame } from '@/components/rom-gallery'
import { RomPlayer } from '@/components/rom-player'
import { usePlaytime } from '@/hooks/use-playtime'
import { useRomLibrary } from '@/hooks/use-rom-library'
import type { RomSystem } from '@/core/roms'
import { PageHeading } from '@fw/ui'

export function ArcadePage() {
  const [selected, setSelected] = useState<PlayableGame | null>(null)
  const { uploads, add, remove } = useRomLibrary()
  const { byGame } = usePlaytime()

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
