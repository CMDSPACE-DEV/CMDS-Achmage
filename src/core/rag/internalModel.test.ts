import {
  getInternalRagModel,
  shouldSurfacePlanRequestError,
} from './internalModel'

describe('getInternalRagModel', () => {
  it.each(['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna'])(
    'uses none effort for %s',
    (model) => {
      expect(
        getInternalRagModel({
          providerType: 'openai-plan',
          providerId: 'openai-plan',
          id: `${model} (plan)`,
          model,
          reasoning: {
            reasoning_effort: 'max',
            reasoning_summary: 'detailed',
          },
        }),
      ).toMatchObject({
        reasoning: { reasoning_effort: 'none' },
      })
    },
  )

  it.each([
    ['gpt-6.1-sol', 'low'],
    ['gpt-6-astra', 'low'],
    ['gpt-6-sol', 'low'],
    ['gpt-6-luna', 'low'],
  ])('uses the cheapest supported effort for %s: %s', (model, effort) => {
    expect(
      getInternalRagModel({
        providerType: 'openai-plan',
        providerId: 'openai-plan',
        id: `${model} (plan)`,
        model,
        reasoning: { reasoning_effort: 'max' },
      }),
    ).toMatchObject({ reasoning: { reasoning_effort: effort } })
  })

  it.each(['default', 'opus', 'claude-sonnet-5'])(
    'explicitly disables Claude Plan adaptive thinking for %s',
    (model) => {
      expect(
        getInternalRagModel({
          providerType: 'anthropic-plan',
          providerId: 'anthropic-plan',
          id: `${model} (plan)`,
          model,
          thinking: {
            enabled: true,
            mode: 'adaptive',
            effort: 'xhigh',
            display: 'omitted',
          },
        }),
      ).toMatchObject({
        thinking: {
          enabled: false,
          mode: 'adaptive',
          effort: 'xhigh',
          display: 'omitted',
        },
      })
    },
  )

  it('turns Claude API thinking off explicitly, since unset means the model default', () => {
    for (const model of ['claude-haiku-4-5', 'claude-fable-5-1']) {
      expect(
        getInternalRagModel({
          providerType: 'anthropic',
          providerId: 'anthropic',
          id: model,
          model,
          thinking: { enabled: true, budget_tokens: 8192, effort: 'max' },
        }),
      ).toMatchObject({ thinking: { enabled: false, budget_tokens: 8192 } })
    }
  })
})

describe('shouldSurfacePlanRequestError', () => {
  it.each([400, 403, 404, 429])(
    'allows local fallback for HTTP %s',
    (status) => {
      expect(shouldSurfacePlanRequestError({ status })).toBe(false)
    },
  )

  it('surfaces only authentication failures', () => {
    expect(shouldSurfacePlanRequestError({ status: 401 })).toBe(true)
    expect(shouldSurfacePlanRequestError({ code: 'model_mismatch' })).toBe(
      false,
    )
    expect(shouldSurfacePlanRequestError(new Error('invalid JSON'))).toBe(false)
  })
})
