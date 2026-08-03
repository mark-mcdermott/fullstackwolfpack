# Fullstack Wolfpack

**Stack:** ZENCATS — **Z**od · **E**dge (Neon) · **N**ode · **C**apacitor · **A**uth (passkeys/TOTP) · **T**auri · **S**hadcn

Config: Commit `conventional` · Automerge `off`

Full cross-platform stack: Vite + React 19 + TS, Tailwind v4 + shadcn-ui, Drizzle ORM on Neon (edge Postgres), passkey/WebAuthn auth with TOTP fallback (no passwords), Zod validation, and Capacitor (mobile) + Tauri (desktop) shells.

## Monorepo (npm workspaces)

**One Astro deployment now** (post `docs/astro-merge-plan.md` migration — the old two-app subdomain split is gone). `apps/site` is *the* app: static marketing/content/auth pages, the React app mounted as a `client:only` **applet**, and `/api/*` as Astro endpoints — all one origin, one Vercel project.

- `apps/site/` — package `@fw/site`, the whole product. **Astro 5 + `@astrojs/react` + `@astrojs/vercel`.** Structure:
  - `src/app/` — the **React SPA**, moved wholesale from the old `apps/web/src`. Its `@/…` imports resolve here via the `@`→`src/app` alias (astro.config + vitest.config + `src/app/tsconfig.json`). Mounted by `src/app/AppRoot.tsx` (the old `main.tsx` provider stack) as a `client:only="react"` island in `src/pages/[...slug].astro` (on-demand catch-all; static `.astro` pages win over it). Colocated unit tests run from here (`npm test -w @fw/site` → 483 tests).
  - `src/pages/api/**` — the API, ported from the old Vercel functions to Astro `APIRoute`s (`export const GET: APIRoute = async ({ request: req }) => …`, `prerender=false`). `_lib/` helpers stay relative + Astro-unrouted (underscore prefix). The `@astrojs/vercel` adapter bundles **every** route (API + applet) into **one** function (`_render.func`) — collapsing the old 12/12 Vercel Hobby function cap to ~1.
  - `src/pages/*.astro`, `src/layouts/Base.astro`, `src/components/*.astro` — the static marketing/content/blog surface + shared chrome (FW-01 look). `.env` + `.env.example` live here; astro.config loads `.env` into `process.env` for the endpoints under `astro dev`.
