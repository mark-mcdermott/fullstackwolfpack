import { existsSync } from 'node:fs'
import { rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { solutionPassesTests } from '../src/app/core/exercise'
import { COURSE_TARGET, type Difficulty } from '../src/app/core/generation'
import { gitSolutionSatisfiesGoals } from '../src/app/core/git-sim'
import { pythonSolutionPasses } from '../src/app/server/python-gate'
import { generatedToSeedCourse } from '../src/app/db/generated-to-seed'
import { BUILTIN_COURSES, type SeedCourse } from '../src/app/db/seed-content'
import { GENERATED_BUILTIN_COURSES } from '../src/app/db/seed-content.generated'
import { SEED_TOPICS } from '../src/app/db/seed-data'
import { anthropicGenerator } from '../src/app/server/anthropic-generator'
import { openAiGenerator } from '../src/app/server/openai-generator'

// Optional per-course syllabus, keyed by `slug:difficulty`. Passed to the
// generator as `customization` to steer topic + ordering. Absent ⇒ the model
// chooses its own outline.
const SYLLABI: Record<string, string> = {
  'javascript:intermediate': [
    'Write a focused INTERMEDIATE JavaScript course for a developer who already knows the basics (variables, functions, loops, arrays/objects) and wants to level up. Cover, roughly in this order — one lesson each:',
    '1. Scope & closures (lexical scope, closures, the classic loop-counter gotcha and its fix).',
    '2. IIFEs & the module pattern (why they existed, encapsulation before ES modules).',
    '3. Modules: ES modules (import/export) vs CommonJS (require/module.exports) — syntax and when each is used.',
    '4. `this` & binding (call/apply/bind, how arrow functions capture `this`).',
    '5. Promises (creating them, then/catch/finally, Promise.all vs Promise.race).',
    '6. async/await (sugar over promises, error handling with try/catch).',
    '7. Higher-order functions (callbacks, map/filter/reduce).',
    '8. Destructuring, spread/rest, and default parameters.',
    '9. Error handling (throw, try/catch/finally, custom Error subclasses).',
    'Every lesson MUST include a runnable JavaScript code exercise and at least one multiple-choice question. Do NOT use short-answer questions (they need AI grading). Keep examples practical and idiomatic.',
  ].join('\n'),
}

// Topics whose learners actually write JavaScript — the only place a JS-runner
// exercise belongs. The prompt asks the model to omit exercises elsewhere, but it
// occasionally ignores that (e.g. a JS exercise in a Python course), so enforce it.
const JS_EXERCISE_SLUGS = new Set([
  'javascript',
  'typescript',
  'react',
  'nodejs',
  'nextjs',
])
// Topics where a terminal/git exercise (core/git-sim.ts) belongs.
const GIT_EXERCISE_SLUGS = new Set(['git-github'])
// Topics whose exercises run on Pyodide.
const PYTHON_EXERCISE_SLUGS = new Set(['python'])

// Prune a course's exercises by topic + validity: keep a js/ts exercise only on a
// JS topic whose solution passes its tests, a git exercise only on a git topic
// whose solution satisfies its goals, and a python exercise only on a python topic
// whose solution passes (executed on Pyodide) — so the committed built-ins always
// pass the ship gates. Mutates.
async function pruneExercises(
  course: SeedCourse,
  slug: string,
): Promise<{ kept: number; dropped: number }> {
  const allowJs = JS_EXERCISE_SLUGS.has(slug)
  const allowGit = GIT_EXERCISE_SLUGS.has(slug)
  const allowPython = PYTHON_EXERCISE_SLUGS.has(slug)
  let kept = 0
  let dropped = 0
  for (const lesson of course.lessons) {
    for (const seg of lesson.segments) {
      if (!seg.exercise) continue
      const ex = seg.exercise
      let ok: boolean
      if (ex.kind === 'git') {
        ok = allowGit && gitSolutionSatisfiesGoals(ex.setup, ex.solution, ex.goals)
      } else if (ex.language === 'python') {
        ok = allowPython && (await pythonSolutionPasses(ex.solution, ex.tests))
      } else {
        ok = allowJs && solutionPassesTests(ex.solution, ex.tests, ex.language)
      }
      if (ok) kept++
      else {
        delete seg.exercise
        dropped++
      }
    }
  }
  return { kept, dropped }
}

// Generate beginner "dive-in" starter courses for topics that lack a built-in
// one, then write them to src/db/seed-content.generated.ts for review + commit.
// Leverages the same generation pipeline the app uses at runtime.
//
//   npm run gen:builtins                 # fill every topic missing a built-in
//   npm run gen:builtins docker python   # (re)generate just these slugs
//   npm run gen:builtins all             # regenerate every non-hand-authored topic
//
// Provider (in .env; npm run loads it): prefers Claude when ANTHROPIC_API_KEY is
// set — it's far better at emitting correct runnable exercises — else OpenAI.
// Force with GEN_PROVIDER=anthropic|openai. Models: ANTHROPIC_GEN_MODEL (default
// claude-opus-4-8) / OPENAI_MODEL (default gpt-4o). This content ships to every
// user and is generated once, so it uses the strongest model, not the cheap tier.

// Must match the module this script imports GENERATED_BUILTIN_COURSES from at
// the top. It did not: the app moved from apps/web/src to apps/site/src/app and
// the import came with it while this path stayed on the old shape, so a run
// would generate a whole course and then fail writing it.
const OUT_PATH = fileURLToPath(
  new URL('../src/app/db/seed-content.generated.ts', import.meta.url),
)

const HEADER = `/* eslint-disable */
// AUTO-GENERATED by scripts/gen-builtins.ts — do not edit by hand.
// Regenerate (needs OPENAI_API_KEY in .env): npm run gen:builtins [topic-slug ...]
// These are beginner "dive-in" starter courses so every topic card is instant
// and key-free; users wanting a harder/custom course pick a level and generate.
import type { SeedCourse } from './seed-content'

export const GENERATED_BUILTIN_COURSES: SeedCourse[] = `

// Check the write target before spending a generation on it. The path bug this
// guards cost a full 7-lesson run against the strongest model before throwing.
async function assertWritable(): Promise<void> {
  const dir = dirname(OUT_PATH)
  if (!existsSync(dir)) {
    throw new Error(
      `Output directory does not exist: ${dir}\n` +
        `OUT_PATH in this script is out of step with the repo layout — fix it ` +
        `before generating, or the run is wasted.`,
    )
  }
}

async function main() {
  await assertWritable()
  // Prefer Claude — it's far stronger at emitting correct runnable exercises
  // (gpt-4o's were ~57% broken here). Falls back to OpenAI; force either with
  // GEN_PROVIDER=anthropic|openai. Models override via ANTHROPIC_GEN_MODEL /
  // OPENAI_MODEL.
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const provider =
    process.env.GEN_PROVIDER ?? (anthropicKey ? 'anthropic' : 'openai')

  let generator
  let model: string
  if (provider === 'anthropic') {
    if (!anthropicKey) {
      console.error('ANTHROPIC_API_KEY is not set (add it to apps/site/.env).')
      process.exit(1)
    }
    model = process.env.ANTHROPIC_GEN_MODEL ?? 'claude-opus-4-8'
    generator = anthropicGenerator(anthropicKey, { model })
  } else {
    if (!openaiKey) {
      console.error('OPENAI_API_KEY is not set (add it to apps/site/.env).')
      process.exit(1)
    }
    model = process.env.OPENAI_MODEL ?? 'gpt-4o'
    generator = openAiGenerator(openaiKey, { model })
  }

  const rawArgs = process.argv.slice(2)
  const forceAll = rawArgs.some(
    (a) => a === 'all' || a === '--all' || a === '--force',
  )
  const slugArgs = rawArgs.filter((a) => !a.startsWith('--') && a !== 'all')
  const bySlug = new Map(SEED_TOPICS.map((t) => [t.slug, t]))

  // Optional `--difficulty=beginner|intermediate|advanced` (default beginner) —
  // the level the generated course is written at (drives depth + the syllabus).
  const difficultyArg = rawArgs
    .find((a) => a.startsWith('--difficulty='))
    ?.split('=')[1]
  const difficulty: Difficulty = ['intermediate', 'advanced'].includes(
    difficultyArg ?? '',
  )
    ? (difficultyArg as Difficulty)
    : 'beginner'

  // Hand-authored built-ins (e.g. git-github) live in seed-content.ts, not the
  // generated file — `all` regenerates everything except those.
  const generatedSlugs = new Set(GENERATED_BUILTIN_COURSES.map((c) => c.topicSlug))
  const handAuthored = new Set(
    BUILTIN_COURSES.filter((c) => !generatedSlugs.has(c.topicSlug)).map(
      (c) => c.topicSlug,
    ),
  )

  let targets: string[]
  if (forceAll) {
    targets = SEED_TOPICS.filter((t) => !handAuthored.has(t.slug)).map((t) => t.slug)
  } else if (slugArgs.length > 0) {
    const unknown = slugArgs.filter((s) => !bySlug.has(s))
    if (unknown.length > 0) {
      console.error(`Unknown topic slug(s): ${unknown.join(', ')}`)
      process.exit(1)
    }
    targets = slugArgs
  } else {
    const covered = new Set(BUILTIN_COURSES.map((c) => c.topicSlug))
    targets = SEED_TOPICS.filter((t) => !covered.has(t.slug)).map((t) => t.slug)
  }

  if (targets.length === 0) {
    console.log('Every topic already has a built-in course — nothing to generate.')
    console.log('Pass slugs (or `all`) to force regeneration, e.g. `npm run gen:builtins docker` / `npm run gen:builtins all`.')
    process.exit(0)
  }

  console.log(
    `Generating ${targets.length} ${difficulty} course(s) with ${model}…`,
  )
  const generated = new Map<string, SeedCourse>()
  const failed: string[] = []
  const MAX_ATTEMPTS = 4

  for (const slug of targets) {
    const topic = bySlug.get(slug)!
    process.stdout.write(`  • ${topic.name} (${slug})… `)
    // Re-roll up to MAX_ATTEMPTS. Each attempt is independent: a generation or
    // JSON-parse failure (the model occasionally emits malformed JSON on large
    // code-heavy courses) just moves to the next attempt rather than failing the
    // whole topic. Otherwise keep the deepest attempt, accepting early once it
    // hits the lesson target. Exercises whose solution fails their own tests are
    // dropped on each attempt.
    let best: SeedCourse | null = null
    let bestKept = 0
    let bestDropped = 0
    let lastErr: unknown = null
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let course: SeedCourse
      try {
        const raw = await generator.generate({
          topic: topic.name,
          difficulty,
          customization: SYLLABI[`${slug}:${difficulty}`],
        })
        course = generatedToSeedCourse(slug, difficulty, raw)
      } catch (err) {
        lastErr = err
        continue
      }
      const { kept, dropped } = await pruneExercises(course, slug)
      if (!best || course.lessons.length > best.lessons.length) {
        best = course
        bestKept = kept
        bestDropped = dropped
      }
      if (course.lessons.length >= COURSE_TARGET.minLessons) break
    }
    if (best) {
      generated.set(slug, best)
      const exNote =
        bestKept || bestDropped
          ? `, ${bestKept} exercise(s)${bestDropped ? ` (+${bestDropped} broken dropped)` : ''}`
          : ''
      console.log(`ok (${best.lessons.length} lessons${exNote})`)
    } else {
      failed.push(slug)
      console.log(
        `FAILED — ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
      )
    }
  }

  // Merge: replace regenerated slugs, keep other existing generated courses,
  // and order by the topic catalog for stable diffs.
  const merged = new Map<string, SeedCourse>(
    GENERATED_BUILTIN_COURSES.map((c) => [c.topicSlug, c]),
  )
  for (const [slug, course] of generated) merged.set(slug, course)
  // Order by the topic catalog for stable diffs, then APPEND any generated
  // course whose topic isn't currently in SEED_TOPICS (e.g. temporarily pruned)
  // so a targeted run never drops other topics' committed courses.
  const catalogSlugs = new Set(SEED_TOPICS.map((t) => t.slug))
  const inCatalog = SEED_TOPICS.map((t) => merged.get(t.slug)).filter(
    (c): c is SeedCourse => c !== undefined,
  )
  const extras = [...merged.values()].filter(
    (c) => !catalogSlugs.has(c.topicSlug),
  )
  const ordered = [...inCatalog, ...extras]

  // Write atomically (temp + rename) so an interrupted run can never leave the
  // committed file truncated — which would brick the next run, since this script
  // imports GENERATED_BUILTIN_COURSES from it at startup.
  const tmpPath = `${OUT_PATH}.tmp`
  await writeFile(tmpPath, HEADER + JSON.stringify(ordered, null, 2) + '\n')
  await rename(tmpPath, OUT_PATH)
  console.log(`\nWrote ${ordered.length} course(s) to ${OUT_PATH}`)
  console.log('Review the content, then `npm run lint` + commit.')
  if (failed.length > 0) {
    console.error(`\n${failed.length} topic(s) failed: ${failed.join(', ')}`)
    process.exit(1)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
