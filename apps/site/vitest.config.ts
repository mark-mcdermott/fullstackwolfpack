import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// The React app (relocated from apps/web) lives at src/app/*; its colocated
// unit tests run here with the same `@`/`@fw/ui` aliases they always used.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src/app'),
      '@fw/ui': path.resolve(import.meta.dirname, '../../packages/ui/src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/app/test/setup.ts',
    include: ['src/app/**/*.test.{ts,tsx}'],
    css: false,
  },
})
