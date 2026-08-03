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
        className="my-1 overflow-x-auto border border-border text-sm [&>pre]:p-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <pre className="my-1 overflow-x-auto border border-border bg-card p-4 font-mono text-sm">
      <code>{code}</code>
    </pre>
  )
}
