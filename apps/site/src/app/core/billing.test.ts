import { describe, expect, it } from 'vitest'
import { tierForStripeStatus, toDbSubscriptionStatus } from './billing'

describe('tierForStripeStatus', () => {
  it('grants pro for active, trialing and past_due', () => {
    expect(tierForStripeStatus('active')).toBe('pro')
    expect(tierForStripeStatus('trialing')).toBe('pro')
    expect(tierForStripeStatus('past_due')).toBe('pro') // dunning grace
  })
  it('drops to free once the subscription lapses', () => {
    for (const s of [
      'canceled',
      'unpaid',
      'incomplete',
      'incomplete_expired',
      'paused',
    ]) {
      expect(tierForStripeStatus(s)).toBe('free')
    }
  })
})

describe('toDbSubscriptionStatus', () => {
  it('collapses Stripe statuses onto the 3-value enum', () => {
    expect(toDbSubscriptionStatus('active')).toBe('active')
    expect(toDbSubscriptionStatus('trialing')).toBe('active')
    expect(toDbSubscriptionStatus('past_due')).toBe('past_due')
    expect(toDbSubscriptionStatus('canceled')).toBe('canceled')
    expect(toDbSubscriptionStatus('unpaid')).toBe('canceled')
  })
})
