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

// jsdom does not implement matchMedia at all. ThemeToggle asks it whether the
// OS prefers dark, so anything rendering the header or sidebar needs it to
// exist. Reports light and never fires, which is the quiet default a test wants.
// On `globalThis` and not `window`, like the storage stub above: this file also
// loads for the suites that opt into the node environment, where there is no
// `window` to define anything on.
Object.defineProperty(globalThis, 'matchMedia', {
  configurable: true,
  value: (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList,
})

afterEach(() => {
  cleanup()
})
