# Astro migration plan — public site split (+ registry-ready design system)

**Goal:** move the logged-out surface (landing, blog, marketing) to a static
**Astro** app and keep the logged-in surface as the current **React SPA**, both
in **one repo** via workspaces. This improves SEO + first paint for marketing,
gives the blog a real content pipeline (no DB), and — as a bonus — extracts the
FW-01 design system into a shared, **registry-ready** package.

> Status: PLAN (not started). This is a shared restructure — read the
> Coordination section before touching it.

---

## Why

- The public pages (`src/pages/public/*` — home, blog, features, pricing, about,
  how-it-works) are currently **client-rendered React** → poor SEO, slower first
  paint. Marketing/landing/blog are exactly Astro's wheelhouse.
- The blog "static vs CMS" question dissolves: **Astro content collections**
  (MDX files, type-checked, version-controlled) are "CMS-enough" with zero DB.
  Static-first; add a headless CMS only if non-devs ever need to publish.
- **Static Astro output = zero serverless functions**, so moving 6 public pages
  out of the SPA actually *relieves* the Vercel 12-function cap.
- Clean auth boundary: Astro (public) needs no session; "Start learning" just
  links to `/app` (React). The React app keeps owning the session + `/api/*`.

## Target structure (npm/pnpm workspaces)

```
apps/
  site/   ← Astro: / /blog /features /pricing /about /how-it-works  (static/SSG)
  app/    ← today's React SPA: /app/* /login /signup  + api/
packages/
  core/   ← core/schemas, access, generation, learning, series … (framework-agnostic; already is)
  ui/     ← Tailwind theme (the FW-01 tokens) + wolf mark + shared primitives (ui-kit)
```

Vercel serves Astro at the root and rewrites `/app/*` + `/api/*` to the React
app — one domain.

## Steps (sequence; each is a checkpoint)

1. **Workspace-ify the repo** — root `package.json` workspaces; move current app
   into `apps/app`. *(The disruptive step — see Coordination.)*
2. **Extract `packages/core`** — the framework-agnostic logic (`src/core/*`,
   maybe `src/server/*` stays app-side). Mostly a move + import-path update.
3. **Extract `packages/ui`** — Tailwind theme/tokens + wolf mark + the FW-01
   primitives (`ui-kit`, `charts`, `wolf-sun`, `theme-toggle`). **Do this
   registry-ready** — see below.
4. **Stand up `apps/site` (Astro)** — landing + marketing, importing
   `packages/ui` so it matches FW-01 exactly. Blog via **content collections**
   (MDX in `apps/site/src/content/blog`).
5. **Point `apps/app` at the shared packages**; delete the now-migrated
   `src/pages/public/*` from the SPA.
6. **Unify on Vercel** — root → Astro (static), `/app/*` + `/api/*` → the app.
   Verify the function count (should *drop*, since public pages leave the SPA).

## Design-system extraction — make `packages/ui` registry-ready

When we extract `packages/ui` (step 3), shape it so it's **one publish away from
being a distributable kit** (see `CLEANROOM-V2-ROADMAP.md`) at ~no extra cost:

- **Separate tokens from components.** Design tokens (the FW-01 CSS variables /
  Tailwind theme — the red, mono type, radii, motifs) live in their own
  entrypoint, independent of the React components.
- **shadcn-registry-compatible layout.** Structure components so a
  `registry.json` can expose them for copy-in install (`npx shadcn add <url>`),
  the distribution model that won. No live dependency required.
- **Dependency-light + framework-thin.** Keep primitives free of app-specific
  imports so both `apps/site` (Astro) and `apps/app` (React) — and, later, an
  external consumer — can use them.
- **Ship the agent-context layer.** Include a short `llms.txt` / usage doc that
  teaches the aesthetic + rules, so an LLM builds on-brand from the package.
- **One-way flow only.** The app owns its copy; cleanroom (if revived) *reads
  from* this package to publish. **Never** live-link the app to cleanroom.

This means the monorepo refactor and any future "sell the design system" bet
share the same first step — do it once, correctly.

## Coordination (important)

- **Step 1 (workspace-ify) moves everyone's files** — every pane (education,
  arcade, core/data) must rebase onto the new structure. Do it at a **sync
  point**, not while PRs are in flight. Land open PRs first, restructure on a
  clean tree.
- Announce before starting; it's the one change that can't be "additive."

## Effort / risk

