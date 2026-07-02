// Bundle the Vercel serverless functions into self-contained ESM.
//
// The api/ functions use bundler-style imports (extensionless, directory, and
// importing uncompiled src/*.ts). With package.json "type":"module", Vercel
// runs them as native ESM and cannot resolve those imports
// (ERR_MODULE_NOT_FOUND / ERR_UNSUPPORTED_DIR_IMPORT). esbuild inlines every
// local import (src/* and api/_lib/*) into each function, leaving only
// node_modules imports (resolved at runtime) — so each function becomes valid
// standalone ESM that Vercel can run.
//
// Runs ONLY on Vercel (guarded by $VERCEL). Locally, `npm run build` and the
// Vite dev API plugin keep using the .ts sources untouched.
import { build } from 'esbuild'
import { readdirSync, statSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const API_DIR = 'api'
const OUT_DIR = process.env.BUNDLE_API_OUT ?? API_DIR

if (!process.env.VERCEL && !process.env.BUNDLE_API_OUT) {
  console.log('[bundle-api] not on Vercel — skipping (local uses .ts sources)')
  process.exit(0)
}

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

const allTs = walk(API_DIR).filter(
  (f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('.test.ts'),
)
// Routed functions: no path segment starts with '_' (Vercel does not route
// underscore-prefixed files; they're helpers and get inlined into the bundles).
const routed = allTs.filter(
  (f) => !f.split('/').some((seg) => seg.startsWith('_')),
)

console.log(`[bundle-api] bundling ${routed.length} functions → ${OUT_DIR}`)
await build({
  entryPoints: routed,
  outdir: OUT_DIR,
  outbase: API_DIR,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  packages: 'external',
  logLevel: 'warning',
})

// Only mutate the tree for the real in-place build (on Vercel), not test runs.
if (OUT_DIR === API_DIR) {
  for (const f of allTs) rmSync(f)
  console.log(`[bundle-api] removed ${allTs.length} .ts sources; Vercel packages the bundled .js`)
}
