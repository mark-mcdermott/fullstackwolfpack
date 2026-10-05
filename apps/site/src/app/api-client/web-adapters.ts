import type { Adapters, HttpClient } from './types'

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

function webHttp(baseUrl = ''): HttpClient {
  return {
    async request<T>(path: string, init?: RequestInit): Promise<T> {
      const headers: Record<string, string> = {
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...(init?.headers as Record<string, string> | undefined),
      }
      const res = await fetch(baseUrl + path, {
        credentials: 'include',
        ...init,
        headers,
      })
      const data: unknown = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message =
          (data as { error?: string }).error ?? `Request failed (${res.status})`
        throw new HttpError(res.status, message)
      }
      return data as T
    },
  }
}

// The web surface's adapters. Capacitor/Tauri/extension provide their own.
export function webAdapters(baseUrl = ''): Adapters {
  return { http: webHttp(baseUrl) }
}
