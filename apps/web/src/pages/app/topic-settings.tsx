import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '@/api-client'
import { AsyncView, EmptyState } from '@/components/layout/async-view'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeading, Panel, ProgressMeter, SectionLabel } from '@fw/ui'
import type { TopicProgress } from '@/core/app-data'
import { useAsync } from '@/hooks/use-async'
import { topicCoursePath } from '@/lib/open-course'

// Destructive: wipe this topic's progress (keeps XP/streak). Confirmed via dialog.
function ResetPanel({
  topic,
  onReset,
}: {
  topic: TopicProgress
  onReset: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function reset() {
    setBusy(true)
    setError(null)
    try {
      await api.courses.resetTopic(topic.slug)
      setConfirming(false)
      setDone(true)
      onReset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset progress')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <SectionLabel>Reset progress</SectionLabel>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Clear your lesson progress, quiz answers, and review cards for{' '}
        {topic.name} and start the course over. Your XP and streak are kept.
      </p>
      {done ? (
        <p className="mt-4 font-mono text-[10px] tracking-widest text-primary uppercase">
          ✓ Progress reset
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 border border-destructive px-4 py-2 font-mono text-xs tracking-widest text-destructive uppercase transition-colors hover:bg-destructive/10"
        >
          Reset progress
        </button>
      )}
      {error && (
        <p className="mt-2 font-mono text-[10px] text-destructive">{error}</p>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Reset ${topic.name}?`}
        description={`This permanently clears your progress, quiz answers, and review cards for ${topic.name}. Your XP and streak stay. This can't be undone.`}
        confirmLabel="Reset progress"
        destructive
        busy={busy}
        onConfirm={reset}
      />
    </Panel>
  )
}

export function TopicSettingsPage() {
  const { slug = '' } = useParams()
  const state = useAsync(() => api.data.topics())

  return (
    <div>
      <AsyncView state={state}>
        {(topics) => {
          const topic = topics.find((t) => t.slug === slug)
          if (!topic) {
            return <EmptyState message="That topic could not be found." />
          }
          return (
            <div>
              <Link
                to={topicCoursePath(topic.slug)}
                className="mb-4 inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3" /> Back to topic
              </Link>
              <PageHeading
                label="Topic settings"
                title={topic.name}
                subtitle="Manage this topic's course and your progress."
              />
              <div className="grid gap-5">
                <Panel>
                  <SectionLabel>Progress</SectionLabel>
                  <div className="mt-4 flex items-center justify-between font-mono text-xs">
                    <span className="tracking-widest text-muted-foreground uppercase">
                      {topic.difficulty}
                    </span>
                    <span>
                      {topic.lessonsCompleted} / {topic.lessonsTotal} lessons ·{' '}
                      {topic.pct}%
                    </span>
                  </div>
                  <div className="mt-3">
                    <ProgressMeter value={topic.pct} />
                  </div>
                </Panel>
                <ResetPanel topic={topic} onReset={state.reload} />
              </div>
            </div>
          )
        }}
      </AsyncView>
    </div>
  )
}
