import { ChevronRight, Circle, CircleCheck, CircleDot } from 'lucide-react'
import { Link } from 'react-router'
import type { CourseLesson } from '@/core/app-data'
import { cn } from '@/lib/utils'

// The whole course, lesson by lesson — done / current / upcoming, same status
// vocabulary as the mission-control TOC (emerald done, blue current). Every row
// is a link, so the outline doubles as the lesson picker.
export function CourseOutlineList({
  lessons,
  completedIds,
  currentLessonId,
  hrefFor,
}: {
  lessons: CourseLesson[]
  completedIds: Set<string>
  currentLessonId?: string
  hrefFor: (lessonId: string) => string
}) {
  return (
    <ol className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-x-6">
      {lessons.map((lesson, i) => {
        const isDone = completedIds.has(lesson.lessonId)
        const isCurrent = lesson.lessonId === currentLessonId
        const Icon = isDone ? CircleCheck : isCurrent ? CircleDot : Circle
        return (
          <li key={lesson.lessonId}>
            <Link
              to={hrefFor(lesson.lessonId)}
              className={cn(
                'group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                isCurrent
                  ? 'border-accent-blue/40 bg-accent-blue/5'
                  : 'border-transparent hover:border-border hover:bg-muted/40',
              )}
            >
              <span className="w-4 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/60">
                {String(i + 1).padStart(2, '0')}
              </span>
              <Icon
                className={cn(
                  'size-4 shrink-0',
                  isDone
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isCurrent
                      ? 'text-accent-blue'
                      : 'text-muted-foreground/40',
                )}
              />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate font-mono text-sm transition-colors',
                  isCurrent
                    ? 'font-semibold text-foreground'
                    : isDone
                      ? 'text-muted-foreground group-hover:text-foreground'
                      : 'text-foreground/80 group-hover:text-foreground',
                )}
              >
                {lesson.title}
              </span>
              <span className="shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                {lesson.estMinutes} min
              </span>
              <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
