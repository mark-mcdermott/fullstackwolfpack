import { describe, expect, it, vi } from 'vitest'

// course-resolver.ts imports the Neon db client (which reads DATABASE_URL at
// load); stub it since pickActiveCourseId is pure and never touches the db.
vi.mock('../db', () => ({ db: {} }))

const { pickActiveCourseId } = await import('./course-resolver')

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
