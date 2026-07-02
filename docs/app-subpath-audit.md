# Serving the app under `/app` — code prep + link audit

Companion to `astro-migration-plan.md` **step 7** ("root serves Astro; `/app/*` +
`/api/*` rewrite to the React app"). This covers the **`apps/web` code side**; the
Vercel dashboard side is a checklist at the bottom.

## Mechanism

The app already namespaces every logged-in route as `/app/*` (`App.tsx`), so we do
**not** need a React Router `basename` — the literal paths already match when the
SPA is served under `/app`. Adding `basename="/app"` would actually double-prefix
(`/app/app/topics`). Two things make the SPA work under a subpath:

1. **Vite `base`** — `apps/web/vite.config.ts` reads `VITE_APP_BASE` (default `/`).
   Set it to `/app/` in the web Vercel project so built asset URLs emit as
   `/app/assets/*` instead of `/assets/*` (which the Astro site now owns).
   - ⚠️ **Native builds must NOT set it.** Capacitor/Tauri load assets from a
     non-HTTP root; a `/app/` base white-screens them. They build with the default
     `/`, so just never set `VITE_APP_BASE` for native.
   - Router needs no change: the SPA runs client-side, so `<Link>`/`navigate` to
     literal `/app/...` paths keep matching. Hard-refresh/deep-link relies on the
     server returning the SPA shell for `/app/*` (see Vercel step 4).

## Link audit — all 30 absolute-path navigations in `apps/web/src`

Classified by what happens once Astro owns the root and the app lives at `/app`.

### A. In-app — NO CHANGE (react-router `<Link>`/`<Navigate>`, matches under `/app`)
16 links. They target `/app/*`, `/login`, `/signup`, `/admin` — all app-owned.
Client-side nav keeps working; hard-refresh at `/login` `/signup` `/admin` needs
the site to rewrite those to the app too (Vercel step 3).

- `components/layout/guards.tsx:9,17` → `/login`
- `components/layout/guards.tsx:18` → `/app`
- `pages/auth-page.tsx:9` → `/app`
- `pages/app/review.tsx:185` → `/app`
- `pages/app/dashboard.tsx:35,61` → `/app/topics`
- `pages/app/dashboard.tsx:91` → `/app/progress`
- `pages/app/learn.tsx:95,196` → `/app/topics`
- `pages/app/sessions.tsx:70,99` → `/app/topics`
- `pages/not-found.tsx:30` → `/app/topics`
- `components/rom-player.tsx:238` → `/app/settings`
- `components/layout/sidebar.tsx:55` + `components/layout/mobile-nav.tsx:80` → `/admin`

### B. Cross-to-site — CONVERT `<Link>` → `<a href>` (do this WITH migration step 5)
7 links in **surviving** app files that point at pages Astro will own. Once step 5
deletes the SPA's marketing routes, react-router can no longer resolve these, so
they must become full-document links to the Astro site. Deferred to step 5 because
until the marketing routes leave the SPA these still resolve in-app; converting
early only trades client-nav for a full reload with no benefit.

- `pages/auth-page.tsx:16,33,38` → `/` (back to Astro home)
- `pages/not-found.tsx:24` → `/` (Astro home)
- `components/learn/tutor-panel.tsx:34` → `/pricing`
- `pages/app/review.tsx:209` → `/pricing`
- `pages/app/settings.tsx:158` → `/pricing`

### C. Inside marketing files that get DELETED in step 5 — NO ACTION
7 links; the whole file is removed when marketing moves to Astro.

- `components/layout/marketing-header.tsx:17,41,47` (+ `marketing-layout.tsx`)
- `pages/public/home.tsx:35,41,97`
- `pages/public/pricing.tsx:43`

## Done on branch `refactor/app-base-path`
- [x] `vite.config.ts` — env-gated, native-safe `base` (`VITE_APP_BASE || '/'`).
- [x] This audit.
- [ ] (step 5, later) Category-B link conversions + delete `pages/public/*`,
      `marketing-layout.tsx`, `marketing-header.tsx`, and their `App.tsx` routes.

## Vercel checklist (dashboard — do this, then set the env var)
See the message that accompanied this doc / the PR description for the exact
click-path. Summary: two projects on one domain —

1. **App project** (existing): Root Directory `apps/web`; add env `VITE_APP_BASE=/app/`.
2. **App project** SPA fallback: rewrite `/app/(.*)` → `/index.html` if deep-link
   refresh 404s (Vite preset usually covers it).
3. **Site project** (new): Root Directory `apps/site`, framework Astro; owns the
   real domain.
4. **Site project** `vercel.json` rewrites `/app`, `/app/:path*`, `/api/:path*`,
   `/login`, `/signup` → the app deployment.
5. Move the custom domain to the site project; keep the app project on its
   `*.vercel.app` URL as the rewrite target.
