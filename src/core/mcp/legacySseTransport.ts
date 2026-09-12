import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

export type LegacySseTransportOptions = {
  authProvider?: OAuthClientProvider
  requestInit?: RequestInit
  fetch?: typeof fetch
}

export type McpHttpTransport = Transport & {
  finishAuth(authorizationCode: string): Promise<void>
}

type LegacySseTransportConstructor = new (
  url: URL,
  opts?: LegacySseTransportOptions,
) => McpHttpTransport

/**
 * MCP still ships SSE for servers that have not migrated to Streamable HTTP.
 * The SDK marks that constructor deprecated; StreamableHTTP is not a safe
 * fallback for `legacySse` endpoints. Read the constructor untyped so
 * `@typescript-eslint/no-deprecated` stays clean (disabling that rule is
 * Error-tier forbidden).
 */
export async function createLegacySseTransport(
  url: URL,
  opts: LegacySseTransportOptions,
): Promise<McpHttpTransport> {
  const sseModule: object = await import(
    '@modelcontextprotocol/sdk/client/sse.js'
  )
  const TransportCtor: unknown = Reflect.get(sseModule, 'SSEClientTransport')
  if (typeof TransportCtor !== 'function') {
    throw new Error('MCP SSE transport is unavailable.')
  }
  return new (TransportCtor as LegacySseTransportConstructor)(url, opts)
}
