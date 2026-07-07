import { Lock, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api-client'
import { siteUrl } from '@/consts'
import type { TutorMessage, TutorMode } from '@/core/tutor'
import { cn } from '@/lib/utils'
import { LessonMarkdown } from './lesson-markdown'

// The AI tutor (`ai_tutor` Pro feature), grounded in the current segment. Free
// users see an upsell; Pro users get a grounded chat with hint/explain/example
// shortcuts. Mounted keyed by segmentId in the player, so it resets per segment.
export function TutorPanel({
  segmentId,
  canUse,
}: {
  segmentId: string
  canUse: boolean
}) {
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canUse) {
    return (
      <div className="flex flex-col items-start gap-2 border border-dashed border-border p-4">
        <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          <Lock className="size-3.5" /> Akela · Pro
        </p>
        <p className="text-xs text-muted-foreground">
          Akela — your AI guide — gives grounded hints and explanations for this
          lesson.
        </p>
        <a
          href={siteUrl('/pricing')}
          className="mt-1 bg-primary px-4 py-2 font-mono text-[10px] tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
        >
          Upgrade to Pro
        </a>
      </div>
    )
  }

  async function ask(text: string, mode: TutorMode) {
    if (!text.trim() || pending) return
    const next: TutorMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setPending(true)
    setError(null)
    try {
      const { reply } = await api.data.tutor(segmentId, next, mode)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Akela is unavailable.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 border border-border p-4">
      <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-primary uppercase">
        <Sparkles className="size-3.5" /> Akela
      </p>

      {messages.length === 0 && (
        <p className="text-xs text-muted-foreground">
          I'm <span className="font-semibold text-foreground">Akela</span>, your
          guide. Stuck on this lesson? Ask for a hint, another explanation, or an
          example.
        </p>
      )}

      {messages.length > 0 && (
        <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'text-sm',
                m.role === 'user' && 'border-l-2 border-border pl-3 text-muted-foreground',
              )}
            >
              {m.role === 'assistant' ? (
                <LessonMarkdown>{m.content}</LessonMarkdown>
              ) : (
                <p>{m.content}</p>
              )}
            </div>
          ))}
          {pending && (
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Thinking…
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <QuickAction label="Hint" onClick={() => ask('Give me a hint.', 'hint')} disabled={pending} />
        <QuickAction
          label="Explain differently"
          onClick={() => ask('Explain this a different way.', 'explain')}
          disabled={pending}
        />
        <QuickAction
          label="Example"
          onClick={() => ask('Give me an example.', 'example')}
          disabled={pending}
        />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input, 'chat')
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Akela about this lesson…"
          className="flex-1 border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-muted-foreground"
        />
        <button
          type="submit"
          disabled={pending || input.trim() === ''}
          className="inline-flex items-center gap-2 bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:opacity-40"
        >
          <Send className="size-3.5" />
        </button>
      </form>

      {error && <p className="font-mono text-[10px] text-destructive">{error}</p>}
    </div>
  )
}

function QuickAction({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="border border-border px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase hover:border-muted-foreground disabled:opacity-40"
    >
      {label}
    </button>
  )
}
