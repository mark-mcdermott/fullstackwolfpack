import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { SkillIcon } from '@/components/launch/skill-icon'
import {
  Panel,
  ProgressMeter,
  SectionLabel,
  cardLiftClass,
  raisedCtaClass,
  raisedCtaCompactClass,
} from '@fw/ui'
import { cn } from '@/lib/utils'
import type { CourseLesson } from '@/core/app-data'
import { XP } from '@/core/learning'
import { formatPlaytime } from '@/core/playtime'

// The featured-course splash at the top of Learn: what the course is, how long
// it runs, how far in you are, and one CTA straight into the next lesson.
// Everything shown is real course data — lesson count, estimated minutes and
// the XP policy — so the page states the depth instead of claiming it.
// Theme-aware like the home hero: the skyline stays dark in both themes behind
// a `from-card` wash so the copy reads.
export function CourseHero({
  topic,
  lessons,
  completedIds,
  hrefFor,
  eyebrow = 'Learn',
}: {
  topic: { slug: string; name: string; description?: string }
  lessons: CourseLesson[]
  completedIds: Set<string>
  hrefFor: (lessonId: string) => string
  eyebrow?: string
}) {
  const done = lessons.filter((l) => completedIds.has(l.lessonId)).length
  const next = lessons.find((l) => !completedIds.has(l.lessonId)) ?? lessons[0]
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0
  const minutes = lessons.reduce((sum, l) => sum + l.estMinutes, 0)

  return (
    <Panel
      brackets={false}
      className={cn(
        'relative min-h-[17rem] overflow-hidden rounded-2xl p-0 md:min-h-[19rem]',
        cardLiftClass,
      )}
    >
      <img
        src="/images/footer-2.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-y-0 right-0 h-full w-full object-cover object-right [mask-image:linear-gradient(to_right,transparent,black_20%)] md:w-[62%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-card from-25% via-card/85 to-card/40 md:via-card/70 md:to-transparent" />

      <div className="relative flex h-full flex-col gap-5 p-6 sm:p-8">
        <SectionLabel>{eyebrow}</SectionLabel>

        <div>
          <div className="flex items-center gap-3">
            <SkillIcon topic={topic} className="size-11 text-base" />
            <h1 className="font-heading text-4xl leading-[0.95] font-bold uppercase md:text-5xl">
              {topic.name}
            </h1>
          </div>
          {topic.description && (
            <p className="mt-3 max-w-sm font-mono text-sm text-muted-foreground">
              {topic.description}
            </p>
          )}
        </div>

        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {lessons.length} lessons
          {minutes > 0 && <> · {formatPlaytime(minutes * 60)} total</>} · +
          {XP.lessonBase} XP per lesson
        </p>

        <div className="mt-auto flex flex-col gap-4">
          <div className="max-w-sm">
            <div className="flex items-baseline justify-between font-mono text-[10px] tracking-widest uppercase">
              <span className="text-muted-foreground">
                {done} / {lessons.length} lessons done
              </span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <ProgressMeter
              value={pct}
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/15"
            />
          </div>

          {next && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {/* `flare`, the launcher's variant, rather than the hero's
                  `ember`: this button sits on the skyline plate, and ember is
                  all but out by 70% of its width — tuned to read against the
                  home hero's high-key art, it sinks into this one. `max-w-full`
                  because the label carries a lesson title, so the CTA's `w-fit`
                  has to be able to give. */}
              <Link
                to={hrefFor(next.lessonId)}
                className={cn(
                  raisedCtaClass,
                  raisedCtaCompactClass,
                  'cta-flare max-w-full',
                )}
              >
                <span className="truncate">
                  {done > 0 ? 'Continue' : 'Start'}: {next.title}
                </span>
                <ArrowRight className="size-4 shrink-0" />
              </Link>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                {next.estMinutes} min
              </span>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}
