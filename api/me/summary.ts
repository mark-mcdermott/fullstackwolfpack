import { json } from '../_lib/http'
import { getSessionUserId } from '../_lib/session'
import { getUserSummary } from '../../src/server/app-data'

export async function GET(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })
  return json(await getUserSummary(userId))
}
