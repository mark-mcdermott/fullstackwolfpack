import { describe, expect, it } from 'vitest'
import { BUILTIN_COURSES } from '@/db/seed-content'
import { GLOSSARY_ENTRIES } from '@/content/glossary-entries'
import { resolveLang } from './highlighter'

// Every fence language the shipped content uses must have a grammar loaded.
//
// An unknown language is not an error — `resolveLang` falls back to `text`, so
// the page still renders. That is the right behaviour and also why this needs a
// test: the only symptom is a block of flat, uncoloured code, which nobody
// notices unless they happen to scroll that course. An audit found three
// languages in this state — `c`, `dockerfile` and `yaml` — two of which had
// been shipping unhighlighted since the Docker course was generated.
//
// It matters more than a normal coverage gap because the content is generated:
// a regeneration can introduce a language nobody added a grammar for.
function fenceLanguages(): Set<string> {
  const langs = new Set<string>()
  const scan = (markdown: string) => {
    for (const m of markdown.matchAll(/```([A-Za-z0-9+#-]+)/g)) langs.add(m[1])
  }
  for (const course of BUILTIN_COURSES)
    for (const lesson of course.lessons)
      for (const segment of lesson.segments) scan(segment.markdown)
  for (const entry of GLOSSARY_ENTRIES) scan(entry.body)
  return langs
}

describe('highlighter grammar coverage', () => {
  it('has a grammar for every language the content actually uses', () => {
    const unresolved = [...fenceLanguages()].filter(
      (lang) => lang !== 'text' && resolveLang(lang) === 'text',
    )
    expect(unresolved, `no grammar loaded for: ${unresolved.join(', ')}`).toEqual(
      [],
    )
  })

  it('resolves the aliases the content writes', () => {
    expect(resolveLang('js')).toBe('javascript')
    expect(resolveLang('ts')).toBe('typescript')
    expect(resolveLang('sh')).toBe('bash')
    expect(resolveLang('yml')).toBe('yaml')
    expect(resolveLang('docker')).toBe('dockerfile')
  })

  // The fallback is deliberate: a language we have never heard of should render
  // as plain text rather than throw inside a lesson.
  it('falls back to plain text rather than failing on an unknown language', () => {
    expect(resolveLang('brainfuck')).toBe('text')
  })
})