- `apps/web/` — **decommissioned** by the migration (its `src/` and `api/` moved into `apps/site`). Only the native shells remain live here (`ios/`, `android/`, `src-tauri/`, `capacitor.config.ts`) pending re-point at the Astro build output + final deletion during the deploy/native step. Its web-SPA configs (`vite.config.ts`, `dev-api.ts`, `index.html`, `vercel.json`) are dead.
- `packages/ui/` — `@fw/ui`, the FW-01 design system (ui-kit / charts / wolf-sun / theme-toggle + `theme.css` tokens), registry-ready (`registry.json`). Consumed via the `@fw/ui` alias.
- Root scripts delegate to `@fw/site` (`npm run dev|build|test`); `db:*`/`tauri`/`cap` root scripts still point at `@fw/web` and need re-pointing during cleanup.
- **The "## Layout" paths below now live under `apps/site/src/app/`** (e.g. Layout's `src/core` = `apps/site/src/app/core`), and the `api/` it describes is `apps/site/src/pages/api/` (handlers now Astro `APIRoute`s, otherwise the same logic). `packages/core` extraction was superseded by folding into the single app; the `@/` alias makes it unnecessary.
- **Deploy (target end state):** single Vercel project, Root Directory `apps/site`, the one canonical origin `fullstackwolfpack.com` (`RP_ID`/`RP_ORIGIN` = apex). Not yet configured on Vercel — see the migration hand-off.

## Layout

- `api/` — serverless functions (Vercel-style; Web `Request`/`Response` handlers).
  - `auth/register/{options,verify}.ts`, `auth/login/{options,verify}.ts` — the two WebAuthn ceremonies.
  - `auth/totp/{setup,enable,disable,recover}.ts` — TOTP enrollment (authed) + recovery (unauthed).
  - `auth/me.ts` (current session), `auth/logout.ts`.
  - `protected.ts` — example session-gated endpoint (the real server-side boundary).
  - `me/[action].ts` — **one** dynamic function serving every `/api/me/*` route (Vercel Hobby caps at 12 Serverless Functions; each file is one). Dispatches on the last path segment + method; new routes fold in here, never as new files. GET: `summary`, `dashboard`, `topics`, `stats`, `progress`, `achievements` (badges derived from live stats via `core/achievements.ts` — no award table), `lesson` (`?id`), `course` (`?topic` → outline + next lesson), `adaptive` (`?topic` → recommended difficulty + per-lesson mastery/lock), `generation-eta` (avg course-gen duration → progress-bar ETA; from the `generation_timings` table, degrades to a default when unpopulated), `openai-key`, `anthropic-key`, `playtime` (cumulative per-title arcade playtime, from the `game_playtime` table). POST: `openai-key` / `anthropic-key` (write-only keys, encrypted at rest), `enroll` (→ generate an AI course), `answer` (grade a quiz question — MCQ or AI-graded `short_answer`), `complete` (finish a lesson → score/XP/streak), `playtime` (record a per-title play-time delta → incrementing upsert), `tutor` (Pro-gated grounded AI tutor), `checkout` / `billing-portal` (Stripe Checkout + Billing Portal → hosted redirect URL), and `stripe-webhook` — **unauthenticated + raw-body** (Stripe isn't a session user), verifies the signature and flips `users.tier` from the subscription status. Like `become`, the webhook runs before the session gate.
  - `_lib/` — `http.ts` (json helpers), `session.ts` (JWT cookie via jose), `user.ts` (public-user mapping), `validate.ts` (`parseBody` → 400 on bad input). Files prefixed `_` are not routed.
- `src/db/` — Drizzle client (`index.ts`, server-only) and schema (`schema/auth.ts`: users, credentials, webauthn challenges).
- `src/core/app-data.ts` — zod DTOs for the logged-in app; `src/core/progress.ts` — pure level/achievement/relative-time helpers (unit-tested).
- `src/server/app-data.ts` — server-only Drizzle reads behind the `/api/me/*` endpoints (composes the core mappers; explicit joins, no `with:`).
- `src/server/{enroll,course-store,openai-generator,crypto,provider-credentials}.ts` — the AI generation seam: `enrollAndGenerate` decrypts the user's OpenAI key (`provider-credentials` + AES-256-GCM `crypto`) and runs the `src/core/generation.ts` pipeline into Drizzle.
- `src/server/learning.ts` — server reads/writes for the lesson player: `getLessonView` (answer keys stripped, code exercises attached), `getCourseOutline` (topic → lessons + next unfinished), `submitAnswer` (MCQ + AI-graded short-answer), `completeLesson` (score → progress → XP → streak). Composes pure math in `src/core/learning.ts`.
- **Education AI seams (Phase 3/4 + adaptive):** pure seams in `src/core/{grader,tutor,adaptive,exercise}.ts` (interfaces, prompt builders, math, code-exercise engine) with server impls in `src/server/{grader,tutor,adaptive}.ts` composing `server/llm.ts` (raw-`fetch` Anthropic/OpenAI transports) and `server/provider.ts` (per-user key → env fallback; Claude preferred). Code exercises run client-side via `src/workers/exercise-worker.ts` + `src/lib/run-exercise.ts` (CodeMirror 6 in `components/learn/{code-editor,code-exercise}.tsx`); the tutor UI is `components/learn/tutor-panel.tsx`.
- `src/api-client/` — surface-agnostic client; `api.data.*` fetches the `/api/me/*` reads (incl. `lesson`/`course`) and drives the player (`answer`, `completeLesson`), `api.integrations.*` manages the OpenAI key, `api.courses.enroll` triggers generation (all validated against core schemas). `src/hooks/use-async.ts` drives page loading/error state; `src/components/layout/async-view.tsx` renders it.
- `src/pages/` — logged-in app (`app/`) and admin (`admin/`) pages; the `app/` pages read live data via `api.data.*`. The app no longer hosts marketing pages — those live on the Astro site (`apps/site`); `/` redirects (signed-in → `/app`, signed-out → the site via `components/layout/root-redirect.tsx`), all marketing links point to `SITE_URL` (`src/consts.ts`), and sign-out returns to the site (`src/lib/use-sign-out.ts`). The lesson player is `app/learn.tsx` (route `/app/learn/:lessonId`); Topics/Dashboard/Sessions launch into it (`src/lib/open-course.ts` resolves a topic → its next lesson). Sessions is a real "continue learning" hub.
- `src/lib/auth.ts` — WebAuthn relying-party config + TOTP helpers (server-side).
- `src/hooks/auth-context.ts` + `auth-provider.tsx` — `AuthProvider` + `useAuth` (`user`/`register`/`login`/`recover`/`logout`/`refresh`).
- `src/pages/auth/{sign-in,sign-up}.tsx` — the logged-out `/login` + `/signup` pages, styled to match the Astro site (FW-01 hero + bordered card + "why" strip) under `components/layout/auth-chrome-layout.tsx` (site header/footer + a forced-light token island). Passkey-only, so only the flow's fields are live (email; +name on sign-up; recover behind a "Lost your passkey?" toggle) — the rest are commented out. Shared bits: `components/auth/{hero-wolf,auth-field,why-box,auth-card-shell,brand-icons}.tsx`, `components/layout/{fw-header,fw-footer}.tsx`.
- `src/components/` — `require-auth.tsx` (route guard), `dashboard.tsx` (protected view), `totp-card.tsx` (authenticator enrollment).
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
- `npm run cap <cmd>` — Capacitor CLI; `npm run cap:sync` builds `dist` then syncs the native shells.
- `npm run cap:sync:prod` / `npm run tauri:build:prod` — prod native builds that point the shell at the deployed origin (`CAP_SERVER_URL` / `VITE_API_BASE`, default `https://app.fullstackwolfpack.com`, override via env). See `apps/web/.env.example`.

## Setup TODO

> Whole-app roadmap (all tracks — features + infra, what's shipped vs left): [`docs/ROADMAP.md`](docs/ROADMAP.md).

Pieces that need accounts or interactive/native steps — not done by the scaffold:

- [ ] **Neon DB** — create a Neon project, `cp .env.example .env`, set `DATABASE_URL` (and the same in the Vercel project env). Then `npm run db:push` to create the tables. Auth needs a real DB to run end-to-end.
- [ ] **AUTH_SECRET** — set a strong `AUTH_SECRET` in `.env` (`openssl rand -base64 32`); dev falls back to an insecure default, production must not.
- [x] **Auth flows + hardening** — passkey register/login, session cookies, a protected route (`RequireAuth` + `/api/protected`), TOTP enrollment/recovery, **encrypted TOTP secret at rest**, **env-driven `requireUserVerification`**, **rate-limited `login`/`recover`**, and a **fail-closed prod config guard** are all built. Remaining: set `RP_ID`/`RP_ORIGIN` (+ `AUTH_SECRET`/`ENCRYPTION_KEY`) in each deploy env — production refuses to start on dev defaults.
- [x] **Capacitor native platforms** — `ios/` + `android/` are scaffolded (`apps/web/ios`, `apps/web/android`) and both verified to build (Android `assembleDebug`; iOS simulator). Capacitor 8 uses **Swift Package Manager** for iOS (no CocoaPods). Build locally with `npm run cap:sync` (builds `dist` first, then syncs both) + Xcode/Android Studio. iOS needs Xcode; Android needs `ANDROID_HOME=~/Library/Android/sdk` + a JDK on `JAVA_HOME` (Android Studio's bundled JBR at `/Applications/Android Studio.app/Contents/jbr/Contents/Home` works). Native build artifacts + copied web assets are git-ignored (nested `.gitignore`s regenerate `.../public` on sync). Remaining: set `CAP_SERVER_URL` to the prod origin at build time (so the webview origin matches the WebAuthn RP), then signing + store accounts.
- [ ] **Tauri desktop** — `npm run tauri dev` (first run compiles Rust deps). Replace placeholder icons via `npm run tauri icon <path-to-1024px.png>`.
- [ ] **Vercel** — link the project; `@vercel/analytics` only reports once deployed on Vercel.
- [ ] **Stripe billing** — the code is wired but dormant until keyed. Create a recurring $9/mo Product (→ `STRIPE_PRICE_ID`), set `STRIPE_SECRET_KEY`, and register a webhook at `https://<app-domain>/api/me/stripe-webhook` subscribed to `checkout.session.completed` + `customer.subscription.updated`/`.deleted` (→ `STRIPE_WEBHOOK_SECRET`). For local dev: `stripe listen --forward-to localhost:5173/api/me/stripe-webhook`. Entitlement flows Checkout → webhook → `users.tier` → `core/access.ts`. The `subscriptions` table (stub since scaffold) is now used — run `npm run db:push` if it isn't in your DB yet.
- [ ] **Dev advisory** — `npm audit` shows a moderate esbuild dev-server advisory pulled in transitively by `drizzle-kit` (dev-only). `audit fix --force` would downgrade drizzle-kit ~13 minor versions; left as-is intentionally.
