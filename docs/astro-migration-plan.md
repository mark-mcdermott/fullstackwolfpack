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
