import { describe, expect, it } from 'vitest'
import { ordinal, type RankableUser, rankEntries } from './leaderboard'

describe('ordinal', () => {
  it('suffixes 1/2/3 as st/nd/rd and the rest as th', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
  })

  it('treats the 11–13 teens as th', () => {
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
  })

  it('picks the suffix by last digit for higher ranks', () => {
    expect(ordinal(21)).toBe('21st')
    expect(ordinal(22)).toBe('22nd')
    expect(ordinal(103)).toBe('103rd')
    expect(ordinal(111)).toBe('111th')
  })
})

describe('rankEntries', () => {
  const rows: RankableUser[] = [
    { userId: 'a', name: 'Ada', level: 5, xp: 900, streak: 3 },
    { userId: 'b', name: 'Bo', level: 4, xp: 700, streak: 0 },
    { userId: 'c', name: 'Cy', level: 3, xp: 500, streak: 1 },
  ]

  it('assigns 1-based positional ranks in list order', () => {
    const entries = rankEntries(rows, 'x')
    expect(entries.map((e) => e.rank)).toEqual([1, 2, 3])
    expect(entries[0].name).toBe('Ada')
  })

  it('flags exactly the current user', () => {
    const entries = rankEntries(rows, 'b')
    expect(entries.find((e) => e.isMe)?.name).toBe('Bo')
    expect(entries.filter((e) => e.isMe)).toHaveLength(1)
  })

  it('flags no one when the user is absent from the board', () => {
    expect(rankEntries(rows, 'nobody').some((e) => e.isMe)).toBe(false)
  })
})
