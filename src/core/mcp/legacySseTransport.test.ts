import { createLegacySseTransport } from './legacySseTransport'

const constructed: { url: URL; opts: unknown }[] = []

jest.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: jest
    .fn()
    .mockImplementation((url: URL, opts: unknown) => {
      constructed.push({ url, opts })
      return { url, opts }
    }),
}))

describe('createLegacySseTransport', () => {
  const url = new URL('https://example.com/sse')
  const opts = { requestInit: { headers: { Accept: 'text/event-stream' } } }

  beforeEach(() => {
    constructed.length = 0
  })

  it('constructs the SDK SSE transport without a typed deprecated import', async () => {
    const transport = await createLegacySseTransport(url, opts)
    expect(constructed).toEqual([{ url, opts }])
    expect(transport).toEqual({ url, opts })
  })

  it('throws when the SSE constructor is missing', async () => {
    jest.resetModules()
    jest.doMock('@modelcontextprotocol/sdk/client/sse.js', () => ({}))
    const { createLegacySseTransport: createAfterReset } = await import(
      './legacySseTransport'
    )
    await expect(createAfterReset(url, opts)).rejects.toThrow(
      'MCP SSE transport is unavailable.',
    )
  })
})
