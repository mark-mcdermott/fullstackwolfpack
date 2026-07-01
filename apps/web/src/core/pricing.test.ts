import { describe, expect, it } from 'vitest'
import { TIERS } from './access'
import { PLANS, planFor } from './pricing'

describe('pricing', () => {
  it('has a plan for every tier', () => {
    for (const tier of TIERS) {
      expect(planFor(tier).tier).toBe(tier)
    }
  })

  it('free is $0 and pro is paid', () => {
    expect(planFor('free').priceMonthly).toBe(0)
    expect(planFor('pro').priceMonthly).toBeGreaterThan(0)
  })

  it('every plan has features and a cta', () => {
    for (const p of PLANS) {
      expect(p.features.length).toBeGreaterThan(0)
      expect(p.cta).toBeTruthy()
    }
  })
})
