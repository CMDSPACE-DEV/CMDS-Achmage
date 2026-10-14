jest.mock('obsidian', () => ({
  Platform: { isDesktop: true },
}))

import { NativeCliResolver } from './NativeCliResolver'
import type { NativeProcessOptions } from './NativeProcess'
import type { NativeRuntimeConsentStore } from './NativeRuntimeConsentStore'
import { NativeRuntimeService } from './NativeRuntimeService'
import { NativeRuntimeStore } from './NativeRuntimeStore'

describe('NativeRuntimeService Team/Enterprise diagnosis (R-049)', () => {
  it('asks a Team login to opt in, then reports Ready once this computer allows it', async () => {
    const consent = memoryConsentStore()
    const service = new NativeRuntimeService(
      resolver(),
      new NativeRuntimeStore(),
      teamRunner(),
      { PATH: '/safe' },
      undefined,
      undefined,
      consent,
      () => [],
    )

    const blocked = await service.diagnose('claude')
    expect(blocked).toMatchObject({
      status: 'billing-blocked',
      installation: 'installed',
      authentication: 'billing-blocked',
      authDecision: { allowed: false, code: 'organization-opt-in-required' },
    })
    expect(service.allowsClaudeOrganizationPlans()).toBe(false)

    service.setClaudeOrganizationPlans(true)
    const ready = await service.diagnose('claude')
    expect(ready).toMatchObject({
      status: 'ready',
      authentication: 'subscription',
      authDecision: { allowed: true, code: 'organization-subscription' },
    })

    service.setClaudeOrganizationPlans(false)
    await expect(service.diagnose('claude')).resolves.toMatchObject({
      status: 'billing-blocked',
      authDecision: { code: 'organization-opt-in-required' },
    })
  })

  it('uses the injected managed-settings inspector instead of the machine', async () => {
    const inspector = jest.fn(() => ['managed settings file present'])
    const service = new NativeRuntimeService(
      resolver(),
      new NativeRuntimeStore(),
      teamRunner(),
      { PATH: '/safe' },
      undefined,
      undefined,
      memoryConsentStore(true),
      inspector,
    )

    const snapshot = await service.diagnose('claude')

    expect(inspector).toHaveBeenCalled()
    expect(snapshot).toMatchObject({
      status: 'ready',
      authDecision: { code: 'organization-subscription' },
    })
    expect(snapshot.authDecision?.evidence).toContain(
      'managed settings file present',
    )
  })
})

function memoryConsentStore(initial = false): NativeRuntimeConsentStore {
  let allowed = initial
  return {
    allowsClaudeOrganizationPlans: () => allowed,
    setClaudeOrganizationPlans: (value: boolean) => {
      allowed = value
    },
  }
}

function teamRunner() {
  return jest.fn(async (options: NativeProcessOptions) => {
    if (options.args[0] === '--version') {
      return { stdout: '2.1.285 (Claude Code)', stderr: '', exitCode: 0 }
    }
    return {
      stdout: JSON.stringify({
        loggedIn: true,
        authMethod: 'claude.ai',
        apiProvider: 'firstParty',
        analyticsDisabled: false,
        subscriptionType: 'team',
      }),
      stderr: '',
      exitCode: 0,
    }
  })
}

function resolver(): NativeCliResolver {
  const discovery = {
    provider: 'claude' as const,
    selectedPath: 'C:\\runtime\\claude.exe',
    selectedMethod: 'native' as const,
    ambiguous: false,
    candidates: [
      {
        path: 'C:\\runtime\\claude.exe',
        canonicalPath: 'C:\\runtime\\claude.exe',
        method: 'native' as const,
        evidence: ['fixture path'],
      },
    ],
  }
  return {
    discover: () => discovery,
    resolve: () => discovery.selectedPath,
    setCustomPath: jest.fn(),
    getCustomPath: () => '',
  } as unknown as NativeCliResolver
}