- Moderate. Steps 2–6 are mechanical-ish; step 1 + the shared-design extraction
  are the real work (~a focused day). Best done **now, while the public pages
  are still thin** — it only gets harder as marketing content grows.
- **Do this at the start of a fresh window with a clean context** — it's a large,
  deeply-interdependent, non-additive move; starting it late in a window risks a
  broken half-migration. `main` must be green and all panes' PRs landed first.

---

## Execution checklist (turnkey — run top to bottom on a clean `main`)

Preconditions: all panes' PRs merged, `main` green, working tree clean, no other
pane mid-restructure. Branch: `refactor/monorepo`. **Commit at every ✅ gate.**

**0. Snapshot.** `git checkout main && git pull && git checkout -b refactor/monorepo`.

**1. Move the app → `apps/web` (history-preserving).**
```
mkdir -p apps/web
git mv src api public index.html vite.config.ts vitest.config.ts \
       tsconfig.json tsconfig.app.json tsconfig.node.json tsconfig.api.json \
       dev-api.ts drizzle.config.ts drizzle scripts components.json \
       .oxlintrc.json capacitor.config.ts src-tauri  apps/web/
git mv package.json apps/web/package.json          # becomes the app package
mv .env apps/web/.env 2>/dev/null; mv .env.example apps/web/.env.example  # local, untracked
```
✅ commit "refactor: move web app into apps/web"

**2. Workspace root.** Create a new root `package.json`:
```
{ "name":"fullstack-wolfpack","private":true,"type":"module",
  "workspaces":["apps/*","packages/*"],
  "scripts": { "dev":"npm run dev -w apps/web","build":"npm run build -w apps/web",
    "test":"npm run test -w apps/web","lint":"npm run lint -w apps/web" } }
```
Rename `apps/web/package.json` `name` → `@fw/web`. `npm install` at root (hoists).
✅ commit "chore: npm workspaces root"

**3. Fix app-internal config paths (mostly no-ops after the move):**
- `apps/web/vite.config.ts` — `devApi()` import + `@`→`./src` alias are relative, unchanged. `loadEnv(mode, process.cwd())` now resolves `.env` in `apps/web` ✓.
- `apps/web/tsconfig*.json` — `@/*`→`./src/*` unchanged; `include`/`references` relative ✓.
- `drizzle.config.ts` / `scripts/seed.ts` — schema + `../src/db` paths relative ✓.
- **Vercel:** set Root Directory = `apps/web` (dashboard) **or** add root `vercel.json` pointing at it. api/ functions still count against the cap.
✅ gate: `npm run build -w apps/web` + `npm test -w apps/web` green → commit.

**4. Extract `packages/core`.** `git mv apps/web/src/core packages/core/src` (+ pkg.json `@fw/core`, tsconfig). Map `@/core/*`→`@fw/core` (tsconfig paths + vite alias) so app + api imports keep working; fix `../core` relative imports in `apps/web/src/server/*`. ✅ build/test → commit.

**5. Extract `packages/ui` (registry-ready — see section above).** Move `ui-kit`, `charts`, `wolf-sun`, `theme-toggle`, `recent-lessons`?, + the Tailwind theme tokens (`src/index.css` `@theme`/vars) into `packages/ui`. Tokens in their own entry; `registry.json` for copy-in. Update app imports. ✅ build/test → commit.

**6. `apps/site` (Astro).** `npm create astro@latest apps/site` → add `@astrojs/react`, `@astrojs/tailwind` (or v4), import `@fw/ui` tokens. Port `public/*` marketing pages to `.astro`; blog via **content collections** (`apps/site/src/content/blog/*.mdx`) using the committed `public/images/blog-images/*`. Use the real `public/images/wolf-sun.png` for the hero. Delete migrated `apps/web/src/pages/public/*`. ✅ `npm run build -w apps/site` → commit.

**7. Vercel routing.** Root serves Astro (static); rewrite `/app/*` + `/api/*` → the web app. Verify the SPA's function count **dropped** (public pages left it). ✅ deploy green → PR.

### Notes for execution
- The **real mock art is now committed** (`public/images/wolf-sun.png`,
  `wolf-rear-and-sun.png`, `blog-images/`) — swap the `WolfSun` CSS approximation
  for the real image, and feed `blog-images/` into the Astro blog.
- After the move, the git **worktrees** (`worktrees/*`) reference the old paths —
  prune/recreate them if any pane still uses one.
- Keep each step a separate commit so a mid-window stop is resumable.
