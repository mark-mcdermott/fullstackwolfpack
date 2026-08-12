import { glossarySlug, linkifyParts, termHref, type LinkPart } from '@/core/glossary'
import { glossaryEntry } from '@/content/glossary-entries'

// Minimal HAST shapes (avoids pulling @types/hast just for this).
type HastText = { type: 'text'; value: string }
type HastElement = {
  type: 'element'
  tagName: string
  properties?: Record<string, unknown>
  children: HastChild[]
}
type HastChild = HastText | HastElement | { type: string; children?: HastChild[] }

// Don't linkify inside links, code, or preformatted blocks.
const SKIP_TAGS = new Set(['a', 'code', 'pre'])

function partToNode(part: LinkPart): HastChild {
  if (part.kind === 'text') return { type: 'text', value: part.value }
  // A term we have written an entry for becomes an in-app link the renderer
  // upgrades to a popover; anything else keeps the Wikipedia fallback and opens
  // in a new tab, so adding an entry later changes the link without touching a
  // single lesson body.
  const slug = glossarySlug(part.term)
  const known = glossaryEntry(slug) !== undefined
  return {
    type: 'element',
    tagName: 'a',
    properties: {
      href: termHref(part.term, known),
      'data-glossary': 'true',
      'data-term': part.term,
      ...(known ? {} : { target: '_blank', rel: 'noopener noreferrer' }),
    },
    children: [{ type: 'text', value: part.value }],
  }
}

// react-markdown rehype plugin: linkify the first occurrence of each glossary
// term across a lesson body's text nodes (skipping code/links). Each term links
// once per document via the shared `used` set.
export function rehypeLinkifyTerms(terms: readonly string[]) {
  return function attacher() {
    return function transformer(tree: unknown) {
      if (terms.length === 0) return
      const used = new Set<string>()

      const walk = (node: { children?: HastChild[] }, insideSkip: boolean) => {
        const children = node.children
        if (!children) return
        for (let i = 0; i < children.length; i++) {
          const child = children[i]
          if (child.type === 'element') {
            const el = child as HastElement
            walk(el, insideSkip || SKIP_TAGS.has(el.tagName))
          } else if (child.type === 'text' && !insideSkip) {
            const parts = linkifyParts((child as HastText).value, terms, used)
            const hasLink = parts.some((p) => p.kind === 'link')
            if (hasLink) {
              children.splice(i, 1, ...parts.map(partToNode))
              i += parts.length - 1
            }
          } else if ('children' in child && child.children) {
            walk(child as { children: HastChild[] }, insideSkip)
          }
        }
      }

      walk(tree as { children?: HastChild[] }, false)
    }
  }
}
