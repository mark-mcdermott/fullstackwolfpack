import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// FW-01 design kit — the corner-bracket panels, section labels, stat tiles and
// meters that give every screen the same "tactical HUD" look as the mocks.

function Brackets() {
  const base = 'pointer-events-none absolute size-2.5 border-foreground'
  return (
    <>
      <span className={cn(base, 'top-0 left-0 border-t-2 border-l-2')} />
      <span className={cn(base, 'top-0 right-0 border-t-2 border-r-2')} />
      <span className={cn(base, 'bottom-0 left-0 border-b-2 border-l-2')} />
      <span className={cn(base, 'right-0 bottom-0 border-r-2 border-b-2')} />
    </>
  )
}

export function Panel({
  className,
  children,
  brackets = true,
  ...props
}: ComponentProps<'div'> & { brackets?: boolean }) {
  return (
    <div
      className={cn('relative border border-border bg-card p-5', className)}
      {...props}
    >
      {brackets && <Brackets />}
      {children}
    </div>
  )
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'font-mono text-xs font-medium tracking-widest text-primary uppercase',
        className,
      )}
    >
      // {children}
    </p>
  )
}

export function Pill({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatTile({
  icon: Icon,
  value,
  label,
  sub,
}: {
  icon: LucideIcon
  value: ReactNode
  label: string
  sub?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <Icon className="size-5 text-primary" />
      <span className="text-3xl font-bold tabular-nums">{value}</span>
      <span className="font-mono text-xs tracking-wide uppercase">{label}</span>
      {sub && (
        <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          {sub}
        </span>
      )}
    </div>
  )
}

export function ProgressMeter({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('h-1.5 w-full bg-muted', className)}>
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PageHeading({
  label,
  title,
  subtitle,
}: {
  label: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-6">
      <SectionLabel>{label}</SectionLabel>
      <h1 className="mt-2 text-4xl font-bold tracking-tight uppercase">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-xl font-mono text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span className="font-mono text-sm font-bold tracking-tight">
        FULLSTACK WOLFPACK
      </span>
      <span className="font-mono text-xs tracking-widest text-primary">
        ウルフパック
      </span>
    </div>
  )
}
