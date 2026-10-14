import type {
  OutputConfig,
  ThinkingConfigParam,
} from '@anthropic-ai/sdk/resources/messages'

import type { ClaudeEffort } from '../../types/chat-model.types'

/**
 * How each Claude model takes reasoning settings on the Messages API (R-050):
 * - adaptive: Claude 4.6+ and 5.x take `thinking: {type: 'adaptive'}` plus
 *   `output_config.effort`; budgets and sampling parameters are rejected on
 *   4.7+.
 * - always-on: Fable and Mythos always think and reject a thinking parameter.
 * - budget: Haiku 4.5 and older keep `budget_tokens`.
 */
export type AnthropicThinkingStyle = 'adaptive' | 'always-on' | 'budget'

export function anthropicThinkingStyle(model: string): AnthropicThinkingStyle {
  if (/^claude-(?:fable|mythos)-/i.test(model)) return 'always-on'
  if (/^claude-(?:opus-(?:4-[6-9]|5)|sonnet-(?:4-6|5))/i.test(model)) {
    return 'adaptive'
  }
  return 'budget'
}

/** Claude 4.7 and later return 400 for a non-default temperature or top_p. */
export function rejectsAnthropicSampling(model: string): boolean {
  return /^claude-(?:opus-(?:4-[7-9]|5)|sonnet-5|fable|mythos)/i.test(model)
}

// Opus 5.5 cannot turn thinking off and Sonnet 5.5 rejects `disabled`; the
// lowest effort is the closest setting.
function cannotDisableThinking(model: string): boolean {
  return /^claude-(?:opus|sonnet)-5-5/i.test(model)
}

// Opus 5 and Sonnet 5 think unless thinking is explicitly disabled.
function thinksWhenOmitted(model: string): boolean {
  return /^claude-(?:opus|sonnet)-5(?:$|-\d{8})/i.test(model)
}

/** Models that think when no thinking setting is sent. */
export function anthropicThinksByDefault(model: string): boolean {
  return /^claude-(?:fable|mythos|opus-5|sonnet-5)/i.test(model)
}

// The 4.6 models stop at `high`.
function clampEffort(model: string, effort: ClaudeEffort): ClaudeEffort {
  if (/^claude-(?:opus|sonnet)-4-6/i.test(model) && effort !== 'low') {
    return effort === 'medium' ? 'medium' : 'high'
  }
  return effort
}

export type AnthropicThinkingSettings = {
  enabled: boolean
  budget_tokens?: number
  effort?: ClaudeEffort
}

export type AnthropicReasoningParams = {
  thinking?: ThinkingConfigParam
  output_config?: OutputConfig
  max_tokens: number
  temperature?: number
  top_p?: number
}

const BUDGET_STYLE_MAX_TOKENS = 8192
// Thinking tokens count toward max_tokens; leave room for both.
const ADAPTIVE_MAX_TOKENS = 16_000

export function buildAnthropicReasoningParams(params: {
  model: string
  thinking?: AnthropicThinkingSettings
  maxTokens?: number
  temperature?: number
  topP?: number
}): AnthropicReasoningParams {
  const { model, thinking } = params
  const style = anthropicThinkingStyle(model)

  if (style === 'budget') {
    const budget =
      thinking?.enabled && thinking.budget_tokens
        ? thinking.budget_tokens
        : undefined
    return {
      thinking: budget ? { type: 'enabled', budget_tokens: budget } : undefined,
      max_tokens:
        params.maxTokens ??
        (budget ? budget + BUDGET_STYLE_MAX_TOKENS : BUDGET_STYLE_MAX_TOKENS),
      temperature: params.temperature,
      top_p: params.topP,
    }
  }

  const sampling = rejectsAnthropicSampling(model)
    ? {}
    : { temperature: params.temperature, top_p: params.topP }
  const maxTokens = params.maxTokens ?? ADAPTIVE_MAX_TOKENS

  // No setting means the model's own default; `enabled: false` means off.
  if (!thinking) {
    return { max_tokens: maxTokens, ...sampling }
  }

  if (style === 'always-on') {
    const effort = thinking.enabled ? thinking.effort : 'low'
    return {
      output_config: effort ? { effort } : undefined,
      max_tokens: maxTokens,
      ...sampling,
    }
  }

  if (thinking.enabled) {
    return {
      thinking: { type: 'adaptive' },
      output_config: { effort: clampEffort(model, thinking.effort ?? 'high') },
      max_tokens: maxTokens,
      ...sampling,
    }
  }
  if (cannotDisableThinking(model)) {
    return {
      output_config: { effort: 'low' },
      max_tokens: maxTokens,
      ...sampling,
    }
  }
  return {
    thinking: thinksWhenOmitted(model) ? { type: 'disabled' } : undefined,
    max_tokens: maxTokens,
    ...sampling,
  }
}

/**
 * Index of the first message of the tool loop still in progress, or the
 * message count when none is. Thinking blocks of earlier assistant turns are
 * dropped: Claude 5.5 and Fable 5.1 bind each block to the exact earlier
 * conversation, and the chat rebuilds its system prompt every turn. A tool
 * loop is in progress when tool results follow the last assistant turn,
 * possibly with instructions appended after them (retrieval adds one); its
 * blocks must be replayed for tool use to continue.
 */
export function currentToolLoopStart(
  messages: readonly { role: string }[],
): number {
  let index = messages.length - 1
  while (index >= 0 && messages[index].role === 'user') index -= 1
  if (index < 0 || messages[index].role !== 'tool') return messages.length
  while (
    index >= 0 &&
    (messages[index].role === 'tool' || messages[index].role === 'assistant')
  ) {
    index -= 1
  }
  return index + 1
}
