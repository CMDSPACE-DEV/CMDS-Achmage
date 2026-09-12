import type { IncomingMessage, RequestOptions } from 'http'
import * as http from 'http'
import * as https from 'https'
import type { Readable } from 'stream'

const NULL_BODY_STATUSES = new Set([101, 204, 205, 304])
const MAX_REDIRECTS = 20

type ResponseBody =
  | IncomingMessage
  | ReadableStream<Uint8Array>
  | Readable
  | null

type FetchResponseLike = {
  body: ResponseBody
  headers: {
    forEach(callback: (value: string, key: string) => void): void
  }
  status: number
  statusText: string
}

/**
 * Uses Node's HTTP stack so desktop MCP connections are not blocked by
 * browser CORS, while preserving the Web Response streams expected by the
 * MCP SDK.
 */
export function createDesktopMcpFetch(): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init)
    return dispatchNodeRequest(request)
  }
}

async function dispatchNodeRequest(
  request: Request,
  redirectCount = 0,
  body?: Buffer,
): Promise<Response> {
  const requestBody =
    body ??
    (request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : Buffer.from(await request.arrayBuffer()))
  const incoming = await sendNodeRequest(request, requestBody)
  const status = incoming.statusCode ?? 0
  const locationHeader = headerValue(incoming.headers.location)
  const shouldRedirect =
    request.redirect !== 'manual' &&
    request.redirect !== 'error' &&
    status >= 300 &&
    status < 400 &&
    Boolean(locationHeader)

  if (shouldRedirect) {
    if (redirectCount >= MAX_REDIRECTS) {
      incoming.resume()
      throw new TypeError('Maximum MCP redirects exceeded.')
    }
    incoming.resume()
    const nextUrl = new URL(locationHeader as string, request.url)
    const nextMethod =
      status === 303 && request.method !== 'HEAD' ? 'GET' : request.method
    const next = new Request(nextUrl, {
      method: nextMethod,
      headers: request.headers,
      redirect: request.redirect,
      signal: request.signal,
    })
    return dispatchNodeRequest(
      next,
      redirectCount + 1,
      nextMethod === 'GET' || nextMethod === 'HEAD' ? undefined : requestBody,
    )
  }

  if (request.redirect === 'error' && status >= 300 && status < 400) {
    incoming.resume()
    throw new TypeError(`MCP redirect not allowed: ${status}`)
  }

  return toWebResponse({
    body: incoming,
    headers: nodeHeaders(incoming),
    status,
    statusText: incoming.statusMessage ?? '',
  })
}

function sendNodeRequest(
  request: Request,
  body?: Buffer,
): Promise<IncomingMessage> {
  const url = new URL(request.url)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError(`Unsupported MCP URL protocol: ${url.protocol}`)
  }

  const client = url.protocol === 'https:' ? https : http
  const headers: Record<string, string | string[]> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })
  if (body) {
    headers['Content-Length'] = String(body.byteLength)
  }

  const options: RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port ? Number(url.port) : undefined,
    path: `${url.pathname}${url.search}`,
    method: request.method,
    headers,
  }

  return new Promise<IncomingMessage>((resolve, reject) => {
    const nodeRequest = client.request(options, (response) => {
      resolve(response)
    })

    const fail = (error: Error) => {
      nodeRequest.destroy(error)
      reject(error)
    }

    nodeRequest.on('error', reject)

    if (request.signal) {
      if (request.signal.aborted) {
        fail(new DOMException('This operation was aborted', 'AbortError'))
        return
      }
      const abortHandler = () => {
        fail(new DOMException('This operation was aborted', 'AbortError'))
      }
      request.signal.addEventListener('abort', abortHandler, { once: true })
      nodeRequest.on('close', () => {
        request.signal.removeEventListener('abort', abortHandler)
      })
    }

    if (body) nodeRequest.write(body)
    nodeRequest.end()
  })
}

function nodeHeaders(response: IncomingMessage): FetchResponseLike['headers'] {
  return {
    forEach(callback) {
      for (const [key, value] of Object.entries(response.headers)) {
        if (value === undefined) continue
        if (Array.isArray(value)) {
          for (const entry of value) callback(entry, key)
        } else {
          callback(value, key)
        }
      }
    },
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function toWebResponse(response: FetchResponseLike): Response {
  const headers = new Headers()
  response.headers.forEach((value, key) => {
    headers.append(key, value)
  })

  const body = toCompatibleWebBody(response.body, response.status)

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function toCompatibleWebBody(
  body: ResponseBody,
  status: number,
): ReadableStream<Uint8Array> | null {
  if (!body || NULL_BODY_STATUSES.has(status)) return null
  if (isWebReadableStream(body)) return body
  if (isNodeReadableStream(body)) return toWebReadableStream(body)

  throw new TypeError('Unsupported MCP response body stream.')
}

function isWebReadableStream(
  body: ResponseBody,
): body is ReadableStream<Uint8Array> {
  const candidate = body as Partial<ReadableStream<Uint8Array>>
  return (
    typeof candidate.getReader === 'function' &&
    typeof candidate.pipeThrough === 'function'
  )
}

function isNodeReadableStream(body: ResponseBody): body is Readable {
  const candidate = body as Partial<Readable>
  return (
    typeof candidate.on === 'function' &&
    typeof candidate.once === 'function' &&
    typeof candidate.pause === 'function' &&
    typeof candidate.resume === 'function'
  )
}

function toWebReadableStream(stream: Readable): ReadableStream<Uint8Array> {
  let ended = false

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = () => {
        stream.off('data', onData)
        stream.off('end', onEnd)
        stream.off('error', onError)
      }
      const onData = (chunk: Buffer | Uint8Array | string) => {
        const bytes =
          typeof chunk === 'string'
            ? new TextEncoder().encode(chunk)
            : new Uint8Array(chunk)
        controller.enqueue(bytes)
        if ((controller.desiredSize ?? 1) <= 0) stream.pause()
      }
      const onEnd = () => {
        if (ended) return
        ended = true
        cleanup()
        controller.close()
      }
      const onError = (error: Error) => {
        if (ended) return
        ended = true
        cleanup()
        controller.error(error)
      }

      stream.on('data', onData)
      stream.once('end', onEnd)
      stream.once('error', onError)
    },
    pull() {
      stream.resume()
    },
    cancel(reason) {
      ended = true
      stream.destroy(reason instanceof Error ? reason : undefined)
    },
  })
}
