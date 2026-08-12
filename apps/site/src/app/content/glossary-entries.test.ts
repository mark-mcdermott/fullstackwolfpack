import { describe, expect, it } from 'vitest'
import { glossaryIssues, glossarySlug } from '@/core/glossary'
import { GLOSSARY_ENTRIES, glossaryEntry } from './glossary-entries'

describe('GLOSSARY_ENTRIES', () => {
  // The rule that makes "but what is *that*?" terminate: every term an entry
  // leans on has an entry of its own.
  it('has no dead cross-references and no mismatched slugs', () => {
    expect(glossaryIssues(GLOSSARY_ENTRIES)).toEqual([])
  })

  it('is addressable by the slug of its own term', () => {
    for (const e of GLOSSARY_ENTRIES) {
      expect(glossaryEntry(glossarySlug(e.term))?.slug).toBe(e.slug)
    }
  })

  it('gives every entry a one-line summary and a real body', () => {
    for (const e of GLOSSARY_ENTRIES) {
      expect(e.short.length).toBeGreaterThan(20)
      // Not a word-count floor — a floor becomes the target. This only catches
      // an entry that is a stub.
      expect(e.body.split(/\s+/).length).toBeGreaterThan(60)
    }
  })

  it('covers the terms the authored lesson introduces', () => {
    for (const term of ['stack frame', 'function value', 'lexical scope', 'closure']) {
      expect(glossaryEntry(glossarySlug(term))).toBeDefined()
    }
  })
})
