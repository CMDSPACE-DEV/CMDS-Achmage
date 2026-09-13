import { ChatMessage } from '../../types/chat'
import { ResponseUsage } from '../../types/llm/response'
import { ToolCallResponseStatus } from '../../types/tool-call.types'

/**
 * Live progress of one assistant turn (R-043), derived from the response
 * messages the generator publishes on every chunk. No extra plumbing: the
 * phase, elapsed times, and token estimates all come from what is already
 * accumulated in the messages.
 */
export type ResponsePhase = 'connecting' | 'thinking' | 'tool' | 'writing'

export type ResponseToolProgress = {
  name: string
  status: 'pending' | 'running' | 'done' | 'error'
}

export type ResponseProgress = {
  modelId: string
  startedAt: number
  phase: ResponsePhase
  phaseSince: number
  reasoningChars: number
  contentChars: number
  /** Estimates from the streamed text (see estimateTokens). */
  reasoningTokensEstimate: number
  outputTokensEstimate: number
  /** Provider-reported usage when it has arrived (usually at the end). */
  usage?: ResponseUsage
  tools: ResponseToolProgress[]
  /** Number of assistant turns so far (tool loops add turns). */
  turns: number
}

/** Rough token estimate: ~4 Latin characters per token, ~1.5 CJK characters per token. */
export function estimateTokens(text: string): number {
  if (!text) return 0
  let cjk = 0
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    if (
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x1100 && code <= 0x11ff) ||
      (code >= 0x3130 && code <= 0x318f)
    ) {
      cjk += 1
    }
  }
  const latin = text.length - cjk
  return Math.round(latin / 4 + cjk / 1.5)
}

export function startResponseProgress(
  modelId: string,
  now = Date.now(),
): ResponseProgress {
  return {
    modelId,
    startedAt: now,
    phase: 'connecting',
    phaseSince: now,
    reasoningChars: 0,
    contentChars: 0,
    reasoningTokensEstimate: 0,
    outputTokensEstimate: 0,
    tools: [],
    turns: 0,
  }
}

export function deriveResponseProgress(
  previous: ResponseProgress,
  messages: ChatMessage[],
  now = Date.now(),
): ResponseProgress {
  let reasoningChars = 0
  let contentChars = 0
  let reasoningTokensEstimate = 0
  let outputTokensEstimate = 0
  let usage: ResponseUsage | undefined
  let turns = 0
  const tools: ResponseToolProgress[] = []
  const answered = new Set<string>()

  for (const message of messages) {
    if (message.role === 'assistant') {
      turns += 1
      reasoningChars += message.reasoning?.length ?? 0
      contentChars += message.content.length
      reasoningTokensEstimate += estimateTokens(message.reasoning ?? '')
      outputTokensEstimate += estimateTokens(message.content)
      if (message.metadata?.usage) usage = message.metadata.usage
    } else if (message.role === 'tool') {
      for (const call of message.toolCalls) {
        answered.add(call.request.id)
        const status = call.response.status
        tools.push({
          name: call.request.name,
          status:
            status === ToolCallResponseStatus.Success
              ? 'done'
              : status === ToolCallResponseStatus.Error ||
                  status === ToolCallResponseStatus.Rejected ||
                  status === ToolCallResponseStatus.Aborted
                ? 'error'
                : status === ToolCallResponseStatus.Running
                  ? 'running'
                  : 'pending',
        })
      }
    }
  }
  // Requested but not yet answered tool calls count as pending.
  for (const message of messages) {
    if (message.role !== 'assistant') continue
    for (const request of message.toolCallRequests ?? []) {
      if (!answered.has(request.id)) {
        tools.push({ name: request.name, status: 'pending' })
      }
    }
  }

  let phase: ResponsePhase = previous.phase
  const toolActive = tools.some(
    (tool) => tool.status === 'pending' || tool.status === 'running',
  )
  if (toolActive) phase = 'tool'
  else if (contentChars > previous.contentChars) phase = 'writing'
  else if (reasoningChars > previous.reasoningChars) phase = 'thinking'
  else if (
    previous.phase === 'connecting' &&
    (reasoningChars || contentChars)
  ) {
    phase = contentChars ? 'writing' : 'thinking'
  } else if (previous.phase === 'tool' && !toolActive) {
    // Tool finished; the next model turn is being awaited.
    phase = 'thinking'
  }

  return {
    ...previous,
    phase,
    phaseSince: phase === previous.phase ? previous.phaseSince : now,
    reasoningChars,
    contentChars,
    reasoningTokensEstimate,
    outputTokensEstimate,
    usage,
    tools,
    turns,
  }
}

export function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`
}
