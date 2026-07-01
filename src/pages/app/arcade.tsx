import { useState } from 'react'
import { RomGallery } from '@/components/rom-gallery'
import { RomPlayer } from '@/components/rom-player'
import { PageHeading } from '@/components/ui-kit'
import type { PlayableRom } from '@/lib/rom-catalog'

export function ArcadePage() {
  const [selected, setSelected] = useState<PlayableRom | null>(null)

  if (selected) {
    return <RomPlayer rom={selected} onExit={() => setSelected(null)} />
  }

  return (
    <div>
      <PageHeading
        label="Arcade"
        title="Arcade"
        subtitle="Pick a game and play it right here — at your interval the app pauses it for a lesson."
      />
      <RomGallery onSelect={setSelected} />
    </div>
  )
}
