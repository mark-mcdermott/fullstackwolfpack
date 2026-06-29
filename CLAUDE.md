# Fullstack Wolfpack

**Stack:** ZENCATS — **Z**od · **E**dge (Neon) · **N**ode · **C**apacitor · **A**uth (passkeys/TOTP) · **T**auri · **S**hadcn

Config: Commit `conventional` · Automerge `off`

Full cross-platform stack: Vite + React 19 + TS, Tailwind v4 + shadcn-ui, Drizzle ORM on Neon (edge Postgres), passkey/WebAuthn auth with TOTP fallback (no passwords), Zod validation, and Capacitor (mobile) + Tauri (desktop) shells.

## Layout

- `src/db/` — Drizzle client (`index.ts`, server-only) and schema (`schema/auth.ts`: users, credentials, webauthn challenges).
- `src/lib/auth.ts` — WebAuthn relying-party config + TOTP helpers (server-side).
- `src/components/ui/` — shadcn components (`base-nova` style, base-ui primitives).
- `drizzle.config.ts` — drizzle-kit config (reads `DATABASE_URL`).
- `capacitor.config.ts` — Capacitor app config (`com.fullstackwolfpack.app`, webDir `dist`).
- `src-tauri/` — Tauri desktop shell (Rust).

## Scripts

- `npm run dev` / `build` / `preview` — Vite.
- `npm run db:push` / `db:generate` / `db:migrate` / `db:studio` — Drizzle.
- `npm run tauri <cmd>` — Tauri CLI (e.g. `tauri dev`, `tauri build`).
- `npm run cap <cmd>` — Capacitor CLI.

## Setup TODO

Pieces that need accounts or interactive/native steps — not done by the scaffold:

- [ ] **Neon DB** — create a Neon project, copy the connection string into `.env` as `DATABASE_URL` (and into the Vercel project env). Then `npm run db:push` to create the tables.
- [ ] **Auth flows** — schema, RP config, and TOTP helpers are scaffolded; the actual WebAuthn HTTP endpoints are not. Add serverless functions (e.g. Vercel `/api`) for `generateRegistrationOptions` / `verifyRegistrationResponse` and `generateAuthenticationOptions` / `verifyAuthenticationResponse` (`@simplewebauthn/server`), persist challenges via the `webauthn_challenges` table, and wire the client with `@simplewebauthn/browser`. Set `RP_ID` / `RP_ORIGIN` per environment.
- [ ] **Capacitor native platforms** — `npm run build` first, then `npx cap add ios` / `npx cap add android`, then `npx cap sync`. iOS needs Xcode; Android needs Android Studio + SDK.
- [ ] **Tauri desktop** — `npm run tauri dev` (first run compiles Rust deps). Replace placeholder icons via `npm run tauri icon <path-to-1024px.png>`.
- [ ] **Vercel** — link the project; `@vercel/analytics` only reports once deployed on Vercel.
- [ ] **Dev advisory** — `npm audit` shows a moderate esbuild dev-server advisory pulled in transitively by `drizzle-kit` (dev-only). `audit fix --force` would downgrade drizzle-kit ~13 minor versions; left as-is intentionally.
