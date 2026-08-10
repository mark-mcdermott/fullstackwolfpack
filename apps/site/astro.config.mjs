import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Load .env into process.env so the API endpoints (db, session, crypto) can read
// server-side vars like DATABASE_URL/AUTH_SECRET under `astro dev`. Vite only
// exposes VITE_* to import.meta.env — these stay server-side. Real platform env
// wins (Vercel sets these itself in production); no .env there is a no-op.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')
for (const [key, value] of Object.entries(env)) process.env[key] ??= value

// Single Astro deployment: static marketing/content/auth pages (prerendered),
// the React app mounted as a `client:only` applet, and (Phase 3) the /api/*
// routes as Astro endpoints. Static by default; only routes that opt out with
// `export const prerender = false` (the applet catch-all, the API) become
// on-demand Vercel functions. The React app lives at src/app/* and keeps its
// `@/…` imports intact via the alias below. See docs/astro-merge-plan.md.
export default defineConfig({
  integrations: [react()],
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src/app'),
        '@fw/ui': path.resolve(import.meta.dirname, '../../packages/ui/src'),
      },
    },
    optimizeDeps: {
      // `nostalgist` is reached only through a dynamic import inside the
      // player's launch path (lib/emulator.ts), so Vite's initial scan never
      // sees it. In dev that meant the *first* attempt to start a ROM was what
      // triggered discovery: Vite re-optimized, the already-loaded page was
      // left holding a stale `?v=` hash, and the import rejected with a 504
      // "Outdated Optimize Dep" — which the player surfaced as "couldn't start
      // this game" in both the Arcade and Mission lanes. Pre-bundling it at
      // startup means the hash is stable before anyone can click Play.
      // Dev-only: the production build bundles the dynamic chunk normally.
      // CodeMirror is the same shape of problem: `code-exercise.tsx` reaches the
      // editor through `lazy(() => import('./code-editor'))`, and Vite's scanner
      // does not follow a lazy chunk's own imports — so the three packages below
      // were only discovered when a lesson with an exercise first rendered. The
      // re-optimize left the loaded page on a stale `?v=` hash and the dynamic
      // import 504'd, which took the whole lesson down with it.
      include: [
        'nostalgist',
        'codemirror',
        '@codemirror/lang-javascript',
        '@codemirror/lang-python',
      ],
    },
  },
})
