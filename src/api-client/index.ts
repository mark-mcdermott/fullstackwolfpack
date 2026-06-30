import { createApi } from './api'
import { webAdapters } from './web-adapters'

// Composition root for the web surface: the one place adapters are wired.
// A Capacitor/Tauri/extension build swaps webAdapters() for its own.
export const api = createApi(webAdapters())

export type { Api } from './api'
export { HttpError } from './web-adapters'
