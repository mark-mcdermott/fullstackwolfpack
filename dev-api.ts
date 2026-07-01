import type { IncomingMessage, ServerResponse } from 'node:http'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

// Serves the `api/` functions under `npm run dev`, so passkeys work locally
// without `vercel dev`. Each file in api/ exports POST/GET/etc. as a
// (Request) => Response handler — the same shape Vercel runs in production.
export function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()

        const route = url.split('?')[0]
        let file = path.join(server.config.root, `${route}.ts`)
        if (!existsSync(file)) {
          // Fall back to a dynamic segment file (e.g. api/me/[action].ts),
          // matching how Vercel routes `[param].ts` in production.
          const dir = path.dirname(file)
          const dynamic = existsSync(dir)
            ? readdirSync(dir).find((f) => /^\[.+\]\.ts$/.test(f))
            : undefined
          if (!dynamic) return next()
          file = path.join(dir, dynamic)
        }

        try {
          const mod = await server.ssrLoadModule(file)
          const handler = mod[req.method ?? 'GET'] ?? mod.default
          if (typeof handler !== 'function') return next()

          const response = (await handler(await toWebRequest(req))) as Response
          await sendWebResponse(res, response)
        } catch (err) {
          server.config.logger.error(
            `[dev-api] ${route}: ${(err as Error).stack ?? err}`,
          )
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: (err as Error).message }))
        }
      })
    },
  }
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? 'localhost'
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
    else if (value != null) headers.set(key, value)
  }

  let body: Uint8Array | null = null
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    if (chunks.length) body = new Uint8Array(Buffer.concat(chunks))
  }

  return new Request(`http://${host}${req.url}`, {
    method: req.method ?? 'GET',
    headers,
    body,
  })
}

async function sendWebResponse(
  res: ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') res.setHeader(key, value)
  })
  const cookies = response.headers.getSetCookie?.() ?? []
  if (cookies.length) res.setHeader('Set-Cookie', cookies)
  res.end(Buffer.from(await response.arrayBuffer()))
}
