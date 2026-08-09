import process from 'node:process'
import { inArray, notInArray } from 'drizzle-orm'
import { db } from '../src/app/db'
import { topics } from '../src/app/db/schema'

// Park / un-park topics in the catalog by flipping `topics.status` — the
// non-destructive way to pare the menu back to a launch set. An archived topic
// keeps its rows, its built-in course and every learner's progress; it just
// drops out of the two galleries (getPublicTopics, getTopicsView). See
// `topicStatus` in src/app/db/schema/catalog.ts.
//
// Nothing here deletes. Bringing a topic back is one run of `--restore`, not a
// re-seed — which matters because scripts/seed.ts inserts with
// onConflictDoNothing, so re-seeding an existing archived row would leave it
// archived.
//
//   npm run db:park -- --list                    show the catalog + status
//   npm run db:park -- --keep javascript         archive everything else
//   npm run db:park -- --restore react docker    bring topics back
//
// Add `--dry-run` to print the change without writing. Target prod by putting
// its DATABASE_URL in .env.prod and running:
//   npx tsx --env-file=.env.prod scripts/park-topics.ts --list

type Mode = { kind: 'list' } | { kind: 'keep' | 'restore'; slugs: string[] }

function parseArgs(argv: string[]): { mode: Mode; dryRun: boolean } {
  const dryRun = argv.includes('--dry-run')
  const flagIndex = argv.findIndex((a) => a === '--keep' || a === '--restore')

  if (argv.includes('--list') || flagIndex === -1) {
    return { mode: { kind: 'list' }, dryRun }
  }
  const kind = argv[flagIndex] === '--keep' ? 'keep' : 'restore'
  const slugs = argv.slice(flagIndex + 1).filter((a) => !a.startsWith('--'))
  if (slugs.length === 0) {
    throw new Error(`--${kind} needs at least one topic slug`)
  }
  return { mode: { kind, slugs }, dryRun }
}

async function listCatalog() {
  const rows = await db
    .select({ slug: topics.slug, name: topics.name, status: topics.status })
    .from(topics)
    .orderBy(topics.name)
  for (const r of rows) {
    const mark = r.status === 'active' ? '●' : '○'
    console.log(`${mark} ${r.slug.padEnd(14)} ${r.status.padEnd(12)} ${r.name}`)
  }
  const active = rows.filter((r) => r.status === 'active').length
  console.log(`\n${active} active / ${rows.length} total`)
  return rows
}

async function main() {
  const { mode, dryRun } = parseArgs(process.argv.slice(2))

  if (mode.kind === 'list') {
    await listCatalog()
    return
  }

  // Guard the typo that would empty the menu: `--keep javscript` matches no row,
  // so every topic would be archived and /skill would render its empty state.
  const known = await db.select({ slug: topics.slug }).from(topics)
  const knownSlugs = new Set(known.map((t) => t.slug))
  const unknown = mode.slugs.filter((s) => !knownSlugs.has(s))
  if (unknown.length > 0) {
    throw new Error(
      `unknown topic slug(s): ${unknown.join(', ')}\nknown: ${[...knownSlugs].sort().join(', ')}`,
    )
  }

  const status = mode.kind === 'keep' ? 'archived' : 'active'
  const where =
    mode.kind === 'keep'
      ? notInArray(topics.slug, mode.slugs)
      : inArray(topics.slug, mode.slugs)

  if (dryRun) {
    const affected = await db
      .select({ slug: topics.slug, status: topics.status })
      .from(topics)
      .where(where)
    const changing = affected.filter((r) => r.status !== status)
    console.log(
      `Dry run — would set status='${status}' on ${changing.length} topic(s): ${
        changing.map((r) => r.slug).join(', ') || '(none)'
      }`,
    )
    return
  }

  const updated = await db
    .update(topics)
    .set({ status })
    .where(where)
    .returning({ slug: topics.slug })
  console.log(
    `Set status='${status}' on ${updated.length} topic(s): ${updated
      .map((r) => r.slug)
      .join(', ')}\n`,
  )
  await listCatalog()
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
