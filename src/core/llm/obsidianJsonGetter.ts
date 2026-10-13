import { requestUrl } from 'obsidian'

import type { JsonGetter } from './modelDiscovery'

/**
 * GET through Obsidian's `requestUrl`: it bypasses CORS (the Codex backend and
 * several vendor APIs reject browser-origin fetches) and needs no streaming.
 * The error message carries the status only, never the response headers, so
 * a credential echoed by a proxy cannot reach a Notice.
 */
export const obsidianJsonGetter: JsonGetter = async (url, headers) => {
  const response = await requestUrl({
    url,
    method: 'GET',
    headers,
    throw: false,
  })
  if (response.status < 200 || response.status >= 300) {
    throw new ModelListHttpError(response.status)
  }
  return response.json as unknown
}

export class ModelListHttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Model list request failed with HTTP ${status}.`)
    this.name = 'ModelListHttpError'
    this.status = status
  }
}
