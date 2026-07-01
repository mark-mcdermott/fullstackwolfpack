import { openAiKeyRequest } from '../../src/core/schemas'
import {
  hasOpenAiKey,
  saveOpenAiKey,
} from '../../src/server/provider-credentials'
import { json } from '../_lib/http'
import { getSessionUserId } from '../_lib/session'
import { parseBody } from '../_lib/validate'

// Whether the user has an OpenAI key on file — never the key itself.
export async function GET(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })
  return json({ hasKey: await hasOpenAiKey(userId) })
}

// Save (or replace) the key. Encrypted at rest; the response only confirms it.
export async function POST(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  const parsed = await parseBody(openAiKeyRequest, req)
  if (!parsed.ok) return parsed.response

  await saveOpenAiKey(userId, parsed.data.apiKey)
  return json({ hasKey: true })
}
