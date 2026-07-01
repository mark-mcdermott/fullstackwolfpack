import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import type { RecentLesson } from '@/core/app-data'
import { cn } from '@/lib/utils'

// A user's recent lessons; rows deep-link into the player when a lessonId is
// present. Shared by the dashboard and the sessions ("continue") page.
export function RecentLessons({
  lessons,
  emptyText,
}: {
  lessons: RecentLesson[]
  emptyText: string
}) {
  if (lessons.length === 0) {
    return (
      <p className="font-mono text-[10px] text-muted-foreground">{emptyText}</p>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {lessons.map((l, i) => {
        const inner = (
          <>
            <CheckCircle2
              className={cn(
                'size-4 shrink-0',
                l.status === 'completed' ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{l.title}</p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                {l.topic} · {l.minutes} min
              </p>
            </div>
            <span className="font-mono text-xs text-primary">
              {l.score !== null ? `${l.score}%` : 'In progress'}
            </span>
          </>
        )
        return l.lessonId ? (
          <Link
            key={l.lessonId}
            to={`/app/learn/${l.lessonId}`}
            className="-mx-2 flex items-center gap-3 rounded px-2 py-3 hover:bg-muted/50"
          >
            {inner}
          </Link>
        ) : (
          <div key={`${l.title}-${i}`} className="flex items-center gap-3 py-3">
            {inner}
          </div>
        )
      })}
    </div>
  )
}
