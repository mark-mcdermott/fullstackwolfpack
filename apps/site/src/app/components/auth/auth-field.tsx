import type { LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

// Labelled form input with a leading FW-01 icon. Ported from apps/site
// Field.astro. Takes every native input prop, so `type="password"`,
// `minLength` and `autoComplete` are the caller's to set.
type Props = {
  label: string
  id: string
  icon: LucideIcon
} & ComponentProps<'input'>

export function AuthField({ label, id, icon: Icon, ...input }: Props) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-mono text-[11px] font-bold tracking-widest text-foreground uppercase"
      >
        {label}
      </label>
      <div className="relative mt-2">
        <Icon
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden
        />
        <input
          id={id}
          name={id}
          className="w-full border border-neutral-300 bg-background py-3.5 pr-4 pl-12 font-mono text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none"
          {...input}
        />
      </div>
    </div>
  )
}
