import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Single Astro deployment: static marketing/content/auth pages, the React app
// mounted as a `client:only` applet under /app, and (Phase 3) the /api/* routes
// as Astro endpoints. The React app lives at src/app/* and keeps its `@/…`
// imports intact via the alias below. Shares the FW-01 design system via @fw/ui.
// See docs/astro-merge-plan.md.
export default defineConfig({
  integrations: [react()],
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
