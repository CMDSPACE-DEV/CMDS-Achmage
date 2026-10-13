import type { App } from 'obsidian'

import type { SmartComposerSettings } from '../../settings/schema/setting.types'
import type { McpConnectionConfig } from '../../types/mcp.types'
import { McpServerStatus } from '../../types/mcp.types'
import { isOptionalPresetSecretQueryParam } from '../research/ResearchSourceRegistry'

import { McpManager } from './mcpManager'

jest.mock('obsidian', () => ({
  Platform: { isDesktop: true },
}))

const transportUrls: URL[] = []

jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: class {
    connect = jest.fn(async () => undefined)
    close = jest.fn(async () => undefined)
    listTools = jest.fn(async () => ({ tools: [] }))
    getServerCapabilities = jest.fn(() => ({ tools: {} }))
  },
}))

jest.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: class {
    constructor(url: URL) {
      transportUrls.push(url)
    }
  },
}))

jest.mock('@modelcontextprotocol/sdk/client/auth.js', () => ({
  UnauthorizedError: class extends Error {},
}))

jest.mock('./desktopFetch', () => ({
  createDesktopMcpFetch: () => jest.fn(),
}))

function remoteConnection(id: string): McpConnectionConfig {
  return {
    id,
    name: 'Korean Law MCP',
    enabled: true,
    transport: {
      type: 'streamable-http',
      url: 'https://mcp.gomdori.app/law',
      legacySse: false,
      secretQueryParams: { oc: 'smart-composer-research-korean-law-oc' },
    },
    auth: { mode: 'none' },
    toolOptions: {},
  }
}

function createManager(
  connection: McpConnectionConfig,
  secrets = new Map<string, string>(),
) {
  let settings = {
    mcp: {
      routingMode: 'auto',
      executionMode: 'per-tool',
      connections: [connection],
    },
  } as SmartComposerSettings
  const app = {
    secretStorage: {
      getSecret: (id: string) => secrets.get(id) ?? null,
      setSecret: (id: string, value: string) => secrets.set(id, value),
    },
  } as unknown as App
  return new McpManager({
    app,
    settings,
    setSettings: async (next) => {
      settings = next
    },
    registerSettingsListener: () => () => undefined,
    isOptionalSecretQueryParam: isOptionalPresetSecretQueryParam,
  })
}

describe('McpManager secret query parameters', () => {
  beforeEach(() => {
    transportUrls.length = 0
  })

  it('connects the Korean Law preset on the shared quota when no OC is stored', async () => {
    const manager = createManager(remoteConnection('research-korean-law'))
    await manager.initialize()

    const state = await manager.scanConnection('research-korean-law')

    // A first scan in per-tool mode lands in review; either way it connected.
    expect([
      McpServerStatus.Connected,
      McpServerStatus.ReviewRequired,
    ]).toContain(state.status)
    expect(transportUrls).toHaveLength(1)
    expect(transportUrls[0].searchParams.has('oc')).toBe(false)
  })

  it('sends the stored OC when one exists', async () => {
    const manager = createManager(
      remoteConnection('research-korean-law'),
      new Map([['smart-composer-research-korean-law-oc', 'my-oc']]),
    )
    await manager.initialize()

    await manager.scanConnection('research-korean-law')

    expect(transportUrls[0].searchParams.get('oc')).toBe('my-oc')
  })

  it('keeps user-made connections strict about a missing credential', async () => {
    const manager = createManager(remoteConnection('user-made-connection'))
    await manager.initialize()

    const state = await manager.scanConnection('user-made-connection')

    expect(state.status).toBe(McpServerStatus.Error)
    expect(
      state.status === McpServerStatus.Error && state.error.message,
    ).toMatch('missing the stored oc credential')
    expect(transportUrls).toHaveLength(0)
  })
})
