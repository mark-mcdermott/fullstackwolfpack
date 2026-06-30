import process from 'node:process'
import { db } from '../src/db'
import { achievements, levels, topics } from '../src/db/schema'
import {
  SEED_ACHIEVEMENTS,
  SEED_LEVELS,
  SEED_TOPICS,
} from '../src/db/seed-data'

// Idempotent catalog seed. Run after `npm run db:push`, with DATABASE_URL set.
// `npm run db:seed` loads .env automatically.
async function main() {
  console.log('Seeding catalog…')

  await db
    .insert(topics)
    .values(SEED_TOPICS)
    .onConflictDoNothing({ target: topics.slug })

  await db
    .insert(achievements)
    .values(SEED_ACHIEVEMENTS)
    .onConflictDoNothing({ target: achievements.slug })

  await db
    .insert(levels)
    .values(SEED_LEVELS)
    .onConflictDoNothing({ target: levels.level })

  console.log(
    `Seeded ${SEED_TOPICS.length} topics, ${SEED_ACHIEVEMENTS.length} achievements, ${SEED_LEVELS.length} levels.`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
