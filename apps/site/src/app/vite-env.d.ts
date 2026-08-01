/// <reference types="vite/client" />

// Typed env contract (merges with vite/client's ImportMetaEnv so these keys are
// `string | undefined` instead of `any`).
interface ImportMetaEnv {
  /**
   * API origin for packaged shells (Tauri/Capacitor), which bundle the static
   * build but have no local backend. Empty (the web default) = same-origin
   * relative `/api/*`. Set to the deployed origin (e.g. `https://app.example.com`)
   * so the shell reaches the serverless API and keeps the WebAuthn RP origin.
   */
  readonly VITE_API_BASE?: string
  /** Opt-in dev-mode role switcher in non-dev builds. */
  readonly VITE_ENABLE_DEV_MODE?: string
  /**
   * Dedicated origin to serve the embed-lane games (`public/games/`) from, for
   * full cross-frame isolation. Empty (default) = same-origin (the iframe keeps
   * `allow-same-origin`). Set to a separate sandbox origin serving the same
   * static files (e.g. `https://games.example.com`) to drop `allow-same-origin`.
   */
  readonly VITE_GAMES_ORIGIN?: string
  /**
   * Marketing (Astro) site origin. The app links out here for marketing pages
   * and the signed-out `/` redirect. Empty ⇒ the prod site
   * (`https://fullstackwolfpack.com`) in prod builds, or stays on localhost
   * (`/login`) in dev. Set to a local Astro origin (e.g. `http://localhost:4321`)
   * to send `/` there instead.
   */
  readonly VITE_SITE_URL?: string
}
