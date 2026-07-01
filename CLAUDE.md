# Fullstack Wolfpack

**Stack:** ZENCATS — **Z**od · **E**dge (Neon) · **N**ode · **C**apacitor · **A**uth (passkeys/TOTP) · **T**auri · **S**hadcn

Config: Commit `conventional` · Automerge `off`

Full cross-platform stack: Vite + React 19 + TS, Tailwind v4 + shadcn-ui, Drizzle ORM on Neon (edge Postgres), passkey/WebAuthn auth with TOTP fallback (no passwords), Zod validation, and Capacitor (mobile) + Tauri (desktop) shells.

## Layout

- `api/` — serverless functions (Vercel-style; Web `Request`/`Response` handlers).
  - `auth/register/{options,verify}.ts`, `auth/login/{options,verify}.ts` — the two WebAuthn ceremonies.
  - `auth/totp/{setup,enable,disable,recover}.ts` — TOTP enrollment (authed) + recovery (unauthed).
  - `auth/me.ts` (current session), `auth/logout.ts`.
  - `protected.ts` — example session-gated endpoint (the real server-side boundary).
  - `me/{summary,dashboard,topics,stats,progress,achievements}.ts` — session-gated read endpoints for the logged-in app (feed the dashboard/topics/progress/stats/achievements/badges pages).
  - `_lib/` — `http.ts` (json helpers), `session.ts` (JWT cookie via jose), `user.ts` (public-user mapping). Files prefixed `_` are not routed.
- `src/db/` — Drizzle client (`index.ts`, server-only) and schema (`schema/auth.ts`: users, credentials, webauthn challenges).
- `src/core/app-data.ts` — zod DTOs for the logged-in app; `src/core/progress.ts` — pure level/achievement/relative-time helpers (unit-tested).
- `src/server/app-data.ts` — server-only Drizzle reads behind the `/api/me/*` endpoints (composes the core mappers; explicit joins, no `with:`).
- `src/api-client/` — surface-agnostic client; `api.data.*` fetches the `/api/me/*` reads (validated against core schemas). `src/hooks/use-async.ts` drives page loading/error state; `src/components/layout/async-view.tsx` renders it.
- `src/pages/` — public (`public/`), logged-in app (`app/`), and admin (`admin/`) pages; the `app/` pages read live data via `api.data.*` (Sessions is a static preview until the live-session runtime lands).
- `src/lib/auth.ts` — WebAuthn relying-party config + TOTP helpers (server-side).
- `src/hooks/auth-context.ts` + `auth-provider.tsx` — `AuthProvider` + `useAuth` (`user`/`register`/`login`/`recover`/`logout`/`refresh`).
- `src/components/` — `auth-card.tsx` (sign-in / register / recover), `require-auth.tsx` (route guard), `dashboard.tsx` (protected view), `totp-card.tsx` (authenticator enrollment).
- `src/components/ui/` — shadcn components (`base-nova` style, base-ui primitives).
- `dev-api.ts` — Vite dev plugin that serves `api/` under `npm run dev` (Node↔Web adapter), so passkeys work locally without `vercel dev`.
- `drizzle.config.ts` — drizzle-kit config (reads `DATABASE_URL`).
- `capacitor.config.ts` — Capacitor app config (`com.fullstackwolfpack.app`, webDir `dist`).
- `src-tauri/` — Tauri desktop shell (Rust).

## Auth flow

Passkeys (WebAuthn) are primary; TOTP is the no-password fallback. Each ceremony is a two-step handshake: `options` mints a challenge (stored in `webauthn_challenges`, keyed by email), `verify` checks the signed response and issues a session JWT in an httpOnly cookie. `RP_ID` is the bare domain (`localhost` in dev), `RP_ORIGIN` the full origin. Login is email-first (usernameless/discoverable is a possible enhancement). `requireUserVerification` is `false` for dev — tighten for production.

Routes are gated client-side by `RequireAuth` (UX) and server-side by the session cookie (`getSessionUserId`) on each protected endpoint (the real boundary). TOTP: an authed user enrolls via `totp/setup` (QR) → `totp/enable` (confirm a code); if they later lose their passkey, `totp/recover` (email + code) mints a session. The TOTP secret is stored plaintext for now — encrypt at rest in production, and rate-limit `login`/`recover`.

## Scripts

- `npm run dev` / `build` / `preview` — Vite (`dev` also serves `api/` via the dev plugin).
- `npm run db:push` / `db:generate` / `db:migrate` / `db:studio` — Drizzle.
- `npm run tauri <cmd>` — Tauri CLI (e.g. `tauri dev`, `tauri build`).
- `npm run cap <cmd>` — Capacitor CLI.

## Setup TODO

Pieces that need accounts or interactive/native steps — not done by the scaffold:

- [ ] **Neon DB** — create a Neon project, `cp .env.example .env`, set `DATABASE_URL` (and the same in the Vercel project env). Then `npm run db:push` to create the tables. Auth needs a real DB to run end-to-end.
- [ ] **AUTH_SECRET** — set a strong `AUTH_SECRET` in `.env` (`openssl rand -base64 32`); dev falls back to an insecure default, production must not.
- [x] **Auth flows** — passkey register/login, session cookies, a protected route (`RequireAuth` + `/api/protected`), and TOTP enrollment/recovery UI are built and run locally via `npm run dev`. Remaining for production: set `RP_ID`/`RP_ORIGIN` per environment, set `requireUserVerification: true`, encrypt the TOTP secret at rest, and rate-limit `login`/`recover`.
- [ ] **Capacitor native platforms** — `npm run build` first, then `npx cap add ios` / `npx cap add android`, then `npx cap sync`. iOS needs Xcode; Android needs Android Studio + SDK.
- [ ] **Tauri desktop** — `npm run tauri dev` (first run compiles Rust deps). Replace placeholder icons via `npm run tauri icon <path-to-1024px.png>`.
- [ ] **Vercel** — link the project; `@vercel/analytics` only reports once deployed on Vercel.
- [ ] **Dev advisory** — `npm audit` shows a moderate esbuild dev-server advisory pulled in transitively by `drizzle-kit` (dev-only). `audit fix --force` would downgrade drizzle-kit ~13 minor versions; left as-is intentionally.
