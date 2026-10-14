import { type Server, createServer } from 'http'
import type { AddressInfo, Socket } from 'net'
import { brotliCompressSync, deflateRawSync, deflateSync, gzipSync } from 'zlib'

import { createDesktopMcpFetch } from './desktopFetch'

describe('Node HTTP MCP boundary', () => {
  let server: Server
  let origin: string
  const sockets = new Set<Socket>()
  const fetch = createDesktopMcpFetch()
  beforeAll(async () => {
    server = createServer((request, response) => {
      const route = request.url ?? ''
      if (route === '/stream') {
        response.writeHead(200, { 'Content-Type': 'text/event-stream' })
        response.write('data: first\n\n')
        return
      }
      if (route === '/redirect') {
        response.writeHead(307, { Location: '/echo' }).end()
        return
      }
      if (route === '/cross') {
        response
          .writeHead(302, {
            Location: `${origin.replace('127.0.0.1', 'localhost')}/echo`,
          })
          .end()
        return
      }
      if (route === '/loop') {
        response.writeHead(302, { Location: '/loop' }).end()
        return
      }
      if (route === '/empty') {
        response.writeHead(204).end()
        return
      }
      const compression = {
        '/gzip': gzipSync,
        '/deflate': deflateSync,
        '/raw-deflate': deflateRawSync,
        deflateRawSync,
        '/br': brotliCompressSync,
      }[route]
      if (compression) {
        response.writeHead(200, {
          'Content-Encoding':
            route === '/raw-deflate' ? 'deflate' : route.slice(1),
        })
        response.end(compression(Buffer.from('한글 compressed')))
        return
      }
      const chunks: Buffer[] = []
      request.on('data', (chunk: Buffer) => chunks.push(chunk))
      request.on('end', () =>
        response.end(
          JSON.stringify({
            method: request.method,
            auth: request.headers.authorization,
            cookie: request.headers.cookie,
            body: Buffer.concat(chunks).toString(),
          }),
        ),
      )
    })
    server.on('connection', (socket) => {
      sockets.add(socket)
      socket.once('close', () => sockets.delete(socket))
    })
    await new Promise<void>((resolve) => server.listen(0, resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  afterAll(async () => {
    for (const socket of sockets) socket.destroy()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it.each(['gzip', 'deflate', 'br', 'raw-deflate'])(
    'decodes %s without changing body bytes',
    async (encoding) => {
      expect(await (await fetch(`${origin}/${encoding}`)).text()).toBe(
        '한글 compressed',
      )
    },
  )
  it('preserves body and authorization on a same-origin 307', async () => {
    const response = await fetch(`${origin}/redirect`, {
      method: 'POST',
      headers: { Authorization: 'Bearer synthetic' },
      body: 'rpc',
    })
    expect(await response.json()).toEqual({
      method: 'POST',
      auth: 'Bearer synthetic',
      body: 'rpc',
    })
  })
  it('strips credentials when redirecting to another origin', async () => {
    const response = await fetch(`${origin}/cross`, {
      headers: { Authorization: 'Bearer synthetic', Cookie: 'test=1' },
    })
    expect(await response.json()).toEqual({ method: 'GET', body: '' })
  })
  it('honors manual and error redirects, and bounds redirect loops', async () => {
    const response = await fetch(`${origin}/redirect`, { redirect: 'manual' })
    expect(response.status).toBe(307)
    await response.body?.cancel()
    await expect(
      fetch(`${origin}/redirect`, { redirect: 'error' }),
    ).rejects.toThrow()
    await expect(fetch(`${origin}/loop`)).rejects.toThrow()
  })
  it('returns null bodies for 204', async () => {
    expect((await fetch(`${origin}/empty`)).body).toBeNull()
  })
  it('delivers the first SSE chunk before connection close and cancels the stream', async () => {
    const response = await fetch(`${origin}/stream`)
    if (!response.body) throw new Error('Expected streaming response')
    const reader = response.body.getReader()
    const first = await reader.read()
    expect(new TextDecoder().decode(first.value)).toBe('data: first\n\n')
    await reader.cancel()
  })
  it('rejects pre-aborted requests and aborts an active response', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      fetch(`${origin}/echo`, { signal: controller.signal }),
    ).rejects.toThrow()
    const active = new AbortController()
    const response = await fetch(`${origin}/stream`, { signal: active.signal })
    if (!response.body) throw new Error('Expected streaming response')
    const reader = response.body.getReader()
    await reader.read()
    const pending = reader.read()
    active.abort()
    await expect(pending).rejects.toThrow()
  })
})
