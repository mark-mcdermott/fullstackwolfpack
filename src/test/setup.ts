import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom + Node's experimental Web Storage collide (the global `localStorage`
// exists but its methods aren't callable). Install a real in-memory Storage so
// storage-backed code is testable.
class MemoryStorage implements Storage {
  #store = new Map<string, string>()
  get length() {
    return this.#store.size
  }
  clear() {
    this.#store.clear()
  }
  getItem(key: string) {
    return this.#store.has(key) ? this.#store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.#store.set(key, String(value))
  }
  removeItem(key: string) {
    this.#store.delete(key)
  }
  key(index: number) {
    return [...this.#store.keys()][index] ?? null
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
})

afterEach(() => {
  cleanup()
})
