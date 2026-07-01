import { describe, expect, it } from 'vitest'
import type { Principal } from './access'
import {
  DEV_LOGIN_ROLES,
  DEV_ROLE_ACCESS,
  DEV_ROLES,
  isDevLoginRole,
  resolveDevRole,
} from './dev-mode'

const freeUser: Principal = { role: 'user', tier: 'free' }
const proUser: Principal = { role: 'user', tier: 'pro' }
const admin: Principal = { role: 'admin', tier: 'pro' }

describe('dev-mode', () => {
  it('has four ordered positions, off first', () => {
    expect(DEV_ROLES).toEqual(['off', 'unpaid', 'paid', 'admin'])
    expect(DEV_LOGIN_ROLES).toEqual(['unpaid', 'paid', 'admin'])
  })

  it('maps each login position to the right {role, tier}', () => {
    expect(DEV_ROLE_ACCESS.unpaid).toEqual({ role: 'user', tier: 'free' })
    expect(DEV_ROLE_ACCESS.paid).toEqual({ role: 'user', tier: 'pro' })
    expect(DEV_ROLE_ACCESS.admin).toEqual({ role: 'admin', tier: 'pro' })
  })

  it('resolveDevRole reflects the current user', () => {
    expect(resolveDevRole(null)).toBe('off')
    expect(resolveDevRole(freeUser)).toBe('unpaid')
    expect(resolveDevRole(proUser)).toBe('paid')
    expect(resolveDevRole(admin)).toBe('admin')
    // An admin outranks tier regardless of what tier they carry.
    expect(resolveDevRole({ role: 'admin', tier: 'free' })).toBe('admin')
  })

  it('isDevLoginRole guards the endpoint input', () => {
    expect(isDevLoginRole('paid')).toBe(true)
    expect(isDevLoginRole('admin')).toBe(true)
    expect(isDevLoginRole('off')).toBe(false)
    expect(isDevLoginRole('root')).toBe(false)
    expect(isDevLoginRole(null)).toBe(false)
    expect(isDevLoginRole(42)).toBe(false)
  })
})
