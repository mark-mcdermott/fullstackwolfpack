import type { z } from 'zod'
import { json } from './http'

// Parse a request body against a core schema. On failure, hands back a ready
// 400 Response (first validation message) so handlers stay one-liners.
export async function parseBody<S extends z.ZodType>(
  schema: S,
  req: Request,
): Promise<
  { ok: true; data: z.infer<S> } | { ok: false; response: Response }
> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return {
      ok: false,
      response: json({ error: 'invalid JSON body' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'invalid request'
    return { ok: false, response: json({ error: message }, { status: 400 }) }
  }

  return { ok: true, data: result.data }
}
