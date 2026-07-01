import { describe, expect, it } from 'vitest'
import {
  FREE_TOPIC_LIMIT,
  can,
  isAdmin,
  isPaid,
  withinTopicLimit,
  type Principal,
} from './access'

const freeUser: Principal = { role: 'user', tier: 'free' }
const proUser: Principal = { role: 'user', tier: 'pro' }
const admin: Principal = { role: 'admin', tier: 'free' }

describe('access', () => {
  it('any authenticated principal can access the app', () => {
    expect(can(freeUser, 'app.access')).toBe(true)
    expect(can(proUser, 'app.access')).toBe(true)
    expect(can(admin, 'app.access')).toBe(true)
  })

  it('only admins can access the admin area', () => {
    expect(can(admin, 'admin.access')).toBe(true)
    expect(can(freeUser, 'admin.access')).toBe(false)
    expect(can(proUser, 'admin.access')).toBe(false)
  })

  it('pro features require a paid tier; admins always pass', () => {
    expect(can(freeUser, 'feature.ai_tutor')).toBe(false)
    expect(can(proUser, 'feature.ai_tutor')).toBe(true)
    expect(can(admin, 'feature.ai_tutor')).toBe(true)
  })

  it('isAdmin / isPaid helpers', () => {
    expect(isAdmin(admin)).toBe(true)
    expect(isAdmin(freeUser)).toBe(false)
    expect(isPaid(proUser)).toBe(true)
    expect(isPaid(freeUser)).toBe(false)
    expect(isPaid(admin)).toBe(false)
  })

  it('free tier is capped at FREE_TOPIC_LIMIT; pro and admin are unlimited', () => {
    expect(withinTopicLimit(freeUser, FREE_TOPIC_LIMIT - 1)).toBe(true)
    expect(withinTopicLimit(freeUser, FREE_TOPIC_LIMIT)).toBe(false)
    expect(withinTopicLimit(proUser, 999)).toBe(true)
    expect(withinTopicLimit(admin, 999)).toBe(true)
  })
})
