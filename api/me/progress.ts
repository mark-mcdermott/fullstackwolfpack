import { json } from '../_lib/http'
import { getSessionUserId } from '../_lib/session'
import { getActivity, getStats, getTopicsView } from '../../src/server/app-data'

export async function GET(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  const [stats, topics, activity] = await Promise.all([
    getStats(userId),
    getTopicsView(userId),
    getActivity(userId),
  ])
  return json({
    stats,
    topics,
    skills: activity.skills,
    activity: activity.activity,
  })
}
