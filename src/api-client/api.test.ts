import { describe, expect, it } from 'vitest'
import { createApi } from './api'
import type { Adapters, PasskeyClient } from './types'

const noPasskeys: PasskeyClient = {
  create: async () => {
    throw new Error('unused')
  },
  get: async () => {
    throw new Error('unused')
  },
}

function withRoutes(routes: Record<string, unknown>) {
  const calls: string[] = []
  const adapters: Adapters = {
    http: {
      request: async <T>(path: string): Promise<T> => {
        calls.push(path)
        if (!(path in routes)) throw new Error(`no route: ${path}`)
        return routes[path] as T
      },
    },
    passkeys: noPasskeys,
  }
  return { api: createApi(adapters), calls }
}

const summary = { displayName: 'Mark', level: 1, xp: 0, xpToNext: 400, levelPct: 0 }
const topic = {
  slug: 'react',
  name: 'React',
  category: 'frontend',
  difficulty: 'beginner',
  pct: 0,
  lessonsCompleted: 0,
  lessonsTotal: 0,
}

describe('api.data', () => {
  it('fetches and parses the user summary', async () => {
    const { api, calls } = withRoutes({ '/api/me/summary': summary })
    expect(await api.data.summary()).toEqual(summary)
    expect(calls).toContain('/api/me/summary')
  })

  it('unwraps the topics list from its envelope', async () => {
    const { api } = withRoutes({ '/api/me/topics': { topics: [topic] } })
    expect(await api.data.topics()).toEqual([topic])
  })

  it('returns the achievements view as-is', async () => {
    const view = { earned: [], inProgress: [], locked: [] }
    const { api } = withRoutes({ '/api/me/achievements': view })
    expect(await api.data.achievements()).toEqual(view)
  })

  it('fetches a course outline by topic slug', async () => {
    const outline = {
      courseId: 'c1',
      topicSlug: 'react',
      status: 'ready',
      lessons: [
        { lessonId: 'l1', title: 'Intro', orderIndex: 0, estMinutes: 5, status: 'not_started' },
      ],
      nextLessonId: 'l1',
    }
    const { api, calls } = withRoutes({ '/api/me/course?topic=react': outline })
    expect(await api.data.course('react')).toEqual(outline)
    expect(calls.some((c) => c.startsWith('/api/me/course'))).toBe(true)
  })

  it('fetches the daily trend series', async () => {
    const series = {
      days: 14,
      xpCumulative: [0, 10, 30],
      minutesByDay: [0, 5, 8],
      accuracyByDay: [0, 100, 50],
    }
    const { api } = withRoutes({ '/api/me/series': series })
    expect(await api.data.series()).toEqual(series)
  })

  it('lists admin users and posts an update', async () => {
    const u = {
      id: 'u1',
      email: 'a@b.com',
      displayName: 'A',
      role: 'admin',
      tier: 'pro',
      xp: 0,
      level: 1,
    }
    const { api, calls } = withRoutes({ '/api/me/admin-users': { users: [u] } })
    expect(await api.admin.users()).toEqual([u])
    await api.admin.updateUser('u1', { role: 'user' })
    expect(calls.filter((c) => c === '/api/me/admin-users').length).toBe(2)
  })

  it('throws on a malformed payload instead of leaking it through', async () => {
    const { api } = withRoutes({ '/api/me/summary': { displayName: 'Mark' } })
    await expect(api.data.summary()).rejects.toThrow()
  })
})

describe('api.integrations + api.courses', () => {
  it('reports OpenAI key status', async () => {
    const { api, calls } = withRoutes({ '/api/me/openai-key': { hasKey: true } })
    expect(await api.integrations.keyStatus()).toEqual({ hasKey: true })
    expect(calls).toContain('/api/me/openai-key')
  })

  it('saves a key and returns the new status', async () => {
    const { api } = withRoutes({ '/api/me/openai-key': { hasKey: true } })
    expect(await api.integrations.saveOpenAiKey('sk-test')).toEqual({ hasKey: true })
  })

  it('enrolls a topic and returns the course id', async () => {
    const { api, calls } = withRoutes({ '/api/me/enroll': { courseId: 'course-1' } })
    expect(await api.courses.enroll('react', 'beginner')).toEqual({
      courseId: 'course-1',
    })
    expect(calls).toContain('/api/me/enroll')
  })
})
