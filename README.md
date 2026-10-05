# Fullstack Wolfpack

A learning app built around one loop: **play a game, then learn a skill** — short arcade sessions paired with AI-generated lessons, so a study habit rides on top of something you already want to do. Guests can try it without an account; signing up keeps the XP.

Live at **[fullstackwolfpack.com](https://fullstackwolfpack.com)**.

## Stack

**ZENCATS** — Zod · Edge (Neon) · Node · Capacitor · Auth (Better Auth) · Tauri · Shadcn

Astro 5 with React 19 islands, Tailwind v4 + shadcn-ui, Drizzle ORM on Neon Postgres, and Better Auth for email + password sign-in with DB-backed sessions. Capacitor (mobile) and Tauri (desktop) wrap the same origin rather than bundling the app, since the applet route is `prerender=false` and so never lands in the static build.

## Quickstart

```bash
pnpm install
cp apps/site/.env.example apps/site/.env   # then fill in DATABASE_URL + AUTH_SECRET
pnpm db:push                               # create the tables
pnpm db:seed                               # topics, achievements, levels, built-in courses
pnpm dev                                   # http://localhost:4321
```

Auth needs a real database to work end to end — create a [Neon](https://neon.tech) project and put its connection string in `DATABASE_URL`. Generate `AUTH_SECRET` and `ENCRYPTION_KEY` with `openssl rand -base64 32`; production refuses to boot on the dev defaults. Full variable list in [`apps/site/.env.example`](apps/site/.env.example).

## Layout

A pnpm-workspaces monorepo with one deployable app.

```
apps/site/            @fw/site — the whole product (Astro + Vercel adapter)
  src/pages/*.astro     static marketing/content pages
  src/pages/[...slug]   the React SPA, mounted as a client:only island
  src/pages/api/**      the API, as Astro endpoints
  src/app/              the React app — components, hooks, core/, server/, db/
  ios/ android/ src-tauri/   native shells
packages/ui/          @fw/ui — the FW-01 design system + theme tokens
docs/                 plans, briefs, runbooks
```

Every root script delegates to `@fw/site`; there is no second app. `@/…` imports resolve to `apps/site/src/app`.

## Scripts

| | |
|---|---|
| `pnpm dev` / `build` / `preview` | Astro dev server (`:4321`), production build, preview |
| `pnpm test` / `test:watch` | Vitest — 485 colocated unit tests |
| `pnpm lint` | oxlint |
| `pnpm db:push` / `db:generate` / `db:migrate` / `db:studio` | Drizzle schema + studio |
| `pnpm db:seed` | seed the catalog (idempotent) |
| `pnpm db:park --list \| --keep <slug> \| --restore <slug>` | show/hide topics without deleting them |
| `pnpm db:reset-dev` | wipe the Dev Mode test users' data, keep the accounts |
| `pnpm gen:builtins [slug…]` | regenerate the built-in courses with an LLM |
| `pnpm tauri <cmd>` / `cap <cmd>` | desktop / mobile shells |
| `pnpm tauri:build:prod` / `cap:sync:prod` | the **shipping** native builds |

## Deploy

One Vercel project, Root Directory `apps/site`. The Vercel adapter bundles every route — API and applet — into a single function. Canonical origin is the apex `fullstackwolfpack.com`; `www` 308-redirects to it, and `SITE_ORIGIN` must be the apex or Better Auth will build email links and redirects against the wrong host.

**The database is not part of a deploy.** Schema changes need `db:push` against production, and regenerated course content needs `db:seed` — neither happens automatically. See the runbook below.

## Docs

- [Catalog & seeding runbook](docs/catalog-runbook.md) — how built-in courses reach the database, parking topics, and the production steps a deploy does *not* do
- [Roadmap](docs/ROADMAP.md) — every track, shipped vs left
- [Data model](docs/data-model.md) — domains and table layout
- [Education system](docs/education-system.md) — generation, grading, adaptive difficulty
- [ROM licensing](docs/rom-licensing.md) — what ships in the arcade and why
- [`CLAUDE.md`](CLAUDE.md) — architecture notes and conventions in depth
