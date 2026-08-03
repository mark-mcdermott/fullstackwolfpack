// Glossary term linking. Pure so it's unit-tested; the rehype glue that applies
// it to rendered lessons lives in lib/rehype-linkify-terms.ts.

// A Wikipedia deep-link for a term. Host-locked + Special:Search (any term
// resolves), term URL-encoded so LLM-supplied text can't inject a URL.
// Roadmap: repoint to an internal /app/glossary/:term page.
export function wikipediaUrl(term: string): string {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(term)}`
}

export type LinkPart =
  | { kind: 'text'; value: string }
  | { kind: 'link'; value: string; href: string }

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
    parts.push({ kind: 'link', value: best.matched, href: wikipediaUrl(best.term) })
    used.add(best.key)
    rest = rest.slice(best.index + best.length)
  }
  return parts
}
