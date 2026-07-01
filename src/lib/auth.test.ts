import { describe, expect, it } from 'vitest'
import {
  insecureProductionConfig,
  shouldRequireUserVerification,
} from './auth'

describe('shouldRequireUserVerification', () => {
  it('defaults on in production, off in dev', () => {
    expect(shouldRequireUserVerification({}, true)).toBe(true)
    expect(shouldRequireUserVerification({}, false)).toBe(false)
  })

  it('honors the RP_REQUIRE_UV override in either direction', () => {
    expect(shouldRequireUserVerification({ RP_REQUIRE_UV: 'true' }, false)).toBe(true)
    expect(shouldRequireUserVerification({ RP_REQUIRE_UV: 'false' }, true)).toBe(false)
  })
})

describe('insecureProductionConfig', () => {
  it('flags default or missing secrets', () => {
    expect(insecureProductionConfig({ RP_ID: 'localhost' })).toEqual([
      'RP_ID',
      'AUTH_SECRET',
      'ENCRYPTION_KEY',
    ])
  })

  it('passes when every secret is set to a real value', () => {
    expect(
      insecureProductionConfig({
        RP_ID: 'wolfpack.app',
        AUTH_SECRET: 'strong',
        ENCRYPTION_KEY: 'strong',
      }),
    ).toEqual([])
  })
})
