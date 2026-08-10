// Glossary term linking. Pure so it's unit-tested; the rehype glue that applies
// it to rendered lessons lives in lib/rehype-linkify-terms.ts.

// A Wikipedia deep-link for a term. Host-locked + Special:Search (any term
// resolves), term URL-encoded so LLM-supplied text can't inject a URL. Still the
// fallback for any term we have not written an entry for yet.
export function wikipediaUrl(term: string): string {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(term)}`
}

// The id for a term's entry and its page. Lower-cased, non-alphanumerics folded
// to single dashes — so "Lexical scope", "lexical-scope" and "LEXICAL SCOPE" all
// address the same entry, which matters because the term is written by whoever
// wrote the lesson.
export function glossarySlug(term: string): string {
  return (
    term
      .trim()
      // A lower→upper boundary is a word boundary in identifier-style terms, so
      // "ReferenceError" becomes reference-error rather than referenceerror.
      // Programming glossaries are full of these and the run-together form is
      // unreadable in a URL.
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
}

// A glossary entry. `short` is the one line a reader could repeat to someone
// else; `body` is markdown, a few paragraphs at most.
//
// `see` is what stops the chain being infinite. An entry may only use a term
// that has an entry of its own, and those are listed here — so "what is that?"
// always has somewhere to go, and always terminates. An entry that reaches for
// a term with no entry is a bug, and `glossaryIssues` below finds it.
export type GlossaryEntry = {
  slug: string
  term: string
  short: string
  body: string
  see?: string[]
}

// Where a linked term points. An internal page when we have written the entry,
// Wikipedia when we have not — so adding an entry upgrades the link with no
// change to the lesson content that references it.
export function termHref(term: string, hasEntry = false): string {
  return hasEntry ? `/glossary/${glossarySlug(term)}` : wikipediaUrl(term)
}

// Every `see` must resolve, or "read more" is a dead end.
export function glossaryIssues(entries: readonly GlossaryEntry[]): string[] {
  const slugs = new Set(entries.map((e) => e.slug))
  const issues: string[] = []
  for (const e of entries) {
    if (e.slug !== glossarySlug(e.term)) {
      issues.push(`${e.slug}: slug does not match term "${e.term}"`)
    }
    for (const ref of e.see ?? []) {
      if (!slugs.has(ref)) issues.push(`${e.slug}: see "${ref}" has no entry`)
    }
  }
  return issues
}

export type LinkPart =
  // `value` is the text as it appeared (casing preserved); `term` is the
  // canonical glossary term, which is what identifies the entry. The two differ
  // whenever the prose used different casing or a plural.
  | { kind: 'text'; value: string }
  | { kind: 'link'; value: string; term: string; href: string }

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Split `text`, linking the FIRST occurrence of each not-yet-used term
// (whole-word, case-insensitive; the matched casing is preserved in the link
// text, the canonical term drives the URL). `used` (lower-cased keys) dedupes
// across a whole document so a term links at most once. Terms under 3 chars are
// skipped as too ambiguous to auto-link.
export function linkifyParts(
  text: string,
  terms: readonly string[],
  used: Set<string>,
): LinkPart[] {
  const candidates = terms.map((t) => t.trim()).filter((t) => t.length >= 3)
  if (candidates.length === 0) return [{ kind: 'text', value: text }]

  const parts: LinkPart[] = []
  let rest = text
  for (;;) {
    let best:
      | { index: number; length: number; key: string; matched: string; term: string }
      | null = null
    for (const term of candidates) {
      const key = term.toLowerCase()
      if (used.has(key)) continue
      const m = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').exec(rest)
      if (!m) continue
      if (
        best === null ||
        m.index < best.index ||
        (m.index === best.index && m[0].length > best.length)
      ) {
        best = { index: m.index, length: m[0].length, key, matched: m[0], term }
      }
    }
    if (!best) {
      if (rest) parts.push({ kind: 'text', value: rest })
      break
    }
    if (best.index > 0) {
      parts.push({ kind: 'text', value: rest.slice(0, best.index) })
    }
    parts.push({
      kind: 'link',
      value: best.matched,
      term: best.term,
      href: termHref(best.term),
    })
    used.add(best.key)
    rest = rest.slice(best.index + best.length)
  }
  return parts
}
