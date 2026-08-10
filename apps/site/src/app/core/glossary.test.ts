import { describe, expect, it } from 'vitest'
import {
  linkifyParts,
  wikipediaUrl,
  glossarySlug,
  glossaryIssues,
  termHref,
} from './glossary'

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
        term: 'closures',
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

describe('glossarySlug', () => {
  it('folds casing and punctuation so one term has one id', () => {
    expect(glossarySlug('Lexical scope')).toBe('lexical-scope')
    expect(glossarySlug('  LEXICAL   SCOPE  ')).toBe('lexical-scope')
    expect(glossarySlug('ReferenceError')).toBe('reference-error')
    expect(glossarySlug('structuredClone')).toBe('structured-clone')
    expect(glossarySlug('stack frame')).toBe('stack-frame')
  })
})

describe('termHref', () => {
  // Adding an entry has to upgrade every existing link without touching a
  // single lesson body — the term text in the prose is the only join.
  it('points in-app once an entry exists, and out to Wikipedia until then', () => {
    expect(termHref('closure', true)).toBe('/glossary/closure')
    expect(termHref('closure', false)).toContain('wikipedia.org')
  })
})

describe('glossaryIssues', () => {
  const e = (slug: string, term: string, see?: string[]) => ({
    slug, term, short: 's', body: 'b', see,
  })

  it('passes a set whose cross-references all resolve', () => {
    expect(
      glossaryIssues([e('closure', 'closure', ['stack-frame']), e('stack-frame', 'stack frame')]),
    ).toEqual([])
  })

  // This is the whole point of the rule: an entry that leans on a term with no
  // entry is a dead end, which is the failure the lessons had, one level down.
  it('catches a see that goes nowhere', () => {
    const issues = glossaryIssues([e('closure', 'closure', ['stack-frame'])])
    expect(issues.join(' ')).toMatch(/see "stack-frame" has no entry/)
  })

  it('catches a slug that does not match its own term', () => {
    const issues = glossaryIssues([e('closures', 'closure')])
    expect(issues.join(' ')).toMatch(/does not match term/)
  })
})
