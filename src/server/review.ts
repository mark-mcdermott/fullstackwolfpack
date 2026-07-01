import { and, asc, eq, inArray, lte } from 'drizzle-orm'
import {
  newCard,
  ratingFromQuiz,
  schedule,
  type ReviewCard,
} from '../core/review'
import type { DueReview, ReviewQueue, ReviewResult } from '../core/review-view'
import { db } from '../db'
import { quizQuestions, reviewCards, reviewLogs } from '../db/schema'

// Server-only persistence for the spaced-repetition system. Thin Drizzle that composes
// the pure, unit-tested scheduler in core/review.ts. Mirrors server/learning.ts.

const DUE_LIMIT = 30
type CardRow = typeof reviewCards.$inferSelect

// row -> pure ReviewCard (core/review.ts works in ISO strings for dates).
function toCard(row: CardRow): ReviewCard {
  return {
    interval: row.interval,
    repetitions: row.repetitions,
    efactor: row.efactor,
    reps: row.reps,
    lapses: row.lapses,
    due: row.due.toISOString(),
    lastReviewedAt: row.lastReviewedAt?.toISOString() ?? null,
  }
}

// The persisted columns for a pure ReviewCard.
function cardValues(c: ReviewCard) {
  return {
    interval: c.interval,
    repetitions: c.repetitions,
    efactor: c.efactor,
    reps: c.reps,
    lapses: c.lapses,
    due: new Date(c.due),
    lastReviewedAt: c.lastReviewedAt ? new Date(c.lastReviewedAt) : null,
  }
}

// Seed a first review card when a question is first answered (called from
// submitAnswer). Create-if-absent — an existing card belongs to the review flow, so we
// don't reset it here.
export async function seedReviewCard(
  userId: string,
  itemId: string,
  correct: boolean,
  now: Date = new Date(),
): Promise<void> {
  const { card, log } = schedule(newCard(now), ratingFromQuiz(correct), now)
  const [inserted] = await db
    .insert(reviewCards)
    .values({ userId, itemType: 'quiz_question', itemId, ...cardValues(card) })
    .onConflictDoNothing({
      target: [reviewCards.userId, reviewCards.itemType, reviewCards.itemId],
    })
    .returning({ id: reviewCards.id })
  if (inserted) {
    await db.insert(reviewLogs).values({
      cardId: inserted.id,
      rating: log.rating,
      interval: log.interval,
      efactor: log.efactor,
    })
  }
}

// The user's due reviews, soonest-first (capped). Quiz items are hydrated with their
// prompt + options; the answer key is never included.
export async function getDueReviews(
  userId: string,
  now: Date = new Date(),
): Promise<ReviewQueue> {
  const rows = await db
    .select({
      cardId: reviewCards.id,
      itemType: reviewCards.itemType,
      itemId: reviewCards.itemId,
    })
    .from(reviewCards)
    .where(and(eq(reviewCards.userId, userId), lte(reviewCards.due, now)))
    .orderBy(asc(reviewCards.due))
    .limit(DUE_LIMIT)

  const quizIds = rows
    .filter((r) => r.itemType === 'quiz_question')
    .map((r) => r.itemId)
  const questions = quizIds.length
    ? await db
        .select({
          id: quizQuestions.id,
          prompt: quizQuestions.prompt,
          options: quizQuestions.options,
        })
        .from(quizQuestions)
        .where(inArray(quizQuestions.id, quizIds))
    : []
  const byId = new Map(questions.map((q) => [q.id, q]))

  const reviews: DueReview[] = rows.flatMap((r) => {
    if (r.itemType !== 'quiz_question') return [] // concept/lesson not wired yet
    const q = byId.get(r.itemId)
    if (!q) return [] // question was deleted — skip
    return [
      {
        cardId: r.cardId,
        itemType: r.itemType,
        itemId: r.itemId,
        prompt: q.prompt,
        options: q.options ?? undefined,
      },
    ]
  })

  return { reviews, dueCount: reviews.length }
}

// Grade a due review: MCQ correctness → rating → reschedule → persist.
export async function gradeReview(
  userId: string,
  cardId: string,
  selectedIndex: number,
  now: Date = new Date(),
): Promise<ReviewResult | null> {
  const [row] = await db
    .select()
    .from(reviewCards)
    .where(and(eq(reviewCards.id, cardId), eq(reviewCards.userId, userId)))
  if (!row || row.itemType !== 'quiz_question') return null

  const [q] = await db
    .select({
      correctIndex: quizQuestions.correctIndex,
      explanation: quizQuestions.explanation,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.id, row.itemId))
  if (!q || q.correctIndex === null) return null

  const correct = selectedIndex === q.correctIndex
  const rating = ratingFromQuiz(correct)
  const { card, log } = schedule(toCard(row), rating, now)

  await db.update(reviewCards).set(cardValues(card)).where(eq(reviewCards.id, cardId))
  await db.insert(reviewLogs).values({
    cardId,
    rating: log.rating,
    interval: log.interval,
    efactor: log.efactor,
  })

  return {
    cardId,
    correct,
    correctIndex: q.correctIndex,
    explanation: q.explanation ?? null,
    rating,
    nextDueAt: card.due,
  }
}
