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
  - `me/[action].ts` — **one** dynamic function serving every `/api/me/*` route (Vercel Hobby caps at 12 Serverless Functions; each file is one). Dispatches on the last path segment + method; new routes fold in here, never as new files. GET: `summary`, `dashboard`, `topics`, `stats`, `progress`, `achievements`, `lesson` (`?id`), `course` (`?topic` → outline + next lesson), `openai-key`. POST: `openai-key` (write-only key, encrypted at rest), `enroll` (→ generate an AI course), `answer` (grade a quiz question), `complete` (finish a lesson → score/XP/streak).
  - `_lib/` — `http.ts` (json helpers), `session.ts` (JWT cookie via jose), `user.ts` (public-user mapping), `validate.ts` (`parseBody` → 400 on bad input). Files prefixed `_` are not routed.
- `src/db/` — Drizzle client (`index.ts`, server-only) and schema (`schema/auth.ts`: users, credentials, webauthn challenges).
- `src/core/app-data.ts` — zod DTOs for the logged-in app; `src/core/progress.ts` — pure level/achievement/relative-time helpers (unit-tested).
- `src/server/app-data.ts` — server-only Drizzle reads behind the `/api/me/*` endpoints (composes the core mappers; explicit joins, no `with:`).
- `src/server/{enroll,course-store,openai-generator,crypto,provider-credentials}.ts` — the AI generation seam: `enrollAndGenerate` decrypts the user's OpenAI key (`provider-credentials` + AES-256-GCM `crypto`) and runs the `src/core/generation.ts` pipeline into Drizzle.
- `src/server/learning.ts` — server reads/writes for the lesson player: `getLessonView` (answer keys stripped), `getCourseOutline` (topic → lessons + next unfinished), `submitAnswer`, `completeLesson` (score → progress → XP → streak). Composes pure math in `src/core/learning.ts`.
- `src/api-client/` — surface-agnostic client; `api.data.*` fetches the `/api/me/*` reads (incl. `lesson`/`course`) and drives the player (`answer`, `completeLesson`), `api.integrations.*` manages the OpenAI key, `api.courses.enroll` triggers generation (all validated against core schemas). `src/hooks/use-async.ts` drives page loading/error state; `src/components/layout/async-view.tsx` renders it.
- `src/pages/` — public (`public/`), logged-in app (`app/`), and admin (`admin/`) pages; the `app/` pages read live data via `api.data.*`. The lesson player is `app/learn.tsx` (route `/app/learn/:lessonId`); Topics/Dashboard/Sessions launch into it (`src/lib/open-course.ts` resolves a topic → its next lesson). Sessions is a real "continue learning" hub.
- `src/lib/auth.ts` — WebAuthn relying-party config + TOTP helpers (server-side).
- `src/hooks/auth-context.ts` + `auth-provider.tsx` — `AuthProvider` + `useAuth` (`user`/`register`/`login`/`recover`/`logout`/`refresh`).
- `src/components/` — `auth-card.tsx` (sign-in / register / recover), `require-auth.tsx` (route guard), `dashboard.tsx` (protected view), `totp-card.tsx` (authenticator enrollment).
- `src/components/ui/` — shadcn components (`base-nova` style, base-ui primitives).
- `dev-api.ts` — Vite dev plugin that serves `api/` under `npm run dev` (Node↔Web adapter), so passkeys work locally without `vercel dev`.
- `drizzle.config.ts` — drizzle-kit config (reads `DATABASE_URL`).
- `capacitor.config.ts` — Capacitor app config (`com.fullstackwolfpack.app`, webDir `dist`).
- `src-tauri/` — Tauri desktop shell (Rust).

## Auth flow

Passkeys (WebAuthn) are primary; TOTP is the no-password fallback. Each ceremony is a two-step handshake: `options` mints a challenge (stored in `webauthn_challenges`, keyed by email), `verify` checks the signed response and issues a session JWT in an httpOnly cookie. `RP_ID` is the bare domain (`localhost` in dev), `RP_ORIGIN` the full origin. Login is email-first (usernameless/discoverable is a possible enhancement). `requireUserVerification` is env-driven — off in dev, on in production (override with `RP_REQUIRE_UV`). Auth **fails closed** in production (https `RP_ORIGIN`) if `RP_ID`/`AUTH_SECRET`/`ENCRYPTION_KEY` are still on dev defaults.

Routes are gated client-side by `RequireAuth` (UX) and server-side by the session cookie (`getSessionUserId`) on each protected endpoint (the real boundary). TOTP: an authed user enrolls via `totp/setup` (QR) → `totp/enable` (confirm a code); if they later lose their passkey, `totp/recover` (email + code) mints a session. The TOTP secret is **encrypted at rest** (AES-256-GCM via `crypto.ts` `seal`/`open`). `login`/`recover` are **rate-limited** — a DB-backed fixed-window counter (`auth_rate_limits`, `src/server/rate-limit.ts`); over the limit returns `429` + `Retry-After` (login 10/15m, recover 5/15m).

## Scripts

- `npm run dev` / `build` / `preview` — Vite (`dev` also serves `api/` via the dev plugin).
- `npm run db:push` / `db:generate` / `db:migrate` / `db:studio` — Drizzle.
- `npm run tauri <cmd>` — Tauri CLI (e.g. `tauri dev`, `tauri build`).
- `npm run cap <cmd>` — Capacitor CLI.

## Setup TODO

Pieces that need accounts or interactive/native steps — not done by the scaffold:

- [ ] **Neon DB** — create a Neon project, `cp .env.example .env`, set `DATABASE_URL` (and the same in the Vercel project env). Then `npm run db:push` to create the tables. Auth needs a real DB to run end-to-end.
- [ ] **AUTH_SECRET** — set a strong `AUTH_SECRET` in `.env` (`openssl rand -base64 32`); dev falls back to an insecure default, production must not.
- [x] **Auth flows + hardening** — passkey register/login, session cookies, a protected route (`RequireAuth` + `/api/protected`), TOTP enrollment/recovery, **encrypted TOTP secret at rest**, **env-driven `requireUserVerification`**, **rate-limited `login`/`recover`**, and a **fail-closed prod config guard** are all built. Remaining: set `RP_ID`/`RP_ORIGIN` (+ `AUTH_SECRET`/`ENCRYPTION_KEY`) in each deploy env — production refuses to start on dev defaults.
- [ ] **Capacitor native platforms** — `npm run build` first, then `npx cap add ios` / `npx cap add android`, then `npx cap sync`. iOS needs Xcode; Android needs Android Studio + SDK.
- [ ] **Tauri desktop** — `npm run tauri dev` (first run compiles Rust deps). Replace placeholder icons via `npm run tauri icon <path-to-1024px.png>`.
- [ ] **Vercel** — link the project; `@vercel/analytics` only reports once deployed on Vercel.
- [ ] **Dev advisory** — `npm audit` shows a moderate esbuild dev-server advisory pulled in transitively by `drizzle-kit` (dev-only). `audit fix --force` would downgrade drizzle-kit ~13 minor versions; left as-is intentionally.
