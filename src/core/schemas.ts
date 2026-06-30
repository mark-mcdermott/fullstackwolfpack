import { z } from 'zod'

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
})
export type PublicUser = z.infer<typeof publicUserSchema>

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
