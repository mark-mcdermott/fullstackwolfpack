import { json } from '../_lib/http'
import { getSessionUserId } from '../_lib/session'
import {
  getActivity,
  getStats,
  getTopicsView,
  getUserSummary,
} from '../../src/server/app-data'

export async function GET(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  const [user, stats, topics, activity] = await Promise.all([
    getUserSummary(userId),
    getStats(userId),
    getTopicsView(userId),
    getActivity(userId),
  ])

  return json({
    user,
    stats,
    focus: topics.slice(0, 3),
    recentLessons: activity.recentLessons,
    weekActivity: activity.weekActivity,
  })
}
