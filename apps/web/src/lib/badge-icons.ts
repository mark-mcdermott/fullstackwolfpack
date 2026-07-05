import {
  Award,
  Bug,
  CalendarCheck,
  Cpu,
  Crown,
  FileCode,
  Flame,
  GraduationCap,
  Sparkles,
  Sunrise,
  Target,
  Terminal,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

// Per-badge art: a distinct lucide glyph per achievement slug (keeps the Badges
// grid readable at a glance instead of one repeated shield). Falls back to a
// generic award for any slug without a bespoke icon.
const BADGE_ICONS: Record<string, LucideIcon> = {
  'week-warrior': CalendarCheck,
  'focus-mode': Target,
  'typescript-novice': FileCode,
  'hot-streak': Flame,
  'learning-machine': Cpu,
  'bug-hunter': Bug,
  'cli-commander': Terminal,
  'early-bird': Sunrise,
  'quiz-master': GraduationCap,
  legend: Crown,
  perfectionist: Sparkles,
  'master-wolf': Trophy,
}

export function badgeIcon(slug: string): LucideIcon {
  return BADGE_ICONS[slug] ?? Award
}
