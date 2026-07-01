import { z } from 'zod'
import { ROLES, TIERS } from './access'

// The shared contract — pure zod, no DOM, no Node. Imported by every surface
// (web/Capacitor/Tauri/...) AND by the server functions in `api/`, so the
// client and server can never disagree about a shape.

// Field-level vocabulary.
export const emailSchema = z.string().email()
export const displayNameSchema = z.string().min(1).max(80)
export const totpTokenSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code')

// The user every surface and the server agree on (never includes the secret).
export const publicUserSchema = z.object({
  id: z.string(),
  email: emailSchema,
  displayName: displayNameSchema,
  totpEnabled: z.boolean(),
  role: z.enum(ROLES),
  tier: z.enum(TIERS),
})
export type PublicUser = z.infer<typeof publicUserSchema>

// Request DTOs — the server validates these on the way in. The WebAuthn
// `response` is left as unknown here; @simplewebauthn validates its structure.
export const registerOptionsRequest = z.object({
  email: emailSchema,
  displayName: displayNameSchema,
})
export const loginOptionsRequest = z.object({ email: emailSchema })
export const passkeyVerifyRequest = z.object({
  email: emailSchema,
  response: z.unknown(),
})
export const recoverRequest = z.object({
  email: emailSchema,
  token: totpTokenSchema,
})
export const totpEnableRequest = z.object({ token: totpTokenSchema })

// Response DTOs — the client parses these so a bad payload fails loudly.
export const authResultSchema = z.object({
  verified: z.boolean(),
  user: publicUserSchema,
})
export type AuthResult = z.infer<typeof authResultSchema>

export const meResultSchema = z.object({ user: publicUserSchema.nullable() })

export const totpSetupSchema = z.object({ uri: z.string(), secret: z.string() })
export type TotpSetup = z.infer<typeof totpSetupSchema>

export const protectedResultSchema = z.object({ message: z.string() })

// Integrations — the user's OpenAI key. Sent once to be encrypted server-side;
// never returned. `keyStatus` only ever reports whether one is on file.
export const openAiKeyRequest = z.object({
  apiKey: z
    .string()
    .trim()
    .regex(
      /^sk-[A-Za-z0-9_-]{20,}$/,
      'Enter a valid OpenAI key (starts with sk-).',
    ),
})
export const keyStatusSchema = z.object({ hasKey: z.boolean() })
export type KeyStatus = z.infer<typeof keyStatusSchema>

// The user's Anthropic (Claude) key — powers the AI tutor + short-answer grading.
// Same write-only handling as the OpenAI key; Anthropic keys start with `sk-ant-`.
export const anthropicKeyRequest = z.object({
  apiKey: z
    .string()
    .trim()
    .regex(
      /^sk-ant-[A-Za-z0-9_-]{20,}$/,
      'Enter a valid Anthropic key (starts with sk-ant-).',
    ),
})

// Enroll in a topic → generate an AI course for it.
export const enrollRequest = z.object({
  topicSlug: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})
export const enrollResultSchema = z.object({ courseId: z.string() })
export type EnrollResult = z.infer<typeof enrollResultSchema>

// Admin — change a user's role/tier (both optional; at least one meaningful).
export const adminUpdateRequest = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES).optional(),
  tier: z.enum(TIERS).optional(),
})
