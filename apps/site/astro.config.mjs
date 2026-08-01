import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

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
  },
})
