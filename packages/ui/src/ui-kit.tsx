import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from './utils'

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

// The brand wolf mark (branding/logo-small.svg), inlined with fill=currentColor
// so it recolors with the surrounding text and renders reliably at any size —
// crisp on light or dark. Callers set the height; width follows the viewBox.
export function WolfMark({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Fullstack Wolfpack"
      viewBox="0 0 139 162"
      fill="currentColor"
      className={cn('inline-block', className)}
    >
      <path d="M25.27,54.18l6.84-4.14c-1.23,3.45-3.8,4.65-6.84,4.14Z" />
      <path d="M107.18,43.97l-1.21,7.36c-2.19-3.55-5.22-6.55-8.29-7.82.84-3.29,1.19-7.6,2.27-10.99,1.52-4.8,5.28-9.51,7.88-13.12-4.95,8.1-5.32,18.3-5.63,18.3l3.64.02-2.29,4.13,3.64,2.12Z" />
      <rect x="109.73" y="49.94" width="1.71" height="5.83" transform="translate(8.37 120.49) rotate(-59.04)" />
      <rect x="116.15" y="50.15" width=".71" height=".71" transform="translate(-1.59 97.17) rotate(-45)" />
      <path d="M57.8,101.7c-.38-1.21-.95-3.97-1.49-5.06-2.01-2.95-7.88-4.99-11.8-3.98l-6.13-8.32c-.56-.76-2.04-1.97-3.3-3.43l16.02,4.12,5.12,8.91c1.15,2.01,1.76,5.55,1.58,7.75Z" />
      <path d="M33.4,108l-.04-1.07,1.16,1.09.48.49.62.67c6.52,6.99,9.77,8.3,10.16,21.77-1.02-3.5-1.93-7.48-3.82-10.55l-6.59-10.71-.85-.72-.54-.46-.6-.51Z" />
      <path d="M93.23,130.02l.33-9.39,12.16-14.71-7.68,12.34c-2.2,3.54-3.45,7.14-4.82,11.75Z" />
      <rect x="69" y="97" width="1" height="21.5" />
      <rect x="69" y="41" width="1" height="17" />
      <path d="M82.77,93.43c5.65-10.45,6.01-9.33,21.22-12.47-3.19,3.09-5.41,5.51-8.3,8.97l1.09,1.3-.56.51-.81-.87-3.24.89c-4.38,1.21-7.64,2.74-10.78,5.63l.37-3.18-.5-1.87c-.8-2.55-1.81-6.52-2.08-9.24l2.46,9.29,1.13,1.03Z" />
      <polygon points="57.15 93.01 60.34 83.93 61.17 84.57 59.04 92.6 57.15 93.01" />
      <polygon points="69.18 67.05 68.94 59.45 70.28 59 70.03 66.51 69.18 67.05" />
      <polygon points="69.35 88.14 68.91 83.5 69.74 82.95 70.08 86.52 69.35 88.14" />
      <path d="M81.35,99.75c.24,2.59.26,2.77.04.43-.11-1.1-.14-1.49-.04-.43Z" />
      <polygon points="56.25 77.76 56.75 77.26 57.5 78 58.01 78.49 58.51 78.99 59.02 79.47 59.67 80.07 59.56 81.63 58.47 79.99 58.02 79.5 57.51 78.99 57 78.5 56.25 77.76" />
      <polygon points="69.5 92.01 69.52 92.66 69.52 93.34 69.5 93.99 69.48 93.34 69.48 92.66 69.5 92.01" />
      <polygon points="78.98 81.57 83.49 77 83.98 77.5 79.99 81.56 78.98 81.57" />
      <path d="M116.28,0h.45l6.34,34.98c.3,1.61,1.17,3.29,1.07,4.89l-1.38,20.91,9.45,6.98-6,1.8,9.76,17.61,3.04,4.09v1.73s-5.43-.33-5.43-.33l-3.13-1.33,6.34,15.7c.39.96,1.61,2.79,2.23,3.11v.72c-5.48-1.13-14.6.31-17.85,6.29-2.46,4.53-2,11.58-2.44,16.47l-7.18-10.19-28.14,31.97c-1.71,1.94-3.4,4.59-4.74,6.59h-18.64s-2.16-3.72-2.16-3.72l-22.12-24.94-8.43-9.17-7.15,9.53c-.84-7.14-.46-14.41-4.93-18.45C10.68,111.16,4.85,109.44,0,110.69v-1.69c.65-.2,1.85-1.97,2.26-2.91l6.32-14.62L0,91.66v-1.66c.81-.29,2.36-2.1,2.87-3.06l9.35-17.48-5.4-1.69,9.16-6.96c.46-8.24-1.99-16.87-.57-24.08L22.28,0h.43l29.46,33.85c2.89-.21,5.03-.29,7.78-.3l25.33-.14c-9.52,4.55-19.92,3.4-30.41.52-3.07,1.91-5.74,4.79-9.15,8.42.34-4.41-1.51-9.23-3.96-12.4l-.73.78,1.72,12.39-7.28,4.13c-.25.14-.75,1.83-.86,2.09-.11.28-.46.3-.59.06l-.8-1.43c-.45-.79-1.46-3.36-.72-3.88l3.71-2.65-3.96-3.05c.68.12,3.51.49,3.47-.27l-.16-2.91,1.21-1.12-4.5-12.61c1.31,1.37,2.24,2.37,4.44,3.87-3.41-8.27-7.21-13.8-13.28-20.88l-4.66,31.85,4.24,14.47-4.31-6.9,1.18,12.49,3.71.27-7.1,6.89c-.39.38-1.81,1.61-1.45,1.98l1.77,1.81-8.62,17.18,6.92-2.29-6.71,5.94,4.2.17-8.47,19.47c5.38-1.38,7.27,3.32,14.25,4.12l4.36,13.32,4.69-6.39c6.07,6.34,11.44,12.44,17.88,19.91l.81-6.88c.75,2.99.31,9.16,2.15,11.47l7.86,9.85c5.07-.58,9.27-1.8,13.33-4.92l-4.75-4.73c-4.38-.61-5.94-3.56-6.21-7.64l-1.21-17.82c-.34-4.99-.38-9.64.36-14.16l2.43,28.88c6.6-1.13,12.89-1,19.72.01l.55-14.89c.1-2.64.67-5.58,1.34-8.06.31,5.99,1.01,11.39.23,16.88l-1.44,10.2c-.87,6.17-4.89,4.24-10.72,11.39,4.12,3.01,8.28,4,13.39,4.4l7.91-10.11,1.37-10.54.73,7.67,10.2-12.55c2.39-2.94,5.43-5.8,8.69-8.73l3.27,6.31,4.28-12.49,10.75-3.62-3.48-2.47,7.77,1.8c-3.1-7.47-5.69-13.11-9.28-20.5l1.75.32,1.4-1.44-5.17-3.68-1.13-.92c.06-.05.66-.55.59-.5l.77.89,4.65,2.26,1.01-1.04-6.6-15.25,1.76-2-9.12-9.68,4.59,1.44,1.42-13.46-4.25,4.29c5.58-12.95.71-29.47-1.64-44.5-9.05,13.02-19.45,26.22-20.68,38.97-2.61-3.79-5.03-6.82-8.34-8.68L116.28,0ZM40.2,30.49l.41-1.61-.41,1.61ZM36.84,34.41l-.52,1.81.52-1.81ZM129.87,84.38l-1.11.44,1.11-.44ZM128.06,87.94l.99-1.44-.99,1.44Z" />
      <rect x="16.15" y="81.15" width=".71" height=".71" transform="translate(-52.8 35.54) rotate(-45)" />
      <rect x="69.15" y="38.15" width=".71" height=".71" transform="translate(-6.87 60.42) rotate(-45)" />
    </svg>
  )
}

// Horizontal lockup — wolf mark + name. Used in headers/footers.
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <WolfMark className="h-9" />
      <div className="flex flex-col leading-none">
        <span className="font-mono text-sm font-bold tracking-tight">
          FULLSTACK WOLFPACK
        </span>
        <span className="mt-0.5 font-mono text-xs tracking-widest text-primary">
          ウルフパック
        </span>
      </div>
    </div>
  )
}
