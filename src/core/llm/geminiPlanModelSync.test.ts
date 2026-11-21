import { smartComposerSettingsSchema } from '../../settings/schema/setting.types'

import { syncGeminiPlanModels } from './geminiPlanModelSync'
import type {
  NativeRuntimeSnapshot,
  NativeRuntimeStatus,
} from './native/nativeRuntime.types'

const ready: NativeRuntimeSnapshot = {
  provider: 'gemini',
  status: 'ready',
  phase: 'settled',
  installation: 'installed',
  authentication: 'subscription',
  catalog: 'ready',
  update: 'background',
  models: [
    { id: 'gemini-4-neon-xhigh', label: 'Gemini 4 Neon (XHigh)' },
    { id: 'gemini-4-carbon-high', label: 'Gemini 4 Carbon (High)' },
  ],
}

function harness() {
  let current = smartComposerSettingsSchema.parse({})
  const setSettings = jest.fn(async (next: typeof current) => {
    current = next
  })
  return {
    access: { getSettings: () => current, setSettings },
    setSettings,
    current: () => current,
    edit: (next: typeof current) => {
      current = next
    },
  }
}

describe('Gemini Plan model sync', () => {
  it('does not launch diagnosis for an already cancelled startup sync', async () => {
    const h = harness()
    const controller = new AbortController()
    controller.abort()
    const service = { diagnose: jest.fn(async () => ready) }
    await expect(
      syncGeminiPlanModels(h.access, service, controller.signal),
    ).resolves.toEqual({ status: 'unavailable' })
    expect(service.diagnose).not.toHaveBeenCalled()
    expect(h.setSettings).not.toHaveBeenCalled()
  })

  it('does not save discovered models after cancellation during diagnosis', async () => {
    const h = harness()
    const controller = new AbortController()
    const service = {
      diagnose: jest.fn(async () => {
        controller.abort()
        return ready
      }),
    }
    await expect(
      syncGeminiPlanModels(h.access, service, controller.signal),
    ).resolves.toEqual({ status: 'unavailable' })
    expect(service.diagnose).toHaveBeenCalledWith('gemini', controller.signal)
    expect(h.setSettings).not.toHaveBeenCalled()
  })

  it('adds runtime slugs without changing disabled models or the current selection', async () => {
    const h = harness()
    const existing = {
      providerType: 'gemini-plan' as const,
      providerId: 'gemini-plan',
      id: 'My Neon',
      model: 'gemini-4-neon-xhigh',
      enable: false,
    }
    h.current().chatModels.push(existing)
    const selected = h.current().chatModelId
    const service = { diagnose: jest.fn(async () => ready) }

    const result = await syncGeminiPlanModels(h.access, service)

    expect(service.diagnose).toHaveBeenCalledWith('gemini', undefined)
    expect(result).toMatchObject({
      status: 'synced',
      added: [
        {
          model: 'gemini-4-carbon-high',
          id: 'Gemini 4 Carbon (High) (plan)',
          enable: true,
        },
      ],
    })
    expect(
      h.current().chatModels.find((model) => model.id === existing.id),
    ).toBe(existing)
    expect(h.current().chatModelId).toBe(selected)
    await syncGeminiPlanModels(h.access, service)
    expect(h.setSettings).toHaveBeenCalledTimes(1)
  })

  it('merges against settings edited while diagnosis was running', async () => {
    const h = harness()
    const service = {
      diagnose: jest.fn(async () => {
        h.edit({ ...h.current(), chatModelId: 'changed-in-flight' })
        return ready
      }),
    }
    await syncGeminiPlanModels(h.access, service)
    expect(h.current().chatModelId).toBe('changed-in-flight')
    expect(
      h
        .current()
        .chatModels.filter((model) => model.model.startsWith('gemini-4-')),
    ).toHaveLength(2)
  })

  it.each<NativeRuntimeStatus>([
    'login-required',
    'billing-blocked',
    'quota-unverified',
    'not-installed',
    'error',
  ])('keeps saved models intact when the runtime is %s', async (status) => {
    const h = harness()
    const before = h.current()
    await expect(
      syncGeminiPlanModels(h.access, {
        diagnose: async () => ({ ...ready, status }),
      }),
    ).resolves.toEqual({ status: 'unavailable' })
    expect(h.current()).toBe(before)
    expect(h.setSettings).not.toHaveBeenCalled()
  })

  it('does not diagnose a removed provider', async () => {
    const h = harness()
    h.edit({
      ...h.current(),
      providers: h
        .current()
        .providers.filter((provider) => provider.type !== 'gemini-plan'),
    })
    const service = { diagnose: jest.fn(async () => ready) }
    await expect(syncGeminiPlanModels(h.access, service)).resolves.toEqual({
      status: 'not-configured',
    })
    expect(service.diagnose).not.toHaveBeenCalled()
  })

  it('does not write settings after a diagnostic failure', async () => {
    const h = harness()
    await expect(
      syncGeminiPlanModels(h.access, {
        diagnose: async () => {
          throw new Error('offline')
        },
      }),
    ).rejects.toThrow('offline')
    expect(h.setSettings).not.toHaveBeenCalled()
  })
})
