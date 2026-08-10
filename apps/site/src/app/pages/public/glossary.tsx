import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Panel, SectionLabel, cardLiftClass } from '@fw/ui'
import { LessonMarkdown } from '@/components/learn/lesson-markdown'
import { GLOSSARY_ENTRIES, glossaryEntry } from '@/content/glossary-entries'
import { cn } from '@/lib/utils'

// A term's own page — where "Read more" in the popover lands, and a real URL a
// reader can keep or share.
//
// The `see` list at the foot is the part that matters: it is why following a
// term does not strand you. Every entry names the other entries it leans on, so
// the chain from any word terminates instead of handing you another unexplained
// one — the failure the lessons had before, which a glossary would otherwise
// reproduce one level down.
export function GlossaryPage() {
  const { slug = '' } = useParams()
  const entry = glossaryEntry(slug)

  if (!entry) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Panel brackets={false} className={cn('rounded-2xl', cardLiftClass)}>
          <SectionLabel>Not in the glossary</SectionLabel>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            There is no entry for &ldquo;{slug}&rdquo; yet.
          </p>
        </Panel>
        <GlossaryIndex />
      </div>
    )
  }

  const related = (entry.see ?? [])
    .map((s) => glossaryEntry(s))
    .filter((e): e is NonNullable<typeof e> => e !== undefined)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        to="/skill"
        className="inline-flex w-fit items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Skill
      </Link>

      <div>
        <SectionLabel>Glossary</SectionLabel>
        <h1 className="mt-2 font-heading text-3xl tracking-wide text-foreground uppercase">
          {entry.term}
        </h1>
        <p className="mt-2 text-base text-foreground">{entry.short}</p>
      </div>

      <Panel brackets={false} className={cn('rounded-2xl', cardLiftClass)}>
        {/* No `terms`: an entry never linkifies itself, and its outbound links
            are the curated `see` list below rather than whatever words happen
            to match. */}
        <LessonMarkdown>{entry.body}</LessonMarkdown>
      </Panel>

      {related.length > 0 && (
        <div>
          <SectionLabel className="mb-3">Rests on</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/glossary/${r.slug}`}
                className={cn(
                  'group flex flex-col gap-1 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/60',
                  cardLiftClass,
                )}
              >
                <span className="font-heading text-sm font-bold text-foreground">
                  {r.term}
                </span>
                <span className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {r.short}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <GlossaryIndex current={entry.slug} />
    </div>
  )
}

function GlossaryIndex({ current }: { current?: string }) {
  return (
    <div>
      <SectionLabel className="mb-3">Every term</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {GLOSSARY_ENTRIES.map((e) => (
          <Link
            key={e.slug}
            to={`/glossary/${e.slug}`}
            className={cn(
              'rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] transition-colors hover:border-primary/60 hover:text-primary',
              e.slug === current && 'border-primary/60 text-primary',
            )}
          >
            {e.term}
          </Link>
        ))}
      </div>
    </div>
  )
}
