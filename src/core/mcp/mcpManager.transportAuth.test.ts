import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js'
import { StreamableHTTPError } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { App } from 'obsidian'

import type { SmartComposerSettings } from '../../settings/schema/setting.types'
import { McpServerStatus } from '../../types/mcp.types'

import { McpManager } from './mcpManager'

jest.mock('obsidian', () => ({ Platform: { isDesktop: true } }))

const mockConnect = jest.fn()
const mockCloseClient = jest.fn(async () => undefined)
const mockCloseCallback = jest.fn(async () => undefined)
const mockTransports: {
  kind: string
  close: jest.Mock
  finishAuth: jest.Mock
}[] = []

function mockTransport(kind: string) {
  const transport = {
    kind,
    close: jest.fn(async () => undefined),
    finishAuth: jest.fn(async () => undefined),
  }
  mockTransports.push(transport)
  return transport
}

jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: class {
    connect = mockConnect
    close = mockCloseClient
    listTools = jest.fn(async () => ({ tools: [] }))
    getServerCapabilities = jest.fn(() => ({ tools: {} }))
  },
}))
jest.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: jest.fn(() => mockTransport('http')),
  StreamableHTTPError: class extends Error {
    constructor(
      public code: number,
      message: string,
    ) {
      super(message)
    }
  },
}))
jest.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: jest.fn(() => mockTransport('sse')),
}))
jest.mock('./McpOAuthProvider', () => ({
  McpOAuthProvider: class {},
  generateMcpOAuthState: () => 'fixture-state',
  startMcpOAuthCallbackSession: async () => ({
    redirectUrl: new URL('http://127.0.0.1/callback'),
    waitForCode: Promise.resolve('fixture-code'),
    close: mockCloseCallback,
  }),
}))
jest.mock('./desktopFetch', () => ({ createDesktopMcpFetch: () => jest.fn() }))

describe('McpManager authorization across transport negotiation', () => {
  let manager: McpManager

  beforeEach(async () => {
    jest.clearAllMocks()
    mockConnect.mockReset().mockResolvedValue(undefined)
    mockTransports.length = 0
    manager = new McpManager({
      app: {
        secretStorage: { getSecret: () => null, setSecret: () => undefined },
      } as unknown as App,
      settings: {
        mcp: {
          connections: [
            {
              id: 'remote',
              name: 'Remote',
              enabled: true,
              transport: {
                type: 'streamable-http',
                url: 'https://example.com/mcp',
                legacySse: false,
              },
              auth: { mode: 'automatic' },
              toolOptions: {},
            },
          ],
          routingMode: 'auto',
          executionMode: 'per-tool',
        },
      } as SmartComposerSettings,
      setSettings: async () => undefined,
      registerSettingsListener: () => () => undefined,
    })
    await manager.initialize()
  })

  afterEach(() => manager.cleanup())

  it.each([false, true])(
    'finishes interactive authorization with fallback=%s',
    async (fallback) => {
      if (fallback)
        mockConnect.mockRejectedValueOnce(
          new StreamableHTTPError(404, 'Not found'),
        )
      mockConnect.mockRejectedValueOnce(new UnauthorizedError())

      const result = await manager.connectAndAuthorize('remote')

      expect(result.status).toBe(McpServerStatus.ReviewRequired)
      expect(mockTransports.map(({ kind }) => kind)).toEqual(
        fallback ? ['http', 'sse', 'sse'] : ['http', 'http'],
      )
      const challenged = mockTransports[fallback ? 1 : 0]
      expect(challenged.finishAuth).toHaveBeenCalledWith('fixture-code')
      expect(challenged.close).toHaveBeenCalled()
      expect(mockCloseCallback).toHaveBeenCalledTimes(1)
      expect(mockTransports[0].close).toHaveBeenCalled()
    },
  )

  it.each([false, true])(
    'reports non-interactive auth required with fallback=%s',
    async (fallback) => {
      if (fallback)
        mockConnect.mockRejectedValueOnce(
          new StreamableHTTPError(405, 'Method not allowed'),
        )
      mockConnect.mockRejectedValueOnce(new UnauthorizedError())

      const result = await manager.scanConnection('remote')

      expect(result.status).toBe(McpServerStatus.AuthenticationRequired)
      expect(mockTransports.map(({ kind }) => kind)).toEqual(
        fallback ? ['http', 'sse'] : ['http'],
      )
      expect(
        mockTransports.every(({ close }) => close.mock.calls.length > 0),
      ).toBe(true)
      expect(
        mockTransports.every(
          ({ finishAuth }) => finishAuth.mock.calls.length === 0,
        ),
      ).toBe(true)
    },
  )

  it('does not fall back on a network failure and closes the callback', async () => {
    mockConnect.mockRejectedValueOnce(new Error('Network unavailable'))

    const result = await manager.connectAndAuthorize('remote')

    expect(result.status).toBe(McpServerStatus.Error)
    expect(mockTransports.map(({ kind }) => kind)).toEqual(['http'])
    expect(mockCloseCallback).toHaveBeenCalledTimes(1)
    expect(mockCloseClient).toHaveBeenCalled()
  })

  it('surfaces a failed SSE fallback without repeating negotiation', async () => {
    mockConnect.mockRejectedValueOnce(new StreamableHTTPError(404, 'Not found'))
    mockConnect.mockRejectedValueOnce(new Error('SSE unavailable'))

    const result = await manager.connectAndAuthorize('remote')

    expect(result.status).toBe(McpServerStatus.Error)
    expect(
      result.status === McpServerStatus.Error && result.error.message,
    ).toContain('SSE unavailable')
    expect(mockConnect).toHaveBeenCalledTimes(2)
    expect(mockCloseCallback).toHaveBeenCalledTimes(1)
  })
})
