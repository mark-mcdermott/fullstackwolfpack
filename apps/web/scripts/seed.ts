import process from 'node:process'
import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import {
  achievements,
  courses,
  exercises,
  lessonSegments,
  lessons,
  levels,
  quizQuestions,
  topics,
} from '../src/db/schema'
import { BUILTIN_COURSES } from '../src/db/seed-content'
import {
  SEED_ACHIEVEMENTS,
  SEED_LEVELS,
  SEED_TOPICS,
} from '../src/db/seed-data'

// Idempotent catalog seed. Run after `npm run db:push`, with DATABASE_URL set.
// `npm run db:seed` loads .env automatically.
async function main() {
  console.log('Seeding catalog…')

  // `--refresh-builtins` wipes the shared built-in courses first (cascades to
  // their lessons/segments/exercises/questions AND any user progress on them),
  // so the insert-only seed below re-creates them from the current seed content.
  // Use after regenerating seed-content.generated.ts to push new built-in
  // content (e.g. exercises/glossaries) live. Owned AI courses are untouched.
  if (process.argv.includes('--refresh-builtins')) {
    const deleted = await db
      .delete(courses)
      .where(eq(courses.source, 'builtin'))
      .returning({ id: courses.id })
    console.log(
      `Refresh: deleted ${deleted.length} existing built-in course(s) before reseed.`,
    )
  }

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

  // Built-in shared courses (ownerUserId = null). Fixed ids → idempotent.
  let seededCourses = 0
  for (const course of BUILTIN_COURSES) {
    const [topic] = await db
      .select({ id: topics.id })
      .from(topics)
      .where(eq(topics.slug, course.topicSlug))
    if (!topic) continue

    await db
      .insert(courses)
      .values({
        id: course.id,
        topicId: topic.id,
        ownerUserId: null,
        source: 'builtin',
        difficulty: course.difficulty,
        status: 'ready',
      })
      .onConflictDoNothing({ target: courses.id })

    let lessonOrder = 0
    for (const lesson of course.lessons) {
      await db
        .insert(lessons)
        .values({
          id: lesson.id,
          courseId: course.id,
          orderIndex: lessonOrder++,
          title: lesson.title,
          estMinutes: lesson.estMinutes,
          glossary: lesson.glossary ?? null,
        })
        .onConflictDoNothing({ target: lessons.id })

      let segOrder = 0
      for (const seg of lesson.segments) {
        await db
          .insert(lessonSegments)
          .values({
            id: seg.id,
            lessonId: lesson.id,
            orderIndex: segOrder++,
            type: seg.type,
            title: seg.title,
            content: { markdown: seg.markdown },
            estMinutes: seg.estMinutes,
          })
          .onConflictDoNothing({ target: lessonSegments.id })

        for (const q of seg.questions) {
          await db
            .insert(quizQuestions)
            .values({
              id: q.id,
              segmentId: seg.id,
              type: q.type ?? 'mcq',
              prompt: q.prompt,
              options: q.options ?? null,
              correctIndex: q.correctIndex ?? null,
              expectedAnswer: q.expectedAnswer ?? null,
              explanation: q.explanation,
            })
            .onConflictDoNothing({ target: quizQuestions.id })
        }

        if (seg.exercise) {
          await db
            .insert(exercises)
            .values({
              id: seg.exercise.id,
              segmentId: seg.id,
              prompt: seg.exercise.prompt,
              language: seg.exercise.language ?? 'js',
              starterCode: seg.exercise.starterCode,
              tests: seg.exercise.tests,
              solution: seg.exercise.solution,
              hint: seg.exercise.hint,
            })
            .onConflictDoNothing({ target: exercises.id })
        }
      }
    }
    seededCourses++
  }

  console.log(
    `Seeded ${SEED_TOPICS.length} topics, ${SEED_ACHIEVEMENTS.length} achievements, ${SEED_LEVELS.length} levels, ${seededCourses} built-in course(s).`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
