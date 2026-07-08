import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteCover, getAllCovers, saveCover } from '@/lib/cover-store'

// Custom per-game covers from IndexedDB, exposed as object URLs for <img src>.
// Object URLs are revoked when replaced or on unmount so nothing leaks.
export function useCovers(): {
  covers: Map<string, string>
  setCover: (gameId: string, blob: Blob) => Promise<void>
  removeCover: (gameId: string) => Promise<void>
} {
  const [covers, setCovers] = useState<Map<string, string>>(() => new Map())
  const urls = useRef<Map<string, string>>(new Map())

  const publish = useCallback((blobs: Map<string, Blob>) => {
    const next = new Map<string, string>()
    const previous = urls.current
    for (const [id, blob] of blobs) next.set(id, URL.createObjectURL(blob))
    // Revoke URLs we're replacing/dropping.
    for (const [, url] of previous) URL.revokeObjectURL(url)
    urls.current = next
    setCovers(new Map(next))
  }, [])

  useEffect(() => {
    void getAllCovers().then(publish)
    const current = urls
    return () => {
      for (const [, url] of current.current) URL.revokeObjectURL(url)
    }
  }, [publish])

  const setCover = useCallback(
    async (gameId: string, blob: Blob) => {
      await saveCover(gameId, blob)
      publish(await getAllCovers())
    },
    [publish],
  )

  const removeCover = useCallback(
    async (gameId: string) => {
      await deleteCover(gameId)
      publish(await getAllCovers())
    },
    [publish],
  )

  return { covers, setCover, removeCover }
}
