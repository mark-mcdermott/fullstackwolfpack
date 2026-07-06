import type { RomSystem } from '@/core/roms'
import { prettyTitle, type UploadedRom } from '@/lib/rom-catalog'

// Persistent storage for user-supplied ROMs. The bytes stay on the device —
// they are never uploaded to a server (the safest footing for arbitrary ROM
// files) — so IndexedDB is the home: it holds multi-MB blobs that localStorage
// can't. Keyed by the same deterministic id the in-memory upload path uses, so
// re-adding a file just overwrites its entry.
const DB_NAME = 'fw-arcade'
const STORE = 'roms'
const VERSION = 1

type StoredRom = {
  id: string
  title: string
  system: RomSystem
  fileName: string
  size: number
  addedAt: number
  file: File
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(
  mode: IDBTransactionMode,
  request: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = request(tx.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close()
      }),
  )
}

function toUploaded(row: StoredRom): UploadedRom {
  return {
    source: 'upload',
    id: row.id,
    title: row.title,
    system: row.system,
    file: row.file,
  }
}

export async function listUploadedRoms(): Promise<UploadedRom[]> {
  if (typeof indexedDB === 'undefined') return []
  try {
    const rows = await run<StoredRom[]>('readonly', (s) =>
      s.getAll() as IDBRequest<StoredRom[]>,
    )
    return rows.sort((a, b) => b.addedAt - a.addedAt).map(toUploaded)
  } catch {
    return []
  }
}

export async function saveUploadedRom(
  file: File,
  system: RomSystem,
): Promise<UploadedRom> {
  const record: StoredRom = {
    id: `upload:${file.name}:${file.size}`,
    title: prettyTitle(file.name),
    system,
    fileName: file.name,
    size: file.size,
    addedAt: Date.now(),
    file,
  }
  await run('readwrite', (s) => s.put(record))
  return toUploaded(record)
}

export async function deleteUploadedRom(id: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  try {
    await run('readwrite', (s) => s.delete(id))
  } catch {
    // best effort — a failed delete just leaves the tile in place.
  }
}
