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

  it('throws on a malformed payload instead of leaking it through', async () => {
    const { api } = withRoutes({ '/api/me/summary': { displayName: 'Mark' } })
    await expect(api.data.summary()).rejects.toThrow()
  })
})
