# Fullstack Wolfpack

**Stack:** ZENCATS — **Z**od · **E**dge (Neon) · **N**ode · **C**apacitor · **A**uth (Better Auth, email+password) · **T**auri · **S**hadcn

Config: Commit `conventional` · Automerge `off`

Full cross-platform stack: Vite + React 19 + TS, Tailwind v4 + shadcn-ui, Drizzle ORM on Neon (edge Postgres), Better Auth (email + password), Zod validation, and Capacitor (mobile) + Tauri (desktop) shells.

## Monorepo (pnpm workspaces)

Workspace membership lives in `pnpm-workspace.yaml` (`apps/*` + `packages/*`), not
in `package.json`. Two pnpm specifics worth knowing: internal deps use the
workspace protocol (`"@fw/ui": "workspace:*"` — a bare `*` sends pnpm to the
registry and 404s), and install scripts are blocked by default, so anything that
needs one must be listed under `onlyBuiltDependencies` in `pnpm-workspace.yaml`
(currently just `esbuild`, whose postinstall fetches its platform binary).

**One Astro deployment now** (post `docs/astro-merge-plan.md` migration — the old two-app subdomain split is gone). `apps/site` is *the* app: static marketing/content/auth pages, the React app mounted as a `client:only` **applet**, and `/api/*` as Astro endpoints — all one origin, one Vercel project.

