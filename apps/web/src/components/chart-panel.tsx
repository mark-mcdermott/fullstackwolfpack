import { Bars, Sparkline } from '@/components/charts'
import { Panel, SectionLabel } from '@/components/ui-kit'

// A titled chart card with an honest empty state. Feeds real series into the
// FW-01 chart primitives.
export function ChartPanel({
  label,
  data,
  kind = 'line',
  suffix = '',
}: {
  label: string
  data: number[]
  kind?: 'line' | 'bars'
  suffix?: string
}) {
  const hasData = data.some((v) => v > 0)
  const last = data[data.length - 1] ?? 0
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <SectionLabel>{label}</SectionLabel>
        {hasData && (
          <span className="font-mono text-xs text-primary">
            {last}
            {suffix}
          </span>
        )}
      </div>
      <div className="mt-5 h-32">
        {hasData ? (
          kind === 'bars' ? <Bars data={data} /> : <Sparkline data={data} />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            No data yet — it fills in as you learn
          </div>
        )}
      </div>
    </Panel>
  )
}
