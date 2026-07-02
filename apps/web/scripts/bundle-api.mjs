// Bundle each Vercel serverless function into self-contained ESM, IN PLACE.
//
// The api/ functions use bundler-style imports (extensionless, directory, and
// uncompiled src/*.ts). With package.json "type":"module", Vercel runs them as
// native ESM and cannot resolve those imports — every request crashes with
// FUNCTION_INVOCATION_FAILED (ERR_MODULE_NOT_FOUND / ERR_UNSUPPORTED_DIR_IMPORT).
//
// esbuild inlines every local import (src/*, api/_lib/*) so only node_modules
// imports remain, then we OVERWRITE each function's source with the bundle,
// keeping the SAME .ts path. Vercel enumerates functions by their source path
// and packages them after the build runs, so the file must still exist —
// renaming or deleting it fails with "File not found". @vercel/node then
// compiles the now self-contained .ts to valid ESM.
//
// Runs only on Vercel (or with BUNDLE_API_DRY=1 for local verification). Local
// dev + the Vite dev API plugin keep using the original .ts sources untouched.
import { build } from 'esbuild'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DRY = process.env.BUNDLE_API_DRY
if (!process.env.VERCEL && !DRY) {
  console.log('[bundle-api] not on Vercel — skipping (local uses .ts sources)')
  process.exit(0)
}

const API_DIR = 'api'

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

// Routed functions: .ts whose every path segment is un-prefixed by '_'
// (Vercel does not route underscore-prefixed files; they're helpers that get
// inlined into the bundles). Skip tests/decls.
const routed = walk(API_DIR).filter(
  (f) =>
    f.endsWith('.ts') &&
    !f.endsWith('.d.ts') &&
    !f.endsWith('.test.ts') &&
    !f.split('/').some((seg) => seg.startsWith('_')),
)

const bundles = []
for (const f of routed) {
  const result = await build({
    entryPoints: [f],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    packages: 'external',
    write: false,
    logLevel: 'warning',
  })
  bundles.push({ file: f, text: result.outputFiles[0].text })
}

if (DRY) {
  const leaks = bundles.filter((b) => /from ['"][^'"]*\/src\//.test(b.text))
  console.log(
    `[bundle-api] DRY: bundled ${bundles.length} functions, ${leaks.length} src-leaks — no files written`,
  )
  for (const b of leaks) console.log(`  LEAK: ${b.file}`)
  process.exit(0)
}

for (const { file, text } of bundles) writeFileSync(file, text)
console.log(
  `[bundle-api] inlined ${bundles.length} functions in place (kept .ts paths for Vercel packaging)`,
)