- `apps/site/` — package `@fw/site`, the whole product. **Astro 5 + `@astrojs/react` + `@astrojs/vercel`.** Structure:
  - `src/app/` — the **React SPA**, moved wholesale from the old `apps/web/src`. Its `@/…` imports resolve here via the `@`→`src/app` alias (astro.config + vitest.config + `src/app/tsconfig.json`). Mounted by `src/app/AppRoot.tsx` (the old `main.tsx` provider stack) as a `client:only="react"` island in `src/pages/[...slug].astro` (on-demand catch-all; static `.astro` pages win over it). Colocated unit tests run from here (`pnpm --filter @fw/site test` → 483 tests).
  - `src/pages/api/**` — the API, ported from the old Vercel functions to Astro `APIRoute`s (`export const GET: APIRoute = async ({ request: req }) => …`, `prerender=false`). `_lib/` helpers stay relative + Astro-unrouted (underscore prefix). The `@astrojs/vercel` adapter bundles **every** route (API + applet) into **one** function (`_render.func`) — collapsing the old 12/12 Vercel Hobby function cap to ~1.
  - `src/pages/*.astro`, `src/layouts/Base.astro`, `src/components/*.astro` — the static marketing/content/blog surface + shared chrome (FW-01 look). `.env` + `.env.example` live here; astro.config loads `.env` into `process.env` for the endpoints under `astro dev`.
  - `ios/`, `android/`, `src-tauri/`, `capacitor.config.ts`, `native-shell/` — the **native shells** (Capacitor mobile, Tauri desktop), relocated here when `apps/web` was deleted. Neither bundles the app: the applet is `prerender=false`, so there is no `/app` in the static output to bundle. (Under the old passkey auth this was doubly forced, since a webview on `capacitor://localhost` / `tauri://localhost` could never satisfy WebAuthn's origin binding.) Both therefore point the whole webview at the apex — Capacitor via `server.url` (`CAP_SERVER_URL`), Tauri via the window `url` in `src-tauri/tauri.prod.conf.json` — and ship `native-shell/` (a ~1KB offline notice) instead of `dist/client`, keeping ~49MB of games/ROMs/imagery out of the binaries.
- `apps/web/` — **deleted.** Its `src/`+`api/` became `apps/site/src/app` + `apps/site/src/pages/api`; its native shells moved to `apps/site`; its web-SPA configs (`vite.config.ts`, `dev-api.ts`, `index.html`, `vercel.json`, `middleware.ts`) died with the migration and are recoverable from git history.
- `packages/ui/` — `@fw/ui`, the FW-01 design system (ui-kit / charts / wolf-sun / theme-toggle + `theme.css` tokens), registry-ready (`registry.json`). Consumed via the `@fw/ui` alias.
- **Every** root script now delegates to `@fw/site` — `dev|build|test`, `db:*`/`gen:builtins` (`drizzle.config.ts` + `scripts/` live in `apps/site`), `lint`, and `tauri`/`cap`. There is no second workspace app.
- **The "## Layout" paths below now live under `apps/site/src/app/`** (e.g. Layout's `src/core` = `apps/site/src/app/core`), and the `api/` it describes is `apps/site/src/pages/api/` (handlers now Astro `APIRoute`s, otherwise the same logic). `packages/core` extraction was superseded by folding into the single app; the `@/` alias makes it unnecessary.
- **Deploy:** live on a single Vercel project (`fullstackwolfpack-astro`), Root Directory `apps/site`. Canonical origin is the apex `fullstackwolfpack.com`; `www` 308-redirects to it and `SITE_ORIGIN` is the apex. The old `fullstackwolfpack` project (`app.` subdomain) has since been **deleted** — `fullstackwolfpack-astro` is the only project, so there is no rollback target any more.

## Theming

Light and dark are deliberately **diverging looks**, not one palette with the colors swapped: light is **skeuomorphic-flat** (solid surfaces, crisp edges, cast shadows), dark is **glassy-skeuomorphic** (translucency, blur, sheen, inset light).

**Every light/dark difference must be CSS-only.** No `useTheme()` branches, no per-theme conditional markup — one DOM tree, styled two ways. The levers:

- `light:` / `dark:` variants, declared in the synced pair (`apps/site/src/app/index.css` + `packages/ui/src/theme.css`): `dark` is `&:is(.dark *)`, `light` is `&:not(.dark *)`.
- Theme tokens (`--background`, `--card`, `--border`, …) for anything that is only a color.
- `backdrop-filter`, gradients, `box-shadow` (including `inset`), and `::before`/`::after` for glass. Pseudo-elements are what give dark its extra layers without adding real elements that light then has to hide.
- SVG art uses `fill="currentColor"` (see `WolfMark` in `packages/ui/src/ui-kit.tsx`) rather than per-theme assets.

The one exception is `ThemeToggle`, which renders Sun vs Moon and swaps its `aria-label` in React. It predates the rule — don't add more.

## Layout

- `api/` — serverless functions (Vercel-style; Web `Request`/`Response` handlers).
  - `auth/[...all].ts` — **every** Better Auth endpoint behind one catch-all (sign-up, sign-in, sign-out, password reset, email verification).
  - `auth/me.ts` — the one named route beside it, which outranks the catch-all: the session user joined to their profile row (`role`, `tier`, `displayName`).
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
- `src/server/auth.ts` — the Better Auth instance (`getAuth()`), built lazily, plus `getSessionUserId`. `src/server/email.ts` + `email-templates.ts` are the Resend transport behind password reset and address confirmation.
- `src/hooks/auth-context.ts` + `auth-provider.tsx` — `AuthProvider` + `useAuth` (`user`/`signUp`/`signIn`/`requestPasswordReset`/`resetPassword`/`logout`/`refresh`).
- `src/pages/auth/{sign-in,sign-up}.tsx` — the logged-out `/login` + `/signup` pages, styled to match the Astro site (FW-01 hero + bordered card + "why" strip) under `components/layout/auth-chrome-layout.tsx` (site header/footer + a forced-light token island). Email + password (+name on sign-up, confirm-password, and a "Forgot password?" toggle that emails a reset link); `/reset-password` is where that link lands. Username and OAuth fields stay commented out. Shared bits: `components/auth/{hero-wolf,auth-field,why-box,auth-card-shell,brand-icons}.tsx`, `components/layout/{fw-header,fw-footer}.tsx`.
- `src/components/` — `require-auth.tsx` (route guard), `dashboard.tsx` (protected view).
- `src/components/ui/` — shadcn components (`base-nova` style, base-ui primitives).
- `drizzle.config.ts` — drizzle-kit config (reads `DATABASE_URL`).
- `capacitor.config.ts` — Capacitor app config (`com.fullstackwolfpack.app`, webDir `dist`).
- `src-tauri/` — Tauri desktop shell (Rust).

## Auth flow

**Better Auth, email + password** — the same shape as the other apps in `~/Dev`.
It owns the four tables in `src/db/schema/auth-schema.ts` (`user`, `session`,
`account`, `verification`); the app's own `users` table is the profile/domain
row and is **not** Better Auth's. `users.id` references `user.id`, which keeps
all 21 of the app's `user_id` foreign keys pointing where they already did, and
`users.email`/`displayName` mirror `user.email`/`user.name` — the
`databaseHooks` in `src/server/auth.ts` create the profile row after signup and
keep those two columns in step, because ~60 call sites read `displayName` from
`users`.

Every endpoint lives behind one catch-all, `src/pages/api/auth/[...all].ts`
(`sign-up/email`, `sign-in/email`, `sign-out`, `forget-password`,
`reset-password`, …). The one named route beside it is `auth/me.ts`, which
outranks the catch-all and returns the session user joined to their profile row
— Better Auth's own `get-session` knows nothing about `role` or `tier`.

Sessions are **rows, not JWTs** (30 days, refreshed daily): deleting one
actually ends the session, which the old stateless cookie could not do.
`getAuth()` is built on first use, not at import — Astro evaluates module
top-level code at build time, where `AUTH_SECRET` and `DATABASE_URL` do not
exist. It still **fails closed**: production (an https `SITE_ORIGIN`) refuses to
start on a missing or placeholder `AUTH_SECRET`.

Routes are gated client-side by `RequireAuth` (UX) and server-side by
`getSessionUserId` on each protected endpoint (the real boundary). Password
reset and address confirmation send through Resend (`RESEND_API_KEY`); without
a key those two flows **throw rather than silently no-op**, so a missing key is
loud. `/reset-password` is where the emailed link lands. Rate limiting is now
Better Auth's own rather than the hand-rolled `auth_rate_limits` counter.

> Previously passkeys/WebAuthn with a TOTP fallback and no passwords. That is
> gone as of the Better Auth migration — `@simplewebauthn/*`, `otplib`, `jose`,
> the nine hand-rolled ceremony routes, the `credentials` /
> `webauthn_challenges` / `auth_rate_limits` tables and `users.totp*` all went
> with it, and are recoverable from git history.

## Scripts

- `pnpm dev` / `build` / `preview` — Astro (`astro dev` on :4321 serves the pages, the applet **and** `src/pages/api/*` in one process; the old Vite dev-api plugin died with `apps/web`).
- `pnpm test` / `test:watch` — Vitest over the colocated `src/app` tests.
- `pnpm db:push` / `db:generate` / `db:migrate` / `db:studio` — Drizzle.
- `pnpm db:seed` — seed the catalog (topics, achievements, levels, built-in courses). **Insert-only** and idempotent on fixed ids, so it never deletes and never overwrites: commenting a topic out of `SEED_TOPICS` only affects a *fresh* seed, and regenerated content does not reach an already-seeded database until you re-seed it. `--refresh-builtins` wipes built-in courses first (cascades to user progress on them).
- `pnpm db:park --list | --keep <slug> | --restore <slug>` — show/hide topics via `topics.status` without deleting anything; only the two galleries filter, by-slug lookups don't. The lever for an already-seeded DB, where commenting out `SEED_TOPICS` does nothing.
- `pnpm db:reset-dev` — wipe the Dev Mode test users' accumulated data, keeping the accounts.
- `pnpm gen:builtins [slug…]` — regenerate `seed-content.generated.ts` with an LLM (needs a provider key). **Re-seed each environment afterwards** — nothing propagates it, least of all a deploy.
- Targeting prod: `apps/site/.env.prod` holds the prod `DATABASE_URL` but is never auto-loaded (the pnpm aliases hardcode `.env`), so run `pnpm exec tsx --env-file=.env.prod scripts/<name>.ts` from `apps/site`. Details + the ordering rules in [`docs/catalog-runbook.md`](docs/catalog-runbook.md).
- `pnpm tauri <cmd>` — Tauri CLI (e.g. `tauri dev`, `tauri build`).
- `pnpm cap <cmd>` — Capacitor CLI; `pnpm cap:sync` builds `dist` then syncs the native shells.
- `pnpm cap:sync:prod` / `pnpm tauri:build:prod` — the **shipping** native builds; both point the webview at `https://fullstackwolfpack.com` and bundle only `native-shell/`. Capacitor takes the origin from `CAP_SERVER_URL` (overridable); Tauri from `src-tauri/tauri.prod.conf.json`. Plain `tauri build` ships only the offline notice — use `tauri:build:prod`. `tauri dev` uses `devUrl` (localhost:4321) and works fully. See `apps/site/.env.example`.

## Setup TODO

> Whole-app roadmap (all tracks — features + infra, what's shipped vs left): [`docs/ROADMAP.md`](docs/ROADMAP.md).

Pieces that need accounts or interactive/native steps — not done by the scaffold:

- [ ] **Neon DB** — create a Neon project, `cp .env.example .env`, set `DATABASE_URL` (and the same in the Vercel project env). Then `pnpm db:push` to create the tables. Auth needs a real DB to run end-to-end.
- [ ] **AUTH_SECRET** — set a strong `AUTH_SECRET` in `.env` (`openssl rand -base64 32`); dev falls back to an insecure default, production must not.
- [x] **Auth flows + hardening** — Better Auth email+password sign-up/sign-in, DB-backed revocable sessions, a protected route (`RequireAuth` + `/api/protected`), password reset + address confirmation over Resend, and a **fail-closed prod config guard** are all built. Remaining: set `SITE_ORIGIN` (+ `AUTH_SECRET`/`ENCRYPTION_KEY`) in each deploy env — production refuses to start on a placeholder secret.
- [ ] **Resend (transactional email)** — create an API key at resend.com and verify the **`mail.fullstackwolfpack.com`** sending subdomain (DKIM/SPF), then set `RESEND_API_KEY` (optionally `EMAIL_FROM`) locally and in the Vercel project. Keyed directly rather than through the Vercel Marketplace integration, which has no free tier ($20/mo minimum) — Resend's own free tier is 3k emails/month. **Until this is set, password reset and email confirmation throw**, so a forgotten password cannot be recovered.
- [x] **Capacitor native platforms** — `ios/` + `android/` are scaffolded (`apps/site/ios`, `apps/site/android`) and both verified to build (Android `assembleDebug`; iOS simulator). Capacitor 8 uses **Swift Package Manager** for iOS (no CocoaPods). Build locally with `pnpm cap:sync` (builds `dist` first, then syncs both) + Xcode/Android Studio. iOS needs Xcode; Android needs `ANDROID_HOME=~/Library/Android/sdk` + a JDK on `JAVA_HOME` (Android Studio's bundled JBR at `/Applications/Android Studio.app/Contents/jbr/Contents/Home` works). Native build artifacts + copied web assets are git-ignored (nested `.gitignore`s regenerate `.../public` on sync). Remaining: set `CAP_SERVER_URL` to the prod origin at build time then signing + store accounts.
- [ ] **Tauri desktop** — `pnpm tauri dev` (first run compiles Rust deps). Replace placeholder icons via `pnpm tauri icon <path-to-1024px.png>`.
- [ ] **Vercel** — link the project; `@vercel/analytics` only reports once deployed on Vercel.
- [ ] **Stripe billing** — the code is wired but dormant until keyed. Create a recurring $9/mo Product (→ `STRIPE_PRICE_ID`), set `STRIPE_SECRET_KEY`, and register a webhook at `https://<app-domain>/api/me/stripe-webhook` subscribed to `checkout.session.completed` + `customer.subscription.updated`/`.deleted` (→ `STRIPE_WEBHOOK_SECRET`). For local dev: `stripe listen --forward-to localhost:5173/api/me/stripe-webhook`. Entitlement flows Checkout → webhook → `users.tier` → `core/access.ts`. The `subscriptions` table (stub since scaffold) is now used — run `pnpm db:push` if it isn't in your DB yet.
- [ ] **Dev advisory** — `pnpm audit` shows a moderate esbuild dev-server advisory pulled in transitively by `drizzle-kit` (dev-only). `audit fix --force` would downgrade drizzle-kit ~13 minor versions; left as-is intentionally.
