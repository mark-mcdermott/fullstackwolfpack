import { ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { api } from '@/api-client'
import { AsyncView } from '@/components/layout/async-view'
import { PageHeading, Panel, SectionLabel } from '@fw/ui'
import type { PublicTopic } from '@/core/public-content'
import { useAuth } from '@/hooks/auth-context'
import { useAsync } from '@/hooks/use-async'
import { guestLessonsCompleted, guestXp } from '@/lib/guest-progress'

// Guest topics gallery (/learn): pick a built-in course and start — no account.
// Signed-in users are sent to the real Topics page.
export function LearnBrowse() {
  const { user, loading } = useAuth()
  const state = useAsync(() => api.public.topics())

  if (!loading && user) return <Navigate to="/app/topics" replace />

  return (
    <div>
      <PageHeading
        label="Learn"
        title="Tutorials"
        subtitle="Try a lesson — no account needed. Progress is saved on this device."
      />
      <GuestProgressStrip />
      <AsyncView state={state}>
        {(view) => (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view.topics.map((t) => (
              <TopicCard key={t.slug} topic={t} />
            ))}
          </div>
        )}
      </AsyncView>
    </div>
  )
}

function GuestProgressStrip() {
  const xp = guestXp()
  const done = guestLessonsCompleted()
  if (done === 0) return null
  return (
    <Panel className="flex flex-wrap items-center justify-between gap-3 border-primary/40 bg-primary/10">
      <p className="text-sm">
        <span className="font-bold">{done}</span> lesson{done === 1 ? '' : 's'}{' '}
        done · <span className="font-bold">{xp} XP</span> earned as a guest.
      </p>
      <Link
        to="/signup"
        className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 font-mono text-[10px] tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
      >
        Save my progress <ArrowRight className="size-3.5" />
      </Link>
    </Panel>
  )
}

function TopicCard({ topic }: { topic: PublicTopic }) {
  const nav = useNavigate()
  const [starting, setStarting] = useState(false)

  async function start() {
    if (starting) return
    setStarting(true)
    try {
      const outline = await api.public.course(topic.slug)
      if (outline.nextLessonId) nav(`/learn/${outline.nextLessonId}`)
    } catch {
      setStarting(false)
    }
  }

  return (
    <Panel className="flex flex-col gap-3">
      <SectionLabel>{topic.name}</SectionLabel>
      <p className="flex-1 text-xs text-muted-foreground">{topic.description}</p>
      <button
        type="button"
        onClick={start}
        disabled={starting}
        className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-2.5 font-mono text-[10px] tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:opacity-50"
      >
        <Sparkles className="size-3.5" />
        {starting ? 'Loading…' : 'Start learning'}
      </button>
    </Panel>
  )
}
