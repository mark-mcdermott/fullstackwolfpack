import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto'
import process from 'node:process'

// AES-256-GCM at-rest encryption for stored secrets (e.g. the user's OpenAI
// key). The auth tag is appended to the ciphertext. Set ENCRYPTION_KEY in prod.

const ALGORITHM = 'aes-256-gcm'
const TAG_BYTES = 16

function key(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ?? 'dev-insecure-encryption-key-change-me'
  return scryptSync(secret, 'fw-credentials', 32)
}

export type Encrypted = { ciphertext: string; iv: string }

export function encryptSecret(plaintext: string): Encrypted {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    ciphertext: Buffer.concat([enc, tag]).toString('base64'),
    iv: iv.toString('base64'),
  }
}

export function decryptSecret(enc: Encrypted): string {
  const data = Buffer.from(enc.ciphertext, 'base64')
  const iv = Buffer.from(enc.iv, 'base64')
  const tag = data.subarray(data.length - TAG_BYTES)
  const ciphertext = data.subarray(0, data.length - TAG_BYTES)
  const decipher = createDecipheriv(ALGORITHM, key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8')
}

// Pack/unpack the encrypted form into a single string, for storing in a lone
// text column (e.g. users.totp_secret). `iv` and `ciphertext` are base64, which
// never contains ':', so the split is unambiguous.
export function sealSecret(plaintext: string): string {
  const { ciphertext, iv } = encryptSecret(plaintext)
  return `${iv}:${ciphertext}`
}

export function openSecret(sealed: string): string {
  const sep = sealed.indexOf(':')
  if (sep === -1) throw new Error('malformed sealed secret')
  return decryptSecret({
    iv: sealed.slice(0, sep),
    ciphertext: sealed.slice(sep + 1),
  })
}
