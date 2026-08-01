import { PageHeading, Panel, SectionLabel } from '@fw/ui'
import { EMBED_CATALOG } from '@/lib/embed-catalog'
import { ROM_CATALOG } from '@/lib/rom-catalog'

// Every bundled game's attribution in one place — satisfies the keep-the-notice
// / credit obligation for the permissive & CC-BY titles and links the source for
// the copyleft ones. Rendered straight from the manifests, so a new game shows
// up here automatically (and the CI guard fails if its LICENSE is missing).
export function CreditsPage() {
  return (
    <div>
      <PageHeading
        label="Credits"
        title="Licenses & credits"
        subtitle="Every bundled game, its author, and its license."
      />
      <div className="flex flex-col gap-5">
        <Panel>
          <SectionLabel>Web games</SectionLabel>
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {EMBED_CATALOG.map((g) => (
              <li key={g.id} className="flex flex-col gap-1 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-bold uppercase">{g.title}</span>
                  <a
                    href={g.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] tracking-widest text-primary uppercase hover:underline"
                  >
                    {g.license} · source ↗
                  </a>
                </div>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  by {g.author}
                </p>
                {g.credits && g.credits.length > 0 && (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Assets: {g.credits.join(' · ')}
                  </p>
                )}
                {g.modifications && (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Modified: {g.modifications}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionLabel>Retro (ROM) games</SectionLabel>
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {ROM_CATALOG.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-bold uppercase">{r.title}</span>
                  <span className="font-mono text-[10px] tracking-widest text-primary uppercase">
                    {r.license}
                  </span>
                </div>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  by {r.author}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          Full license texts ship with each web game under{' '}
          <code>public/games/&lt;game&gt;/LICENSE</code>. Emulator cores are
          provided by the libretro project under their respective licenses.
        </p>
      </div>
    </div>
  )
}
