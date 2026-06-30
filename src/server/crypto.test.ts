import { describe, expect, it } from 'vitest'
import { decryptSecret, encryptSecret } from './crypto'

describe('crypto', () => {
  it('round-trips a secret', () => {
    const enc = encryptSecret('sk-test-12345')
    expect(enc.ciphertext).not.toContain('sk-test')
    expect(decryptSecret(enc)).toBe('sk-test-12345')
  })

  it('uses a fresh iv each time', () => {
    expect(encryptSecret('x').iv).not.toBe(encryptSecret('x').iv)
  })

  it('throws on tampered ciphertext', () => {
    const enc = encryptSecret('secret')
    expect(() =>
      decryptSecret({
        ...enc,
        ciphertext: Buffer.from('garbage-garbage-').toString('base64'),
      }),
    ).toThrow()
  })
})
