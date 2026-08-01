import type { Tier } from './access'

// Pure billing policy — maps Stripe subscription statuses to our entitlement
// tier and to the narrow DB status enum. No Stripe SDK, no DB: unit-tested and
// shared by the server billing functions and the webhook handler.

// Stripe statuses that grant the paid tier. `past_due` keeps access during the
// dunning/retry window; a subscription only loses Pro once it truly lapses
// (canceled / unpaid / incomplete / paused).
const PRO_STATUSES = new Set(['active', 'trialing', 'past_due'])

export function tierForStripeStatus(status: string): Tier {
  return PRO_STATUSES.has(status) ? 'pro' : 'free'
}

// Our `subscription_status` pg enum only has these three values.
export type DbSubscriptionStatus = 'active' | 'canceled' | 'past_due'

export function toDbSubscriptionStatus(status: string): DbSubscriptionStatus {
  if (status === 'past_due') return 'past_due'
  if (status === 'active' || status === 'trialing') return 'active'
  return 'canceled'
}
