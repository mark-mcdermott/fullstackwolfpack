import { Dialog } from '@base-ui/react/dialog'
import { useEffect, useState } from 'react'
import { api } from '@/api-client'
import { inferDifficulty, type Diagnostic } from '@/core/diagnostic'
import type { Difficulty } from '@/core/generation'
import { cn } from '@/lib/utils'

// Pre-generation intake shown before a topic is generated when the user opted
// into the skill-level and/or coverage preferences. Collects a starting
// difficulty (from a short AI placement quiz) and an optional coverage request,
// then hands them back so the caller runs the generation.
export function IntakeDialog({
  open,
  onOpenChange,
  topicSlug,
  topicName,
  askSkillLevel,
  askCoverage,
  defaultDifficulty,
  onComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  topicSlug: string
  topicName: string
  askSkillLevel: boolean
  askCoverage: boolean
  defaultDifficulty: Difficulty
  onComplete: (result: { difficulty: Difficulty; customization?: string }) => void
}) {
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [coverage, setCoverage] = useState('')

  useEffect(() => {
    if (open) setCoverage('')
  }, [open])

  // Fetch the placement quiz when the dialog opens (skill-level pref only).
  useEffect(() => {
    if (!open || !askSkillLevel) return
    let active = true
    setLoading(true)
    setLoadError(null)
    setDiagnostic(null)
    setAnswers({})
    api.courses
      .diagnostic(topicSlug)
      .then((d) => active && setDiagnostic(d))
      .catch(
        (e) =>
          active &&
          setLoadError(e instanceof Error ? e.message : 'Could not build a quiz'),
      )
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [open, askSkillLevel, topicSlug])

  const quizReady = askSkillLevel && !!diagnostic && !loadError
  const allAnswered =
    !diagnostic || Object.keys(answers).length === diagnostic.questions.length

  function finish(useQuiz: boolean) {
    let difficulty = defaultDifficulty
    if (useQuiz && diagnostic) {
      const correct = diagnostic.questions.reduce(
        (n, q, i) => n + (answers[i] === q.correctIndex ? 1 : 0),
        0,
      )
      difficulty = inferDifficulty(correct, diagnostic.questions.length)
    }
    const customization =
      askCoverage && coverage.trim() ? coverage.trim() : undefined
    onOpenChange(false)
    onComplete({ difficulty, customization })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col border border-border bg-card shadow-lg outline-none">
          <div className="border-b border-border p-5">
            <Dialog.Title className="font-mono text-xs tracking-widest uppercase">
              Set up {topicName}
            </Dialog.Title>
            <Dialog.Description className="mt-1 font-mono text-[11px] text-muted-foreground">
              A quick setup so your course starts where you want it.
            </Dialog.Description>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {askSkillLevel && (
              <div>
                <p className="mb-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  Skill check
                </p>
                {loading && (
                  <p className="font-mono text-xs text-muted-foreground">
                    Building a quick quiz…
                  </p>
                )}
                {loadError && (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Couldn’t build a quiz. You can still continue at{' '}
                    <span className="text-foreground">{defaultDifficulty}</span>.
                  </p>
                )}
                {diagnostic && (
                  <ol className="flex flex-col gap-4">
                    {diagnostic.questions.map((qn, qi) => (
                      <li key={qi}>
                        <p className="text-sm">
                          {qi + 1}. {qn.prompt}
                        </p>
                        <div className="mt-2 flex flex-col gap-1.5">
                          {qn.options.map((opt, oi) => (
                            <button
                              key={oi}
                              type="button"
                              onClick={() =>
                                setAnswers((a) => ({ ...a, [qi]: oi }))
                              }
                              aria-pressed={answers[qi] === oi}
                              className={cn(
                                'border px-3 py-1.5 text-left font-mono text-[11px] transition-colors',
                                answers[qi] === oi
                                  ? 'border-primary bg-primary/10 text-foreground'
                                  : 'border-border text-muted-foreground hover:bg-muted',
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {askCoverage && (
              <div className={cn(askSkillLevel && 'mt-6 border-t border-border pt-5')}>
                <p className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  Anything specific to cover?
                </p>
                <textarea
                  value={coverage}
                  onChange={(e) => setCoverage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Focus on hooks and Suspense"
                  className="w-full resize-y border border-border bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-muted-foreground"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-border p-4">
            {quizReady && (
              <button
                type="button"
                onClick={() => finish(false)}
                className="border border-border px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors hover:bg-muted"
              >
                Skip quiz
              </button>
            )}
            <button
              type="button"
              onClick={() => finish(quizReady)}
              disabled={loading || (quizReady && !allAnswered)}
              className="bg-primary px-4 py-2 font-mono text-[10px] tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate course →
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
