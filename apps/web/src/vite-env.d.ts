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
}
