// Roles, tiers, and the access rules built on them. Pure + framework-agnostic
// so it can be unit-tested and shared by client guards and server checks alike.

export const ROLES = ['user', 'admin'] as const
export type Role = (typeof ROLES)[number]

export const TIERS = ['free', 'pro'] as const
export type Tier = (typeof TIERS)[number]

// The slice of a user needed to make an access decision.
export type Principal = { role: Role; tier: Tier }

// Product features behind the paid tier.
export const PRO_FEATURES = [
  'smart_intervals',
  'unlimited_topics',
  'ai_tutor',
  'advanced_stats',
] as const
export type ProFeature = (typeof PRO_FEATURES)[number]

export type Ability = 'app.access' | 'admin.access' | `feature.${ProFeature}`

// Free accounts can actively learn this many topics at once.
export const FREE_TOPIC_LIMIT = 3

export function isAdmin(p: Principal): boolean {
  return p.role === 'admin'
}

export function isPaid(p: Principal): boolean {
  return p.tier !== 'free'
}

export function can(p: Principal, ability: Ability): boolean {
  if (ability === 'app.access') return true
  if (ability === 'admin.access') return isAdmin(p)
  if (ability.startsWith('feature.')) return isAdmin(p) || isPaid(p)
  return false
}

// True if the principal may enroll another topic given how many they have.
export function withinTopicLimit(p: Principal, currentCount: number): boolean {
  if (isAdmin(p) || isPaid(p)) return true
  return currentCount < FREE_TOPIC_LIMIT
}
