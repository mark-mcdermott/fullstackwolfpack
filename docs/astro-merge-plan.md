# Migration Plan: One Astro site + the app as a `client:only` applet

> **How to resume with cleared context:** tell a fresh session
> *"Read docs/astro-merge-plan.md and execute it phase by phase."*
> Run it on a clean `main`, at the start of a fresh window (it's non-additive).

---

## Context

Today the product is a monorepo with **two separately-deployed apps**: `apps/web`
(Vite **React SPA** + `api/` serverless functions — the whole app *and* the guest
front door) and `apps/site` (**Astro**, pure static SSG — marketing + a blog).
They're on different origins and the topology is described three contradictory
ways across the repo.

We want **(1) one origin + one simpler deploy** and **(3) one unified codebase**.
The realization that makes this clean: **auth here only gates a self-contained
applet**, so the static site never has to server-render anything authenticated.
That is close to the ideal case for Astro + auth.

**Target end state:** a single **Astro** deployment (one origin) that serves static
marketing/content/auth pages, embeds the React app as a `client:only` applet, and
hosts `/api/*` as Astro endpoints. This also collapses the **12/12** Vercel
functions into **~1** (Astro's adapter bundles server routes) as a bonus.

---

## Target architecture

**Governing principle — draw the auth boundary at the API, not at the page.**
Astro serves the *same static HTML to everyone*. The applet decides what to show
client-side (it already does: `RequireAuth` → `/api/auth/me` → redirect). The
**API functions are the real boundary** (`getSessionUserId(req)` on every handler)
and don't care what renders the frontend. So **Astro never touches the session.**

**Every surface on a gradient of "how personalized / how interactive":**

| Surface | Rendering | Notes |
|---|---|---|
| About, pricing, how-it-works, blog | **Astro static** | SEO + instant paint; no JS |
| Header / footer (all pages) | **Astro** + tiny `client:only` **username island** | reads `/api/auth/me` |
| Login / signup | **Astro page** + existing React auth component as `client:only` island | WebAuthn is browser JS |
| Learn / Arcade (browse) | **Astro static catalog** + light `client:load` **user-state islands** | fetch `/api/me/*`; guest → `guest-progress` |
| Homepage launcher/mission, `/app/*`, live game player | **`client:only` applet** | needs live browser runtime |

**The `client:only` vs `client:load` rule of thumb** (so future components classify
themselves):

> **Does a live *browser runtime* need to exist for this to render?**
> - **Yes → `client:only`.** Live WASM emulator, `<canvas>`, Web Audio, workers, or
>   code that reads `localStorage`/`window` *during render*. → the **game player**
>   (reading a running game's score + play/pause acts on the live in-browser emulator;
>   there's no server-side Game Boy).
> - **No → `client:load` / `client:visible`.** Renders a skeleton on the server; its
>   browser work (fetching `/api/me/*`, handlers) is inside `useEffect`. → **stored**
>   scores/playtime/progress from the DB.

So "reading the game" only makes the **player island** `client:only` — the static
catalog around it and the *historical* stats (a fetch) are not contaminated.

**Cross-island state = a store, not React context.** Each island is its own React
root, so the existing `useAuth()` context won't span islands. Use **`nanostores`**
(Astro-blessed) for shared auth/user state: fetch the user once, every island
(nav username, learn/arcade badges) subscribes. Inside the `/app/*` SPA island the
React contexts keep working as today.

**What does NOT change:** the DB/Drizzle/Neon, the WebAuthn/TOTP/Stripe *logic*, the
`src/core`/`src/server` business logic, the `@fw/ui` design system, and the game +
lesson engines. This is a *hosting/packaging* migration, not a rewrite of behavior.

---

## Decisions (confirm/enforce during execution)

1. **Canonical origin — DECIDED: apex `fullstackwolfpack.com`.** Everything targets the
   apex: `RP_ID=fullstackwolfpack.com`, `RP_ORIGIN=https://fullstackwolfpack.com`, the
   Astro deploy, native shells, and internal links. This matches `apps/web/.env.prod`,
   so **existing passkeys are preserved** *iff* current prod already serves/verifies at
   the apex (confirm the live prod origin first — if prod is actually on `app.`, existing
   passkeys re-register). Update the stale references to agree: `CLAUDE.md` (says `www`),
   `apps/site/src/consts.ts` (`APP_URL` = `app.`).
2. **What is `/`?** With real marketing pages arriving, recommend `/` becomes a
   **static Astro landing** with a prominent "Start a session" CTA that enters the
   applet — moving the interactive launcher/mission *out* of `/` and into the applet
   (e.g. `/app` or a `/play`-style route). Confirm vs. keeping the launcher on `/`.
3. **API location.** Recommend **moving `/api/*` into Astro endpoints** (collapses
   12→~1 function, single origin). Alternative: keep them as separate Vercel functions
   under the same project (no cap relief).
4. **Code location.** Recommend **folding `apps/web` into `apps/site`** (true one
   codebase) via `packages/core` for shared logic. Alternative: keep `apps/web` as an
   imported `@fw/web` package.

---

## Local development (one server)

`npm run dev` (= `astro dev`) is a **single local server** that serves everything at
once — static `.astro` pages, the React islands + the `client:only` applet (Vite Fast
Refresh/HMR), and the `/api/*` Astro endpoints (executed server-side in the same dev
process). **No build step to develop**; `astro build` / `astro preview` only produce the
production output (prerendered HTML + client JS bundles + one bundled serverless
function). This **replaces** today's Vite server + custom `dev-api.ts` plugin with one
native server. WebAuthn works on `localhost` (secure context), so passkey register/login
is testable against the one dev server with `RP_ID=localhost`,
`RP_ORIGIN=http://localhost:4321` (Astro's default port).

## Prerequisites (Phase 0 — settle before big code)

- **Rotate the committed secrets** in `apps/web/.env.prod` (live plaintext Neon creds,
  `AUTH_SECRET`, OpenAI/Anthropic keys) and stop tracking that file.
- **Confirm the canonical origin** (Decision 1) and whether passkey continuity holds.
- **Clean slate:** land/merge open PRs; pause the other live worktree branches
  (`design-polish`, `learn-and-arcade-pages`) — this migration is **non-additive**
  and must run on a green `main`. (Per the original `docs/astro-migration-plan.md`
  warning: do this at the start of a fresh window, not mid-velocity.)

---

## Phased implementation (each phase ends green + deployable)

### Phase 1 — Astro gains React + a shared logic package
- `apps/site`: add `@astrojs/react`, `react`, `react-dom`; register the React
  integration in `apps/site/astro.config.mjs` (keep the `@fw/ui` alias + Tailwind
  Vite plugin already there).
- Extract shared logic so both the applet *and* future Astro endpoints import it,
  not via cross-app deep paths: `git mv apps/web/src/core → packages/core/src`
  (pkg `@fw/core`, tsconfig, `@/core/*`→`@fw/core` alias). Decide whether
  `src/server/*` moves too or stays app-side (it's server-only; moving it to
  `packages/core` or a `packages/server` lets Astro endpoints import it cleanly).
- **Checkpoint:** `apps/site` builds; a trivial React island renders; existing app
  build/tests still green against the extracted package.

### Phase 2 — Mount the applet as a `client:only` island under Astro
- Bring the React app into the Astro project (as `apps/site/src/app/*`, or import
  from an `@fw/web` package). Create `apps/site/src/components/app/AppRoot.tsx` =
  `<BrowserRouter>` → `AuthProvider` → `TimerProvider` → `<App/>` (today's
  `apps/web/src/main.tsx` stack, minus the DOM mount).
- Catch-all Astro route `apps/site/src/pages/app/[...path].astro` renders
  `<AppRoot client:only="react" />`. If the applet no longer owns origin root, set a
  React Router `basename` and Vite `base` accordingly (today it assumes `/`).
- Resolve **Decision 2** (`/`): if `/` becomes a static landing, the launcher/mission
  moves into the applet route; the existing `apps/web/src/pages/public/guest-home.tsx`
  logic (phase machine, mission store, resume card, `mission-exit-store`) moves with it.
- **Checkpoint:** applet runs under `astro dev`; deep links + client-side routing work.

### Phase 3 — Move `/api/*` into Astro endpoints (one backend, cap relief)
- Add `@astrojs/vercel` adapter; keep pages static (`output` default), mark only the
  API routes server (`export const prerender = false`).
- Port each `apps/web/api/*` handler to an Astro **`APIRoute`**: `export async function GET(req)`
  → `export const GET: APIRoute = ({ request }) => …`. The dispatcher
  `api/me/[action].ts` → `apps/site/src/pages/api/me/[action].ts`. **Reuse the `_lib`
  helpers verbatim** — `api/_lib/session.ts` (`getSessionUserId`/`createSessionCookie`/
  `clearSessionCookie`), `http.ts`, `validate.ts`, `user.ts`, `dev-users.ts` — and
  `src/lib/auth.ts` (RP config). Endpoints import business logic from `packages/core`.
- Retire `apps/web/dev-api.ts` (the Vite dev-API plugin) — Astro dev serves endpoints.
- The adapter bundles all endpoints into ~1 serverless function → **12/12 → ~1**.
- **Checkpoint:** passkey register/login/verify, `/api/me/*` reads, Stripe webhook,
  and the `become` dev path all work same-origin under `astro dev` + a preview deploy.

### Phase 4 — Rebuild the static surface + shared chrome as Astro
- **Header/footer → Astro** components; the auth-dependent corner is a
  `client:only` `apps/site/src/components/nav/UserMenu.tsx` island backed by a
  `apps/site/src/stores/user.ts` **nanostore** (fetch `/api/auth/me` once).
- **Marketing/content pages → `.astro`:** the landing (`index.astro`), `about`,
  `how-it-works`, `pricing` (blog already exists). Port from
  `apps/web/src/pages/public/*` / `apps/web/src/components/home/*`.
- **Auth pages → Astro** (`login.astro`, `signup.astro`) mounting the existing React
  `apps/web/src/pages/auth/{sign-in,sign-up}.tsx` as `client:only` islands.
- **Learn / Arcade → Astro static catalog + islands:** the catalog is static; drop in
  light `client:load` user-state islands (fetch `/api/me/{progress,playtime,stats,
  achievements}`, guests via `apps/web/src/lib/guest-progress.ts`, both feeding the
  nanostore); the inline **game player is a `client:only` island**. Introduce
  `nanostores` here (fetch-once, hydrate-many).
- Delete migrated `apps/web/src/pages/public/*` and the old React header/footer where
  replaced.
- **Checkpoint:** whole site navigable; marketing/learn/arcade catalogs are static
  HTML (view-source shows content); islands hydrate; a game launches from the arcade.

### Phase 5 — One origin, deploy, native, cleanup
- **Single Vercel project**, Root Directory `apps/site`, the one canonical origin.
  Astro serves everything (static pages + the `/app/*` applet route + `/api/*`
  endpoints). Remove the old `apps/web/vercel.json` SPA-rewrite project.
- Set env on the one project: `RP_ID`, `RP_ORIGIN` (= the one origin), `AUTH_SECRET`,
  `ENCRYPTION_KEY`, `DATABASE_URL`, `STRIPE_*`, AI keys, `ABLY_API_KEY`. Passkeys are
  now single-origin (drop `VITE_API_BASE`/`SITE_URL` cross-origin plumbing).
- **Native shells:** re-point Capacitor (`webDir`/`server.url`) and Tauri
  (`frontendDist`/API base) at the Astro build output + the one origin; re-sync/
  re-sign; **verify a passkey ceremony inside the webview** (the RP origin must match).
- Delete/retire `apps/web` (or reduce to the native wrappers if they need a build
  target). Update `CLAUDE.md` topology + remove the stale `root-redirect.tsx`/
  subdomain references.
- **Checkpoint:** prod deploy green; auth end-to-end on one origin; Capacitor + Tauri
  builds pass with working passkeys; function count ≈ 1.

---

## Key files / patterns

- **Create:** `apps/site/src/components/app/AppRoot.tsx`, `.../pages/app/[...path].astro`,
  `.../pages/api/**` (ported), `.../components/nav/UserMenu.tsx`, `.../stores/user.ts`,
  `.../pages/{index,about,how-it-works,pricing,login,signup,learn,arcade}.astro`.
- **Reuse verbatim:** `api/_lib/{session,http,validate,user,dev-users}.ts`,
  `src/lib/auth.ts`, `src/api-client/*` (applet keeps same-origin fetch),
  `src/lib/guest-progress.ts`, `@fw/ui` (`theme.css` + components), the game/lesson
  engines and `src/core`/`src/server` (via `packages/core`).
- **Config:** `apps/site/astro.config.mjs` (+react, +vercel adapter), `apps/site/package.json`
  (+react/react-dom/@astrojs/react/@astrojs/vercel/nanostores).
- **Retire:** `apps/web/dev-api.ts`, `apps/web/vercel.json`, most of `apps/web/*`.
- **Re-point:** `apps/web/capacitor.config.ts`, `apps/web/src-tauri/tauri.conf.json`,
  native `ios/`/`android/` `capacitor.config.json`, env files, `CLAUDE.md`.

## Risks

- **Passkey re-registration** if the canonical origin differs from where users
  registered (Decision 1) — the sharpest user-facing risk. Weigh before Phase 0.
- **Non-additive restructure** — must run on a clean `main`, coordinated with the
  other worktree branches. High risk of a broken half-migration if done piecemeal
  mid-velocity.
- **SSR-safety of ported endpoints** — Astro endpoints run server-side; ensure no
  accidental client-only imports leak in (business logic is already framework-agnostic
  in `src/core`, which helps).
- **Native origin binding** — Capacitor/Tauri webviews must load from the RP origin or
  passkeys fail; re-verify per shell.

## Verification (end-to-end, per checkpoint)

- **Dev:** `astro dev` serves static pages, the applet island (deep links), and
  `/api/*` endpoints on one origin; register + login a passkey locally end-to-end.
- **Islands:** view-source on `/`, `/about`, `/learn` shows real static HTML; the nav
  username + learn/arcade badges hydrate from `/api/me/*` (and `guest-progress` when
  logged out); launching a game mounts the `client:only` player.
- **Preview deploy:** function count ≈ 1; Stripe webhook reachable; sign-in/out on one
  origin; no cross-origin redirects.
- **Native:** Capacitor + Tauri prod builds load the Astro origin and complete a
  passkey ceremony in-webview.
- **Tests:** `npm test` (the 484 unit tests) stays green throughout — logic moved to
  `packages/core` must keep passing.
