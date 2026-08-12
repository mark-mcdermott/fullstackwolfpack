import { describe, expect, it } from 'vitest'
import {
  dueQueue,
  isDue,
  newCard,
  ratingFromQuiz,
  schedule,
  type ReviewCard,
} from './review'

const at = (iso: string) => new Date(iso)
const day0 = at('2026-06-30T12:00:00.000Z')
const daysBetween = (a: string, b: string) =>
  Math.round(
    (new Date(a).getTime() - new Date(b).getTime()) / (24 * 60 * 60 * 1000),
  )

describe('newCard', () => {
  it('starts unseen and immediately due', () => {
    const c = newCard(day0)
    expect(c.repetitions).toBe(0)
    expect(c.reps).toBe(0)
    expect(c.lapses).toBe(0)
    expect(c.efactor).toBeCloseTo(2.5)
    expect(c.due).toBe(day0.toISOString())
    expect(c.lastReviewedAt).toBeNull()
    expect(isDue(c, day0)).toBe(true)
  })
})

describe('schedule — SM-2 interval progression', () => {
  it('schedules a first correct review 1 day out', () => {
    const { card } = schedule(newCard(day0), 'good', day0)
    expect(card.repetitions).toBe(1)
    expect(card.reps).toBe(1)
    expect(daysBetween(card.due, day0.toISOString())).toBe(1)
  })

  it('schedules a second correct review 6 days out', () => {
    const first = schedule(newCard(day0), 'good', day0).card
    const { card } = schedule(first, 'good', at('2026-07-01T12:00:00.000Z'))
    expect(card.repetitions).toBe(2)
    expect(daysBetween(card.due, '2026-07-01T12:00:00.000Z')).toBe(6)
  })

  it('scales later intervals by the ease factor', () => {
    let card = newCard(day0)
    card = schedule(card, 'good', day0).card // interval 1
    card = schedule(card, 'good', day0).card // interval 6
    const third = schedule(card, 'good', day0)
    // interval ≈ round(6 * efactor); efactor stays 2.5 on 'good'
    expect(third.card.repetitions).toBe(3)
    expect(daysBetween(third.card.due, day0.toISOString())).toBe(
      Math.round(6 * card.efactor),
    )
  })
})

describe('schedule — ease factor updates', () => {
  it("leaves ease unchanged on 'good' and raises it on 'easy'", () => {
    expect(schedule(newCard(day0), 'good', day0).card.efactor).toBeCloseTo(2.5)
    expect(schedule(newCard(day0), 'easy', day0).card.efactor).toBeCloseTo(2.6)
  })

  it("lowers ease on 'hard'", () => {
    expect(schedule(newCard(day0), 'hard', day0).card.efactor).toBeLessThan(2.5)
  })

  it('never lets the ease factor fall below 1.3', () => {
    let card = newCard(day0)
    for (let i = 0; i < 10; i++) card = schedule(card, 'again', day0).card
    expect(card.efactor).toBeGreaterThanOrEqual(1.3)
  })
})

describe("schedule — lapses on 'again'", () => {
  it('resets the streak, counts a lapse, and relearns in minutes not days', () => {
    const learned = schedule(
      schedule(newCard(day0), 'good', day0).card,
      'good',
      day0,
    ).card
    expect(learned.repetitions).toBe(2)

    const { card } = schedule(learned, 'again', day0)
    expect(card.repetitions).toBe(0)
    expect(card.lapses).toBe(1)
    expect(card.reps).toBe(learned.reps + 1)

    // The point of the change: a missed card returns in the same sitting.
    // Textbook SM-2 resets to a day, which made a wrong answer schedule
    // identically to a correct first answer.
    const minutes =
      (new Date(card.due).getTime() - day0.getTime()) / 60_000
    expect(minutes).toBeGreaterThan(0)
    expect(minutes).toBeLessThanOrEqual(15)
    // 0 means "sooner than a day" — the integer column can't hold a fraction,
    // so `due` carries the precision.
    expect(card.interval).toBe(0)
  })

  it('goes back to whole days once the card is passed again', () => {
    const lapsed = schedule(newCard(day0), 'again', day0).card
    const recovered = schedule(lapsed, 'good', day0).card
    expect(recovered.interval).toBe(1)
    expect(daysBetween(recovered.due, day0.toISOString())).toBe(1)
  })
})

describe('isDue / dueQueue', () => {
  const mk = (due: string): ReviewCard => ({ ...newCard(day0), due })

  it('is due when the due time has passed', () => {
    expect(isDue(mk('2026-06-30T11:59:00.000Z'), day0)).toBe(true)
    expect(isDue(mk('2026-06-30T12:00:01.000Z'), day0)).toBe(false)
  })

  it('returns only due cards, soonest-due first', () => {
    const cards = [
      mk('2026-07-05T12:00:00.000Z'), // not due
      mk('2026-06-29T12:00:00.000Z'), // due (older)
      mk('2026-06-30T00:00:00.000Z'), // due (newer)
    ]
    const queue = dueQueue(cards, day0)
    expect(queue).toHaveLength(2)
    expect(queue[0].due).toBe('2026-06-29T12:00:00.000Z')
    expect(queue[1].due).toBe('2026-06-30T00:00:00.000Z')
  })
})

describe('ratingFromQuiz — bridge from the existing quiz flow', () => {
  it("maps a wrong answer to 'again'", () => {
    expect(ratingFromQuiz(false)).toBe('again')
    expect(ratingFromQuiz(false, 1000)).toBe('again')
  })

  it("maps a correct answer to 'good', or 'easy' when answered fast", () => {
    expect(ratingFromQuiz(true)).toBe('good')
    expect(ratingFromQuiz(true, 8000)).toBe('good')
    expect(ratingFromQuiz(true, 2000)).toBe('easy')
  })
})
