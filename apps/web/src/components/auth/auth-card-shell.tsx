import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@fw/ui'

// Bordered auth card with FW-01 dark corner triangles + a red eyebrow.
// Shared shell for the sign-in and sign-up forms (ported from the Astro cards).
const triTopRight: CSSProperties = {
  borderWidth: '18px 0 0 18px',
  borderStyle: 'solid',
  borderColor: 'var(--foreground) transparent transparent transparent',
}
const triBottomLeft: CSSProperties = {
  borderWidth: '18px 0 0 18px',
  borderStyle: 'solid',
  borderColor: 'transparent transparent transparent var(--foreground)',
}

export function AuthCardShell({
  eyebrow,
  className,
  children,
}: {
  eyebrow: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border border-neutral-300 bg-background p-6 sm:p-10',
        className,
      )}
    >
      <span
        className="pointer-events-none absolute top-0 right-0 h-0 w-0"
        style={triTopRight}
      />
      <span
        className="pointer-events-none absolute bottom-0 left-0 h-0 w-0"
        style={triBottomLeft}
      />
      <p className="font-mono text-xs tracking-normal text-primary uppercase">
        // {eyebrow}
      </p>
      {children}
    </div>
  )
}
