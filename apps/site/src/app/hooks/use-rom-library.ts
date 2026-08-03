import { useCallback, useEffect, useState } from 'react'
import type { RomSystem } from '@/core/roms'
import type { UploadedRom } from '@/lib/rom-catalog'
import {
  deleteUploadedRom,
  listUploadedRoms,
  saveUploadedRom,
} from '@/lib/rom-library'

// The user's own ROMs, read from and written to IndexedDB so they survive
// Exit and reload. `add` returns the stored ROM so the caller can play it
// straight away.
export function useRomLibrary() {
  const [uploads, setUploads] = useState<UploadedRom[]>([])

  const reload = useCallback(() => {
    void listUploadedRoms().then(setUploads)
  }, [])

  useEffect(() => reload(), [reload])

  const add = useCallback(
    async (file: File, system: RomSystem): Promise<UploadedRom> => {
      const rom = await saveUploadedRom(file, system)
      setUploads(await listUploadedRoms())
      return rom
    },
    [],
  )

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteUploadedRom(id)
    setUploads(await listUploadedRoms())
  }, [])

  return { uploads, add, remove }
}
