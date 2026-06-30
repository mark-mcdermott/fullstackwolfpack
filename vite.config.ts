import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { devApi } from './dev-api.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env into process.env so the dev API handlers (db, session) can read
  // server-side vars like DATABASE_URL. Vite only exposes VITE_* to the client
  // via import.meta.env — these stay server-side and never hit the bundle.
  // Real shell/platform env wins (Vercel sets these itself in production).
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    process.env[key] ??= value
  }

  return {
    plugins: [react(), tailwindcss(), devApi()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
