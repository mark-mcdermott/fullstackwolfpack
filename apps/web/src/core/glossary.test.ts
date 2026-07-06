import { describe, expect, it } from 'vitest'
import { linkifyParts, wikipediaUrl } from './glossary'

const linkify = (text: string, terms: string[]) =>
  linkifyParts(text, terms, new Set())

describe('wikipediaUrl', () => {
  it('encodes the term into a host-locked search URL', () => {
    expect(wikipediaUrl('IIFE')).toBe(
      'https://en.wikipedia.org/wiki/Special:Search?search=IIFE',
    )
    expect(wikipediaUrl('event loop')).toContain('search=event%20loop')
  })
})

describe('linkifyParts', () => {
  it('links a whole-word term, preserving the surrounding text', () => {
    const parts = linkify('Learn about closures today', ['closures'])
    expect(parts).toEqual([
      { kind: 'text', value: 'Learn about ' },
      {
        kind: 'link',
        value: 'closures',
        href: wikipediaUrl('closures'),
      },
      { kind: 'text', value: ' today' },
    ])
  })

  it('is case-insensitive but keeps the matched casing in the link text', () => {
    const parts = linkify('Promises are great', ['promises'])
    expect(parts.find((p) => p.kind === 'link')).toMatchObject({
      value: 'Promises',
      href: wikipediaUrl('promises'),
    })
  })

  it('does not match inside a larger word', () => {
    const parts = linkify('The cat sat', ['at'])
    // "at" is < 3 chars → skipped anyway, but also must never match within "cat"
    expect(parts).toEqual([{ kind: 'text', value: 'The cat sat' }])
  })

  it('links each term at most once per document via the shared used-set', () => {
    const used = new Set<string>()
    const a = linkifyParts('closures and closures', ['closures'], used)
    // first occurrence links, the second stays text
    expect(a.filter((p) => p.kind === 'link')).toHaveLength(1)
    const b = linkifyParts('more closures here', ['closures'], used)
    expect(b.every((p) => p.kind === 'text')).toBe(true)
  })

  it('returns the text unchanged when no term matches', () => {
    expect(linkify('nothing here', ['hooks'])).toEqual([
      { kind: 'text', value: 'nothing here' },
    ])
  })
})
