import { ArrowRight, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { api } from '@/api-client'
import { AsyncView, EmptyState } from '@/components/layout/async-view'
import { SkillIcon } from '@/components/launch/skill-icon'
import { CourseHero } from '@/components/learn/course-hero'
import { CourseOutlineList } from '@/components/learn/course-outline-list'
import { Panel, SectionLabel } from '@fw/ui'
import type { CourseLesson } from '@/core/app-data'
import { formatPlaytime } from '@/core/playtime'
import type { PublicTopic } from '@/core/public-content'
import { useAuth } from '@/hooks/auth-context'
import { useAsync } from '@/hooks/use-async'
import { guestCompletedLessonIds, guestXp } from '@/lib/guest-progress'

const lessonPath = (lessonId: string) => `/learn/${lessonId}`

// Guest learn hub (/learn): the featured built-in course up front — its real
// outline, length and progress — with the other built-ins one click away.
// Signed-in users get the full Topics page instead.
export function LearnBrowse() {
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const state = useAsync(() => api.public.topics())

  if (!loading && user) return <Navigate to="/app/topics" replace />

  return (
    <AsyncView state={state}>
      {({ topics }) => {
        const wanted = params.get('topic')
        const featured = topics.find((t) => t.slug === wanted) ?? topics[0]
        if (!featured) {
          return <EmptyState message="No tutorials yet — check back soon" />
        }
        // Re-mount on switch so the featured course reloads its outline.
        return (
          <FeaturedCourse
            key={featured.slug}
            topic={featured}
            others={topics.filter((t) => t.slug !== featured.slug)}
          />
        )
      }}
    </AsyncView>
  )
}

function FeaturedCourse({
  topic,
  others,
}: {
  topic: PublicTopic
  others: PublicTopic[]
}) {
  const state = useAsync(() => api.public.course(topic.slug))
  // Guest progress is device-local; snapshot it on mount (a finished lesson
  // navigates back here, which re-mounts the page).
  const [completedIds] = useState(guestCompletedLessonIds)
  const [xp] = useState(guestXp)

  return (
    <AsyncView state={state}>
      {(outline) =>
        outline.lessons.length === 0 ? (
          <EmptyState message={`${topic.name} has no lessons yet`} />
        ) : (
          <div className="flex flex-col gap-6">
            <section className="grid gap-5 lg:grid-cols-[1fr_20rem]">
              <CourseHero
                topic={topic}
                lessons={outline.lessons}
                completedIds={completedIds}
                hrefFor={lessonPath}
              />
              <GuestProgressCard
                xp={xp}
                lessons={outline.lessons}
                completedIds={completedIds}
              />
            </section>

            <Panel brackets={false} className="rounded-2xl">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <SectionLabel>Course outline</SectionLabel>
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  {outline.lessons.length} lessons ·{' '}
                  {formatPlaytime(totalMinutes(outline.lessons) * 60)}
                </span>
              </div>
              <CourseOutlineList
                lessons={outline.lessons}
                completedIds={completedIds}
                currentLessonId={nextLessonId(outline.lessons, completedIds)}
                hrefFor={lessonPath}
              />
            </Panel>

            {others.length > 0 && <MoreSkills topics={others} />}
            <UnlockStrip />
          </div>
        )
      }
    </AsyncView>
  )
}

const totalMinutes = (lessons: CourseLesson[]) =>
  lessons.reduce((sum, l) => sum + l.estMinutes, 0)

const nextLessonId = (lessons: CourseLesson[], completedIds: Set<string>) =>
  (lessons.find((l) => !completedIds.has(l.lessonId)) ?? lessons[0]).lessonId

// The guest's device-local run: XP banked, lessons done, and the one CTA that
// turns it into a real account before it's lost.
function GuestProgressCard({
  xp,
  lessons,
  completedIds,
}: {
  xp: number
  lessons: CourseLesson[]
  completedIds: Set<string>
}) {
  const done = lessons.filter((l) => completedIds.has(l.lessonId)).length

  return (
    <Panel brackets={false} className="flex flex-col gap-4 rounded-2xl">
      <SectionLabel>Your progress</SectionLabel>

      <div className="flex items-baseline gap-1">
        <span className="font-heading text-4xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
          {xp}
        </span>
        <span className="font-mono text-sm font-semibold text-muted-foreground">
          XP
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3 font-mono text-[10px] tracking-widest uppercase">
        <span className="text-muted-foreground">Lessons done</span>
        <span className="tabular-nums">
          {done} / {lessons.length}
        </span>
      </div>

      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
        {done > 0
          ? 'Saved on this device only — an account keeps it on all of them.'
          : 'Finish a lesson to bank your first XP. No account needed to try.'}
      </p>

      <div className="mt-auto flex flex-col gap-2">
        <Link
          to="/signup"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-mono text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90"
        >
          {done > 0 ? 'Save my progress' : 'Create a free account'}
          <ArrowRight className="size-4" />
        </Link>
        <p className="text-center font-mono text-[10px] text-muted-foreground">
          Already have one?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </Panel>
  )
}

// The other built-in courses — swap the featured one without leaving the page.
function MoreSkills({ topics }: { topics: PublicTopic[] }) {
  return (
    <section>
      <SectionLabel className="mb-3">More skills</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            to={`/learn?topic=${encodeURIComponent(topic.slug)}`}
            className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/60"
          >
            <SkillIcon topic={topic} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-heading text-sm font-bold">
                {topic.name}
              </span>
              <span className="block truncate font-mono text-[11px] text-muted-foreground">
                {topic.description}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function UnlockStrip() {
  return (
    <Panel
      brackets={false}
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-dashed"
    >
      <div>
        <SectionLabel>Beyond the built-ins</SectionLabel>
        <p className="mt-2 max-w-xl font-mono text-xs leading-relaxed text-muted-foreground">
          These tutorials are the free, built-in track. With an account,
          Wolfpack generates a course on any topic you name, grades your written
          answers, and banks every XP you earn.
        </p>
      </div>
      <Link
        to="/signup"
        className="font-mono text-[10px] tracking-widest text-primary uppercase hover:underline"
      >
        Create a free account →
      </Link>
    </Panel>
  )
}
