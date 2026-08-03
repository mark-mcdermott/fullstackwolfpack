// Custom game covers, stored per-game in IndexedDB (device-local, never
// uploaded — same model as the user's ROM library). Keyed by game id; the value
// is the cropped JPEG blob. The gallery reads these to override a game's default
// (catalog cover or generated poster).

const DB_NAME = 'fw-covers'
const STORE = 'covers'
const VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close()
      }),
  )
}

export async function saveCover(gameId: string, blob: Blob): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  await run('readwrite', (s) => s.put(blob, gameId))
}

export async function deleteCover(gameId: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  await run('readwrite', (s) => s.delete(gameId))
}

export async function getAllCovers(): Promise<Map<string, Blob>> {
  if (typeof indexedDB === 'undefined') return new Map()
  const [keys, values] = await Promise.all([
    run<IDBValidKey[]>('readonly', (s) => s.getAllKeys()),
    run<Blob[]>('readonly', (s) => s.getAll()),
  ])
  const map = new Map<string, Blob>()
  keys.forEach((k, i) => {
    if (typeof k === 'string' && values[i]) map.set(k, values[i])
  })
  return map
}
