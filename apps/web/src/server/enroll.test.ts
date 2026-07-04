import { describe, expect, it, vi } from 'vitest'
import type { Encrypted } from './crypto'

// enroll.ts imports the Neon db client (which reads DATABASE_URL at load); stub
// it since pickOpenAiKey is pure and never touches the db.
vi.mock('../db', () => ({ db: {} }))

const { pickOpenAiKey } = await import('./enroll')

const cred: Encrypted = { ciphertext: 'ct', iv: 'iv' }
const boom = () => {
  throw new Error('Unsupported state or unable to authenticate data')
}

describe('pickOpenAiKey', () => {
  it('uses the decrypted user key when it is readable', () => {
    expect(pickOpenAiKey(cred, undefined, () => 'sk-user')).toBe('sk-user')
  })

  it('falls back to the env key when the stored key cannot be decrypted', () => {
    // The exact prod symptom: a key encrypted under a rotated ENCRYPTION_KEY.
    expect(pickOpenAiKey(cred, 'sk-env', boom)).toBe('sk-env')
  })

  it('uses the env key when there is no stored credential', () => {
    expect(pickOpenAiKey(null, 'sk-env')).toBe('sk-env')
  })

  it('gives an actionable error when the stored key is unreadable and no env key exists', () => {
    expect(() => pickOpenAiKey(cred, undefined, boom)).toThrow(/re-enter it in settings/i)
  })

  it('gives an actionable error when there is no key at all', () => {
    expect(() => pickOpenAiKey(null, undefined)).toThrow(/no openai key on file/i)
  })
})
