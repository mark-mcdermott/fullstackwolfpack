import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Static public site (SSG) — zero serverless functions. Shares the FW-01 design
// system via the @fw/ui workspace alias (source, so the Vite pipeline transforms
// it). The logged-in app (apps/web) is deployed under /app; see the migration plan.
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@fw/ui': path.resolve(import.meta.dirname, '../../packages/ui/src'),
      },
    },
  },
})
