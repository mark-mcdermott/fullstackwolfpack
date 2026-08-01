import {
  Brain,
  Database,
  Gamepad2,
  Palette,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// A recognizable, brand-flavored mark for a learning topic: a filled colored
// monogram tile for languages (JS/CSS/…), or a lucide glyph in a brand color
// for concepts (AI/DB/…). Keyed by a substring of the topic slug+name; unknown
// topics fall back to their initials on a coral tile. Colors are literal class
// strings so Tailwind's JIT keeps them.
type Visual =
  | { mono: string; tile: string }
  | { icon: LucideIcon; color: string }

// Order matters — language keys first so e.g. `html` wins before the `ml` glyph.
const MAP: [string, Visual][] = [
  ['javascript', { mono: 'JS', tile: 'bg-amber-400 text-black' }],
  ['typescript', { mono: 'TS', tile: 'bg-sky-500 text-white' }],
  ['python', { mono: 'Py', tile: 'bg-blue-500 text-white' }],
  ['css', { mono: 'CSS', tile: 'bg-sky-500 text-white' }],
  ['html', { mono: 'HT', tile: 'bg-orange-500 text-white' }],
  ['machine', { icon: Brain, color: 'text-fuchsia-500' }],
  ['ai', { icon: Brain, color: 'text-fuchsia-500' }],
  ['ml', { icon: Brain, color: 'text-fuchsia-500' }],
  ['game', { icon: Gamepad2, color: 'text-emerald-500' }],
  ['database', { icon: Database, color: 'text-violet-500' }],
  ['data', { icon: Database, color: 'text-violet-500' }],
  ['sql', { icon: Database, color: 'text-violet-500' }],
  ['design', { icon: Palette, color: 'text-pink-500' }],
  ['security', { icon: Shield, color: 'text-red-500' }],
]

function resolve(topic: { slug: string; name: string }): Visual {
  const key = `${topic.slug} ${topic.name}`.toLowerCase()
  for (const [k, v] of MAP) if (key.includes(k)) return v
  const initials =
    topic.name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?'
  return { mono: initials, tile: 'bg-primary text-primary-foreground' }
}

export function SkillIcon({
  topic,
  className,
}: {
  topic: { slug: string; name: string }
  className?: string
}) {
  const v = resolve(topic)
  if ('icon' in v) {
    const Icon = v.icon
    return (
      <Icon className={cn('size-8', v.color, className)} strokeWidth={1.75} />
    )
  }
  return (
    <span
      className={cn(
        'flex size-9 items-center justify-center rounded-md text-sm font-bold',
        v.tile,
        className,
      )}
    >
      {v.mono}
    </span>
  )
}
