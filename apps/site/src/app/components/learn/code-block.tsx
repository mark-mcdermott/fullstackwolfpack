import { useEffect, useState } from 'react'
import { highlightToHtml } from '@/lib/highlighter'

// Renders a fenced code block, syntax-highlighted by Shiki. While the highlighter
// (and its grammar) load, the plain source is shown as a fallback — so the block is
// always readable and never blocks paint.
export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    highlightToHtml(code, lang)
      .then((out) => {
        if (alive) setHtml(out)
      })
      .catch(() => {
        if (alive) setHtml(null) // fall back to plain text on any failure
      })
    return () => {
      alive = false
    }
  }, [code, lang])

  if (html) {
    // The HTML is produced entirely by Shiki from tokenised, escaped source (only
    // <pre>/<span> with inline styles — no markup from the lesson content survives),
    // so injecting it is safe here.
    return (
      <div
        className={
          // `w-max min-w-full` on the <pre> is what keeps the dark surface under
          // the code when the block is scrolled sideways.
          //
          // Shiki puts the background on the <pre>, and a block element is as
          // wide as its container, not its content — while the code inside is
          // `white-space: pre` and overflows it. So scrolling right ran the text
          // off the end of its own background and onto whatever was behind the
          // block: the white card in light, the popover in a term panel.
          // `max-content` sizes the <pre> to the longest line; `min-w-full`
          // keeps it filling the block when the code is shorter than the width.
          //
          // It also restores the trailing padding, which used to collapse at the
          // right-hand end of a scroll for the same reason.
          'my-1 overflow-x-auto border border-border text-sm [&>pre]:w-max [&>pre]:min-w-full [&>pre]:p-4'
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    // Same surface as the highlighted block, so the swap when Shiki finishes
    // is a colouring-in rather than the block changing colour underneath the
    // reader — `bg-card` is pure white in light, where the code surface is not.
    <pre className="my-1 overflow-x-auto border border-border bg-[var(--code-surface)] p-4 font-mono text-sm text-[var(--code-variable)]">
      <code>{code}</code>
    </pre>
  )
}
