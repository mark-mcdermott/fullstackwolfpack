import { createApi } from './api'
import { webAdapters } from './web-adapters'

// Composition root for the web surface: the one place adapters are wired.
// A Capacitor/Tauri/extension build swaps webAdapters() for its own.
//
// VITE_API_BASE lets a packaged desktop/mobile shell (which serves the static
// build with no backend of its own) point every `/api/*` call at the deployed
// origin. Empty by default → same-origin relative calls for the web app.
const apiBase = import.meta.env.VITE_API_BASE ?? ''
export const api = createApi(webAdapters(apiBase))

export type { Api } from './api'
export { HttpError } from './web-adapters'
