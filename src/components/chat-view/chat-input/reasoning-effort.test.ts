import {
  CLAUDE_ADAPTIVE_EFFORTS,
  ChatModel,
  GPT_5_6_EFFORTS,
} from '../../../types/chat-model.types'

import {
  getQuickReasoningControl,
  updateQuickReasoningEffort,
} from './reasoning-effort'

const GPT_MODELS = [
  ['gpt-5.6-sol', 'medium'],
  ['gpt-5.6-terra', 'low'],
  ['gpt-5.6-luna', 'none'],
  ['gpt-6.1-sol', 'medium'],
  ['gpt-6-sol', 'medium'],
  ['gpt-6-astra', 'low'],
  ['gpt-6-luna', 'medium'],
] as const

// GPT-6.1 Sol and GPT-6 Astra reject `none`.
const MODELS_WITHOUT_NONE = new Set<string>(['gpt-6.1-sol', 'gpt-6-astra'])

function gptModel(
  model: (typeof GPT_MODELS)[number][0] = 'gpt-5.6-sol',
): Extract<ChatModel, { providerType: 'openai-plan' }> {
  return {
    id: `${model} (plan)`,
    model,
    providerId: 'openai-plan',
    providerType: 'openai-plan',
  }
}

function claudeModel(
  model = 'default',
): Extract<ChatModel, { providerType: 'anthropic-plan' }> {
  return {
    id: `${model} (plan)`,
    model,
    providerId: 'anthropic-plan',
    providerType: 'anthropic-plan',
  }
}

describe('quick reasoning effort', () => {
  it.each(GPT_MODELS)(
    'uses the default effort for %s when it is not configured',
    (model, expectedEffort) => {
      expect(getQuickReasoningControl(gptModel(model))?.value).toBe(
        expectedEffort,
      )
    },
  )

  it.each(
    GPT_MODELS.flatMap(([model]) =>
      GPT_5_6_EFFORTS.filter(
        (effort) => effort !== 'none' || !MODELS_WITHOUT_NONE.has(model),
      ).map((effort) => [model, effort] as const),
    ),
  )('shows every supported GPT effort for %s: %s', (model, effort) => {
    const configuredModel = {
      ...gptModel(model),
      reasoning: { reasoning_effort: effort },
    }

    expect(getQuickReasoningControl(configuredModel)?.value).toBe(effort)
  })

  it.each(CLAUDE_ADAPTIVE_EFFORTS)(
    'shows every supported Claude effort: %s',
    (effort) => {
      const configuredModel: ReturnType<typeof claudeModel> = {
        ...claudeModel(),
        thinking: {
          enabled: true,
          mode: 'adaptive',
          effort,
          display: 'summarized',
        },
      }

      expect(getQuickReasoningControl(configuredModel)?.value).toBe(effort)
    },
  )

  it('shows off for disabled Claude thinking and supports the runtime Opus alias', () => {
    const configuredModel: ReturnType<typeof claudeModel> = {
      ...claudeModel('opus'),
      thinking: {
        enabled: false,
        mode: 'adaptive',
        effort: 'xhigh',
        display: 'omitted',
      },
    }

    expect(getQuickReasoningControl(configuredModel)?.value).toBe('off')
  })

  it('offers only the efforts a GPT-6 model accepts', () => {
    const options = getQuickReasoningControl(gptModel('gpt-6.1-sol'))?.options
    expect(options?.map((option) => option.value)).toEqual([
      'low',
      'medium',
      'high',
      'xhigh',
      'max',
    ])
    expect(() =>
      updateQuickReasoningEffort(gptModel('gpt-6-astra'), 'none'),
    ).toThrow('Unsupported reasoning effort for gpt-6-astra: none')
  })

  it('treats Fable as adaptive and keeps Haiku without a control', () => {
    expect(getQuickReasoningControl(claudeModel('fable'))?.kind).toBe('claude')
    expect(
      getQuickReasoningControl(claudeModel('claude-fable-5-1'))?.kind,
    ).toBe('claude')
    expect(getQuickReasoningControl(claudeModel('haiku'))).toBeNull()
  })

  it('supports legacy versioned Sonnet metadata', () => {
    expect(
      getQuickReasoningControl(claudeModel('claude-sonnet-5-20260715')),
    ).not.toBeNull()
  })

  it('hides the control for unsupported models and missing selections', () => {
    const unsupported: ChatModel = {
      id: 'gpt-5.5 (plan)',
      model: 'gpt-5.5',
      providerId: 'openai-plan',
      providerType: 'openai-plan',
    }

    expect(getQuickReasoningControl(unsupported)).toBeNull()
    expect(getQuickReasoningControl(undefined)).toBeNull()
  })

  it('sets GPT none immutably and removes its reasoning summary', () => {
    const original: ReturnType<typeof gptModel> = {
      ...gptModel(),
      reasoning: {
        reasoning_effort: 'high',
        reasoning_summary: 'detailed',
      },
    }

    const updated = updateQuickReasoningEffort(original, 'none')

    expect(updated).toEqual({
      ...original,
      reasoning: { reasoning_effort: 'none' },
    })
    expect(original.reasoning).toEqual({
      reasoning_effort: 'high',
      reasoning_summary: 'detailed',
    })
  })

  it('preserves the GPT reasoning summary for non-none efforts', () => {
    const original: ReturnType<typeof gptModel> = {
      ...gptModel(),
      reasoning: {
        reasoning_effort: 'medium',
        reasoning_summary: 'concise',
      },
    }

    expect(updateQuickReasoningEffort(original, 'max')).toMatchObject({
      reasoning: {
        reasoning_effort: 'max',
        reasoning_summary: 'concise',
      },
    })
  })

  it('turns Claude off without losing the saved effort or display setting', () => {
    const original: ReturnType<typeof claudeModel> = {
      ...claudeModel(),
      thinking: {
        enabled: true,
        mode: 'adaptive',
        effort: 'xhigh',
        display: 'omitted',
      },
    }

    const updated = updateQuickReasoningEffort(original, 'off')

    expect(updated).toMatchObject({
      thinking: {
        enabled: false,
        mode: 'adaptive',
        effort: 'xhigh',
        display: 'omitted',
      },
    })
    expect(original.thinking?.enabled).toBe(true)
  })

  it('enables Claude adaptive thinking and preserves its display setting', () => {
    const original: ReturnType<typeof claudeModel> = {
      ...claudeModel(),
      thinking: {
        enabled: false,
        mode: 'adaptive',
        effort: 'low',
        display: 'omitted',
      },
    }

    expect(updateQuickReasoningEffort(original, 'max')).toMatchObject({
      thinking: {
        enabled: true,
        mode: 'adaptive',
        effort: 'max',
        display: 'omitted',
      },
    })
  })

  it('rejects invalid and unsupported updates', () => {
    expect(() => updateQuickReasoningEffort(gptModel(), 'minimal')).toThrow(
      'Unsupported reasoning effort for gpt-5.6-sol: minimal',
    )
    expect(() => updateQuickReasoningEffort(claudeModel(), 'none')).toThrow(
      'Unsupported Claude reasoning effort: none',
    )
    expect(() =>
      updateQuickReasoningEffort(
        {
          id: 'gpt-5.5 (plan)',
          model: 'gpt-5.5',
          providerId: 'openai-plan',
          providerType: 'openai-plan',
        },
        'high',
      ),
    ).toThrow('Quick reasoning control is not supported for gpt-5.5')
  })
})
