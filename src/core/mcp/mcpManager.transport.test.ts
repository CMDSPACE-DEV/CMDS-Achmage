import { type Server, type ServerResponse, createServer } from 'http'
import type { AddressInfo, Socket } from 'net'

import type { App } from 'obsidian'

import type { SmartComposerSettings } from '../../settings/schema/setting.types'
import type { McpConnectionConfig } from '../../types/mcp.types'
import { McpServerStatus } from '../../types/mcp.types'

import { McpManager } from './mcpManager'

jest.mock('obsidian', () => ({ Platform: { isDesktop: true } }))

// Exercise the real SDK and desktop HTTP adapter against a loopback server.
// The server intentionally supplies no CORS headers.
describe('McpManager remote transport compatibility', () => {
  let server: Server
  let manager: McpManager
  let url: string
  let postStatus: number
  let eventStream: ServerResponse | undefined
  const sockets = new Set<Socket>()
  const requests: { method: string; path: string; authorization?: string }[] =
    []
  const tools = [{ name: 'lookup', inputSchema: { type: 'object' } }]

  beforeEach(async () => {
    postStatus = 200
    eventStream = undefined
    requests.length = 0
    server = createServer((request, response) => {
      requests.push({
        method: request.method ?? '',
        path: request.url ?? '',
        authorization: request.headers.authorization,
      })
      if (request.method === 'GET') {
        if (postStatus === 200) {
          response.writeHead(405).end()
        } else {
          eventStream = response
          response.writeHead(200, { 'Content-Type': 'text/event-stream' })
          response.write('event: endpoint\ndata: /messages\n\n')
        }
        return
      }
      if (request.url === '/mcp' && postStatus !== 200) {
        response.writeHead(postStatus).end('HTTP transport unavailable')
        return
      }
      const chunks: Buffer[] = []
      request.on('data', (chunk: Buffer) => chunks.push(chunk))
      request.on('end', () => {
        const message = JSON.parse(Buffer.concat(chunks).toString()) as {
          id?: number
          method: string
        }
        if (message.id === undefined) {
          response.writeHead(202).end()
          return
        }
        const result =
          message.method === 'initialize'
            ? {
                protocolVersion: '2025-03-26',
                serverInfo: { name: 'loopback-fixture', version: '1.0.0' },
                capabilities: { tools: {} },
              }
            : { tools }
        const payload = JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          result,
        })
        if (request.url === '/messages') {
          eventStream?.write(`event: message\ndata: ${payload}\n\n`)
          response.writeHead(202).end()
        } else {
          response.writeHead(200, { 'Content-Type': 'application/json' })
          response.end(payload)
        }
      })
    })
    server.on('connection', (socket) => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('Browser fetch must not be used'))
  })

  afterEach(async () => {
    await manager?.disconnectConnection('remote')
    manager?.cleanup()
    for (const socket of sockets) socket.destroy()
    await new Promise<void>((resolve) => server.close(() => resolve()))
    jest.restoreAllMocks()
  })

  async function scan(legacySse = false) {
    const config: McpConnectionConfig = {
      id: 'remote',
      name: 'Remote fixture',
      enabled: true,
      transport: { type: 'streamable-http', url, legacySse },
      auth: { mode: 'bearer', bearerSecretId: 'fixture-token' },
      toolOptions: {},
    }
    manager = new McpManager({
      app: {
        secretStorage: {
          getSecret: () => 'fixture-only-token',
          setSecret: () => undefined,
        },
      } as unknown as App,
      settings: {
        mcp: {
          connections: [config],
          routingMode: 'auto',
          executionMode: 'per-tool',
        },
      } as SmartComposerSettings,
      setSettings: async () => undefined,
      registerSettingsListener: () => () => undefined,
    })
    await manager.initialize()
    return manager.scanConnection('remote')
  }

  it('scans tools over Streamable HTTP without trying legacy SSE', async () => {
    const state = await scan()
    expect(state.status).toBe(McpServerStatus.ReviewRequired)
    expect('tools' in state && state.tools).toEqual(tools)
    expect(requests.some((request) => request.path === '/messages')).toBe(false)
    expect(requests[0]).toEqual({
      method: 'POST',
      path: '/mcp',
      authorization: 'Bearer fixture-only-token',
    })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it.each([400, 404, 405])(
    'falls back automatically after HTTP %s and scans SSE tools',
    async (status) => {
      postStatus = status
      const state = await scan()
      expect(state.status).toBe(McpServerStatus.ReviewRequired)
      expect('tools' in state && state.tools).toEqual(tools)
      expect(
        requests.slice(0, 3).map(({ method, path }) => `${method} ${path}`),
      ).toEqual(['POST /mcp', 'GET /mcp', 'POST /messages'])
      expect(
        requests.every(
          ({ authorization }) => authorization === 'Bearer fixture-only-token',
        ),
      ).toBe(true)
      expect(globalThis.fetch).not.toHaveBeenCalled()
    },
  )

  it('preserves direct SSE for explicitly saved legacy configurations', async () => {
    postStatus = 405
    const state = await scan(true)
    expect(state.status).toBe(McpServerStatus.ReviewRequired)
    expect('tools' in state && state.tools).toEqual(tools)
    expect(requests[0].method).toBe('GET')
    expect(
      requests.some(({ method, path }) => method === 'POST' && path === '/mcp'),
    ).toBe(false)
  })

  it.each([401, 403, 429, 500])(
    'does not reinterpret HTTP %s as an SSE-only endpoint',
    async (status) => {
      postStatus = status
      const state = await scan()
      expect(state.status).toBe(McpServerStatus.Error)
      expect(requests.map(({ method, path }) => `${method} ${path}`)).toEqual([
        'POST /mcp',
      ])
    },
  )
})
