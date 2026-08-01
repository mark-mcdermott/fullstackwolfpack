import { describe, expect, it, vi } from 'vitest'

// course-resolver.ts imports the Neon db client (which reads DATABASE_URL at
// load); stub it since pickActiveCourseId is pure and never touches the db.
vi.mock('../db', () => ({ db: {} }))

const { pickActiveCourseId, summarizeTracks } = await import('./course-resolver')

const c = (id: string, difficulty: string, status = 'ready') =>
  ({ id, difficulty, status }) as Parameters<typeof summarizeTracks>[0][number]

describe('pickActiveCourseId', () => {
  it('honors the active pointer when it is still visible', () => {
    expect(pickActiveCourseId('b', ['a', 'b', 'c'])).toBe('b')
  })

  it('falls back to the newest (first) visible course when the pointer is null', () => {
    expect(pickActiveCourseId(null, ['newest', 'older'])).toBe('newest')
  })

  it('treats an undefined pointer like null', () => {
    expect(pickActiveCourseId(undefined, ['newest', 'older'])).toBe('newest')
  })

  it('falls back to newest when the pointer is no longer visible (deleted / not owned)', () => {
    expect(pickActiveCourseId('gone', ['newest', 'older'])).toBe('newest')
  })

  it('returns null when there are no visible courses', () => {
    expect(pickActiveCourseId('x', [])).toBeNull()
    expect(pickActiveCourseId(null, [])).toBeNull()
  })
})

describe('summarizeTracks', () => {
  it('marks the newest visible course active when no pointer is set', () => {
    const { activeDifficulty, tracks } = summarizeTracks(
      [c('a', 'advanced'), c('b', 'beginner')],
      null,
    )
    expect(activeDifficulty).toBe('advanced')
    expect(tracks.find((t) => t.difficulty === 'advanced')?.active).toBe(true)
    expect(tracks.find((t) => t.difficulty === 'beginner')?.active).toBe(false)
  })

  it('honors the active pointer over newest', () => {
    const { activeDifficulty } = summarizeTracks(
      [c('a', 'advanced'), c('b', 'beginner')],
      'b',
    )
    expect(activeDifficulty).toBe('beginner')
  })

  it('reports exists=true only for a ready course, false for generating/failed/missing', () => {
    const { tracks } = summarizeTracks(
      [c('a', 'beginner', 'ready'), c('b', 'intermediate', 'generating')],
      'a',
    )
    const byDiff = Object.fromEntries(tracks.map((t) => [t.difficulty, t]))
    expect(byDiff.beginner.exists).toBe(true)
    expect(byDiff.intermediate.exists).toBe(false)
    expect(byDiff.intermediate.status).toBe('generating')
    expect(byDiff.advanced.exists).toBe(false)
    expect(byDiff.advanced.status).toBeNull()
  })

  it('always returns one entry per difficulty, none active when there are no courses', () => {
    const { activeDifficulty, tracks } = summarizeTracks([], null)
    expect(activeDifficulty).toBeNull()
    expect(tracks.map((t) => t.difficulty)).toEqual([
      'beginner',
      'intermediate',
      'advanced',
    ])
    expect(tracks.every((t) => !t.active && !t.exists)).toBe(true)
  })
})
