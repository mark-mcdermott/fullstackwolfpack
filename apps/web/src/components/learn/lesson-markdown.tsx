import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { CodeBlock } from './code-block'

// Renders a lesson segment's markdown body in the app's design language.
//
// react-markdown builds React elements directly (no dangerouslySetInnerHTML and no
// `rehype-raw`), so even though some lesson bodies are AI-generated they can't inject
// HTML — the content is XSS-safe by construction. Fenced code blocks are handed to
// <CodeBlock> for Shiki highlighting; everything else is styled inline below.

const components: Components = {
  h1: ({ node: _n, ...p }) => (
    <h1 className="text-2xl font-bold tracking-tight uppercase" {...p} />
  ),
  h2: ({ node: _n, ...p }) => (
    <h2 className="mt-2 text-xl font-bold tracking-tight uppercase" {...p} />
  ),
  h3: ({ node: _n, ...p }) => <h3 className="mt-2 text-lg font-semibold" {...p} />,
  p: ({ node: _n, ...p }) => <p className="text-muted-foreground" {...p} />,
  ul: ({ node: _n, ...p }) => (
    <ul className="ml-5 list-disc space-y-1 text-muted-foreground" {...p} />
  ),
  ol: ({ node: _n, ...p }) => (
    <ol className="ml-5 list-decimal space-y-1 text-muted-foreground" {...p} />
  ),
  a: ({ node: _n, ...p }) => (
    <a className="text-primary underline underline-offset-2" {...p} />
  ),
  strong: ({ node: _n, ...p }) => (
    <strong className="font-semibold text-foreground" {...p} />
  ),
  blockquote: ({ node: _n, ...p }) => (
    <blockquote
      className="border-l-2 border-primary pl-4 text-muted-foreground italic"
      {...p}
    />
  ),
  table: ({ node: _n, ...p }) => (
    <table
      className="w-full border-collapse border border-border font-mono text-xs"
      {...p}
    />
  ),
  th: ({ node: _n, ...p }) => (
    <th
      className="border border-border bg-muted px-2 py-1 text-left tracking-widest uppercase"
      {...p}
    />
  ),
  td: ({ node: _n, ...p }) => <td className="border border-border px-2 py-1" {...p} />,
  // Unwrap <pre>: <CodeBlock> supplies its own container, so we avoid nesting.
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className ?? '')
    const text = String(children ?? '').replace(/\n$/, '')
    if (match || text.includes('\n')) {
      return <CodeBlock code={text} lang={match?.[1] ?? 'text'} />
    }
    return (
      <code className="border border-border bg-muted px-1 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    )
  },
}

export function LessonMarkdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 text-sm leading-relaxed', className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  )
}
