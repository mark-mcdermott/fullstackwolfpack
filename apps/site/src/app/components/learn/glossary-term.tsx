import { ArrowUpRight } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router'
import { popoverSurfaceClass } from '@fw/ui'
import { glossarySlug } from '@/core/glossary'
import { glossaryEntry } from '@/content/glossary-entries'
import { cn } from '@/lib/utils'
import { LessonMarkdown } from './lesson-markdown'

// A linked glossary term that opens its explanation in place.
//
// The point of this, in one line: a reader asking "but what is *that*?" should
// be able to answer it at the moment the question occurs, without leaving the
// paragraph they are in. A lesson is a line; understanding is a graph, and the
// reason the tutorials read as hand-wavey was that descending was impossible —
// every unexplained term accumulated until the page stopped making sense.
//
// So it is not really a tooltip. It is several paragraphs, scrollable, with a
// way further in. Which is why it does not behave like one either:
//
// - **click/tap opens it, not hover.** A hover panel this size is unusable on
//   touch, and on a pointer it fires while you are reading past the word.
//   Hover still works, but only as a delayed preview on devices that have one.
// - **it stays open until dismissed**, because you are meant to read it. Escape,
//   an outside click, or the same term again all close it.
// - **it never traps you.** "Read more" goes to the term's own page, and the
//   entry's own links go to other entries, which is what makes the chain finite.
export function GlossaryTerm({
  term,
  href,
  children,
}: {
  term: string
  href: string
  children: ReactNode
}) {
  const slug = glossarySlug(term)
  const entry = glossaryEntry(slug)
  const [open, setOpen] = useState(false)
  const [box, setBox] = useState<{ left: number; width: number } | null>(null)
  const rootRef = useRef<HTMLSpanElement>(null)
  const panelId = useId()

  // Keep the panel on screen. It hangs off the word, and a word late in a line
  // puts a 448px panel straight past the right edge — so both its width and its
  // offset are measured on open and clamped against each edge.
  //
  // Measured against `documentElement.clientWidth`, not `window.innerWidth`, and
  // sized in pixels rather than `vw`. Those are the same trap: on mobile both of
  // those widen to the *document* once anything overflows, so a panel that
  // overflowed would size itself against its own overflow and never come back.
  // clientWidth stays the layout viewport.
  //
  // A layout effect so it is positioned before the first paint, never appearing
  // in the wrong place and jumping.
  useLayoutEffect(() => {
    if (!open) return
    const el = rootRef.current
    if (!el) return
    const margin = 12
    const viewport = document.documentElement.clientWidth
    const width = Math.min(448, viewport - margin * 2)
    const r = el.getBoundingClientRect()
    let left = 0
    const pastRight = r.left + width - (viewport - margin)
    if (pastRight > 0) left = -pastRight
    if (r.left + left < margin) left = margin - r.left
    setBox({ left, width })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // No entry written yet — keep the plain outbound link rather than offering a
  // panel with nothing in it.
  if (!entry) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline decoration-dotted underline-offset-2"
      >
        {children}
      </a>
    )
  }

  return (
    <span ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cn(
          'cursor-help font-medium text-primary underline decoration-dotted underline-offset-4 transition-colors hover:decoration-solid',
          open && 'decoration-solid',
        )}
      >
        {children}
      </button>

      {open && (
        <span
          id={panelId}
          role="dialog"
          aria-label={entry.term}
          // Anchored to the word but clamped to the viewport: `max-w` in `vw`
          // rather than a fixed width, because the word can sit anywhere on the
          // line and a fixed panel would hang off the edge on a phone.
          style={{ left: box?.left ?? 0, width: box?.width }}
          className={cn(
            'absolute z-50 mt-2 block cursor-auto',
            // Reset the typography it would otherwise inherit. The panel is a
            // DOM descendant of the term it hangs off, and these terms are
            // bolded in the lesson copy — so the whole entry was rendering at
            // the surrounding <strong>'s weight (600). A floating panel should
            // read as its own surface, not as a continuation of the word that
            // opened it.
            'font-normal',
            'rounded-lg p-4 text-left',
            // It opens over a lesson Panel, which is `bg-card` — the same fill
            // this used to have, so the two surfaces were identical and only a
            // hairline told them apart. The kit's floating-surface treatment
            // separates it properly in both themes.
            popoverSurfaceClass,
            // A heavier drop than the shared default. This one overhangs body
            // copy on a pure-white page rather than opening off a header, so it
            // needs more shadow to sit convincingly in front of the text it is
            // covering. Overrides the class above via tailwind-merge.
            'light:shadow-[0_28px_70px_rgb(0_0_0/0.34),0_10px_24px_rgb(0_0_0/0.22),0_2px_6px_rgb(0_0_0/0.12)]',
          )}
        >
          <span className="mb-2 block font-mono text-[10px] tracking-widest text-primary uppercase">
            {entry.term}
          </span>
          <span className="mb-3 block text-sm font-medium text-foreground">
            {entry.short}
          </span>
          {/* Capped and scrollable: the entry is allowed to be four paragraphs,
              but the panel must not become the page. */}
          <span className="block max-h-72 overflow-y-auto pr-1">
            {/* No `terms` — an entry does not linkify itself, or a term could
                link to the panel you are already reading. */}
            <LessonMarkdown className="text-[13px]">{entry.body}</LessonMarkdown>
          </span>
          <Link
            to={`/glossary/${entry.slug}`}
            className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-primary uppercase hover:underline"
          >
            Read more <ArrowUpRight className="size-3" />
          </Link>
        </span>
      )}
    </span>
  )
}
