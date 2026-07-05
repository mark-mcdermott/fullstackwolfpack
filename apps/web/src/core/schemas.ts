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

// Expected course-generation duration (ms) + how many samples it averages —
// drives the ETA on the Generate-course progress bar.
export const generationEtaSchema = z.object({
  etaMs: z.number().nonnegative(),
  samples: z.number().int().nonnegative(),
})
export type GenerationEta = z.infer<typeof generationEtaSchema>

// A hosted Stripe URL (Checkout or Billing Portal) the client redirects to.
export const billingRedirectSchema = z.object({ url: z.string().url() })
export type BillingRedirect = z.infer<typeof billingRedirectSchema>

// A completed focus session (timed play/learn cycles) to record. Upper bounds
// match the runtime's config limits so a hand-crafted request can't inflate a
// user's own hours/badge counts with absurd values.
export const focusSessionRequest = z.object({
  playMinutes: z.number().int().min(0).max(960), // 120m play × 8 rounds
  learnMinutes: z.number().int().min(0).max(480), // 60m learn × 8 rounds
  playIntervalMin: z.number().int().min(1).max(120),
  learnIntervalMin: z.number().int().min(1).max(60),
  focusScore: z.number().int().min(0).max(100),
})
export type FocusSessionInput = z.infer<typeof focusSessionRequest>

// XP granted for a recorded focus session (session XP + any streak XP).
export const focusSessionResultSchema = z.object({
  xp: z.number().int().nonnegative(),
})
export type FocusSessionResult = z.infer<typeof focusSessionResultSchema>

// Admin — change a user's role/tier (both optional; at least one meaningful).
export const adminUpdateRequest = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES).optional(),
  tier: z.enum(TIERS).optional(),
})
