import { requestUrl } from 'obsidian'

import { EagleItemSummary } from './eagle-paths'

const ITEM_POLL_INTERVAL_MS = 250
const ITEM_POLL_TIMEOUT_MS = 10_000
const SWITCH_POLL_INTERVAL_MS = 200
const SWITCH_TIMEOUT_MS = 15_000

type EagleResponse<T> = {
  status?: 'success' | 'error'
  data?: T
  message?: string
}

export type EagleTransport = (input: {
  url: string
  method: 'GET' | 'POST'
  body?: Record<string, unknown>
}) => Promise<{ status: number; json: unknown }>

export type EagleFolderSummary = {
  id: string
  name: string
  /** `Parent/Child` path built while flattening the tree. */
  path: string
  depth: number
}

type EagleFolderNode = {
  id: string
  name: string
  children?: EagleFolderNode[]
}

export type EagleLibraryInfo = { path: string; name: string }

const obsidianTransport: EagleTransport = async ({ url, method, body }) => {
  const response = await requestUrl({
    url,
    method,
    contentType: 'application/json',
    body: body ? JSON.stringify(body) : undefined,
    throw: false,
  })
  return { status: response.status, json: response.json as unknown }
}

export function flattenEagleFolders(
  nodes: EagleFolderNode[],
  parentPath = '',
  depth = 0,
): EagleFolderSummary[] {
  return nodes.flatMap((node) => {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name
    return [
      { id: node.id, name: node.name, path, depth },
      ...flattenEagleFolders(node.children ?? [], path, depth + 1),
    ]
  })
}

export function normalizeLibraryPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '')
}

/**
 * Thin wrapper over Eagle's local HTTP API (https://api.eagle.cool). Library
 * switching follows the protocol CMDS Eagle established against Eagle 4.0.0:
 * the switch POST returns success when the request is ACCEPTED, the API server
 * drops for a few hundred milliseconds, and the library reports as open about
 * a second later. Every poll error is therefore swallowed on purpose.
 */
export class EagleClient {
  constructor(
    private readonly baseUrl: string,
    private readonly transport: EagleTransport = obsidianTransport,
    private readonly sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
    private readonly now: () => number = () => Date.now(),
  ) {}

  async isRunning(): Promise<boolean> {
    try {
      const response = await this.get<unknown>('/api/application/info')
      return response.status === 'success'
    } catch {
      return false
    }
  }

  async addFromPath(input: {
    path: string
    name: string
    annotation?: string
    tags?: string[]
    folderId?: string
  }): Promise<string> {
    const body: Record<string, unknown> = { path: input.path, name: input.name }
    if (input.annotation) body.annotation = input.annotation
    if (input.tags && input.tags.length > 0) body.tags = input.tags
    if (input.folderId) body.folderId = input.folderId
    const response = await this.post<string>('/api/item/addFromPath', body)
    if (response.status !== 'success' || typeof response.data !== 'string') {
      throw new Error(response.message ?? 'Eagle rejected the image.')
    }
    return response.data
  }

  /** Eagle acknowledges an import before the item exists; poll until it does. */
  async waitForItem(id: string): Promise<EagleItemSummary> {
    const deadline = this.now() + ITEM_POLL_TIMEOUT_MS
    while (this.now() < deadline) {
      try {
        const response = await this.get<EagleItemSummary>(
          `/api/item/info?id=${encodeURIComponent(id)}`,
        )
        if (response.status === 'success' && response.data?.id) {
          return response.data
        }
      } catch {
        // Eagle can be busy writing the item; keep polling.
      }
      await this.sleep(ITEM_POLL_INTERVAL_MS)
    }
    throw new Error(`Eagle did not finish importing item ${id}.`)
  }

  async getActiveLibrary(): Promise<EagleLibraryInfo | null> {
    const response = await this.get<{
      library?: string | { path?: string; name?: string }
      path?: string
    }>('/api/library/info')
    const data = response.data
    const path =
      typeof data?.library === 'string'
        ? data.library
        : (data?.library?.path ?? data?.path)
    if (!path) return null
    const name =
      typeof data?.library === 'object' && data.library?.name
        ? data.library.name
        : (path.match(/([^/\\]+)\.library[/\\]?$/i)?.[1] ?? path)
    return { path, name }
  }

  async getLibraryPath(): Promise<string> {
    const active = await this.getActiveLibrary()
    if (!active) throw new Error('Eagle did not report its library path.')
    return active.path
  }

  /** Library paths Eagle has opened before, including the current one. */
  async listLibraryHistory(): Promise<string[]> {
    try {
      const response = await this.get<string[]>('/api/library/history')
      return response.status === 'success' && Array.isArray(response.data)
        ? response.data
        : []
    } catch {
      return []
    }
  }

  /** Folders of the library Eagle currently has open, flattened with paths. */
  async listFolders(): Promise<EagleFolderSummary[]> {
    const response = await this.get<EagleFolderNode[]>('/api/folder/list')
    return flattenEagleFolders(
      response.status === 'success' && Array.isArray(response.data)
        ? response.data
        : [],
    )
  }

  async switchLibrary(
    libraryPath: string,
    options?: { timeoutMs?: number },
  ): Promise<{ success: boolean; activePath: string | null; error?: string }> {
    const timeoutMs = options?.timeoutMs ?? SWITCH_TIMEOUT_MS
    const target = normalizeLibraryPath(libraryPath)
    let current: EagleLibraryInfo | null = null
    try {
      current = await this.getActiveLibrary()
    } catch {
      current = null
    }
    if (current && normalizeLibraryPath(current.path) === target) {
      return { success: true, activePath: current.path }
    }
    const startedAt = this.now()
    try {
      await this.post<null>('/api/library/switch', { libraryPath })
    } catch {
      // The server may already be tearing down for the switch; poll anyway.
    }
    let lastSeen = current?.path ?? null
    while (this.now() - startedAt < timeoutMs) {
      await this.sleep(SWITCH_POLL_INTERVAL_MS)
      try {
        const active = await this.getActiveLibrary()
        if (active) {
          lastSeen = active.path
          if (normalizeLibraryPath(active.path) === target) {
            return { success: true, activePath: active.path }
          }
        }
      } catch {
        // ECONNREFUSED while Eagle restarts its API server. Keep waiting.
      }
    }
    return {
      success: false,
      activePath: lastSeen,
      error: `Eagle did not open "${libraryPath}" within ${timeoutMs} ms.`,
    }
  }

  private async get<T>(endpoint: string): Promise<EagleResponse<T>> {
    const { json } = await this.transport({
      url: `${this.baseUrl}${endpoint}`,
      method: 'GET',
    })
    return (json ?? {}) as EagleResponse<T>
  }

  private async post<T>(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<EagleResponse<T>> {
    const { json } = await this.transport({
      url: `${this.baseUrl}${endpoint}`,
      method: 'POST',
      body,
    })
    return (json ?? {}) as EagleResponse<T>
  }
}
