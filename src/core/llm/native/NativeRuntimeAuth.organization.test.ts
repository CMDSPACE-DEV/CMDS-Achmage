import {
  CLAUDE_ORGANIZATION_PLAN_ALLOWED_EVIDENCE,
  CLAUDE_ORGANIZATION_PLAN_OPT_IN_EVIDENCE,
  classifyClaudeAuthStatus,
  prepareNativePlanEnvironment,
  verifyClaudePlanAuth,
} from './NativeRuntimeAuth'

/**
 * Fixtures follow the `claude auth status --json` object built by Claude Code
 * 2.1.285: loggedIn, authMethod, apiProvider, analyticsDisabled,
 * projectsDirectory, configDirectory, the policy-only forcedLoginMethod and
 * allowedProviders, apiKeySource when not "none", and for claude.ai logins
 * email, orgId, orgName, subscriptionType. All values are invented.
 */
function authStatus(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    loggedIn: true,
    authMethod: 'claude.ai',
    apiProvider: 'firstParty',
    analyticsDisabled: false,
    projectsDirectory: '/fixture/home/.claude/projects',
    configDirectory: '/fixture/home/.claude',
    email: 'member@example.test',
    orgId: 'fixture-organization-id',
    orgName: 'Fixture Organization',
    subscriptionType: 'team',
    ...overrides,
  })
}

const OPT_IN = { allowOrganizationPlans: true }

describe('Claude Plan organization accounts (R-044)', () => {
  it.each(['team', 'enterprise'])(
    'asks for opt-in on %s without blaming API or gateway billing',
    (subscriptionType) => {
      const decision = classifyClaudeAuthStatus(
        authStatus({ subscriptionType }),
      )

      expect(decision).toEqual({
        status: 'billing-blocked',
        allowed: false,
        reason: expect.stringContaining('Team or Enterprise') as string,
        evidence: [
          'authMethod=claude.ai',
          'apiProvider=firstParty',
          `subscriptionType=${subscriptionType}`,
          CLAUDE_ORGANIZATION_PLAN_OPT_IN_EVIDENCE,
        ],
        code: 'organization-opt-in-required',
      })
      expect(decision.reason).not.toMatch(/API|helper|gateway|cloud/i)
    },
  )

  it.each(['team', 'enterprise'])(
    'allows %s after this computer opts in',
    (subscriptionType) => {
      expect(
        classifyClaudeAuthStatus(
          authStatus({ subscriptionType }),
          undefined,
          OPT_IN,
        ),
      ).toEqual({
        status: 'subscription',
        allowed: true,
        reason: expect.stringContaining('Team/Enterprise') as string,
        evidence: [
          'authMethod=claude.ai',
          'apiProvider=firstParty',
          `subscriptionType=${subscriptionType}`,
          CLAUDE_ORGANIZATION_PLAN_ALLOWED_EVIDENCE,
        ],
        code: 'organization-subscription',
      })
    },
  )

  it('never retains the account email or organization identifiers', () => {
    for (const policy of [{}, OPT_IN]) {
      const serialized = JSON.stringify(
        classifyClaudeAuthStatus(authStatus(), undefined, policy),
      )
      expect(serialized).not.toContain('member@example.test')
      expect(serialized).not.toContain('fixture-organization-id')
      expect(serialized).not.toContain('Fixture Organization')
      expect(serialized).not.toContain('/fixture/home')
    }
  })

  it.each(['pro', 'max'])(
    'keeps the full 2.1.285 %s record allowed whether or not opt-in is set',
    (subscriptionType) => {
      for (const policy of [{}, OPT_IN]) {
        expect(
          classifyClaudeAuthStatus(
            authStatus({ subscriptionType }),
            undefined,
            policy,
          ),
        ).toMatchObject({
          status: 'subscription',
          allowed: true,
          code: 'subscription',
        })
      }
    },
  )

  it.each([
    ['an API key source', { apiKeySource: 'apiKeyHelper' }],
    ['an environment API key source', { apiKeySource: 'ANTHROPIC_API_KEY' }],
    ['a cloud provider', { apiProvider: 'bedrock' }],
    ['a gateway provider', { apiProvider: 'gateway' }],
    ['a Console login', { authMethod: 'console' }],
    ['a gateway login policy', { forcedLoginMethod: 'gateway' }],
    ['a Console login policy', { forcedLoginMethod: 'console' }],
    [
      'a custom endpoint provider list',
      { allowedProviders: ['anthropic', 'customEndpoint'] },
    ],
    ['a gateway-only provider list', { allowedProviders: ['gateway'] }],
    ['an unknown billing field', { billingSource: 'future-source' }],
  ])('still blocks a Team login with %s after opt-in', (_label, override) => {
    const decision = classifyClaudeAuthStatus(
      authStatus(override),
      undefined,
      OPT_IN,
    )
    expect(decision).toMatchObject({ allowed: false })
    expect(decision.code).not.toBe('organization-opt-in-required')
  })

  it.each([
    ['a claude.ai login policy', { forcedLoginMethod: 'claudeai' }],
    ['a first-party-only provider list', { allowedProviders: ['anthropic'] }],
  ])(
    'accepts a Team login with %s from organization policy',
    (_label, override) => {
      expect(
        classifyClaudeAuthStatus(authStatus(override), undefined, OPT_IN),
      ).toMatchObject({
        status: 'subscription',
        allowed: true,
        code: 'organization-subscription',
      })
    },
  )

  it.each(['free', 'education', 'claude_team'])(
    'does not treat the unknown plan type %s as an organization',
    (subscriptionType) => {
      expect(
        classifyClaudeAuthStatus(
          authStatus({ subscriptionType }),
          undefined,
          OPT_IN,
        ),
      ).toMatchObject({ allowed: false })
    },
  )

  it('blocks an environment override before classifying an opted-in Team login', () => {
    const environment = prepareNativePlanEnvironment('claude', {
      PATH: '/safe/bin',
      ANTHROPIC_BASE_URL: 'https://gateway.example.test',
    })
    expect(
      classifyClaudeAuthStatus(authStatus(), environment, OPT_IN),
    ).toMatchObject({
      status: 'billing-blocked',
      allowed: false,
      code: 'environment-override',
    })
  })
})

describe('Claude Plan organization verification with managed settings', () => {
  const managedSettingsInspector = () => ['managed settings file present']

  it('offers opt-in to a Team login on a managed computer', async () => {
    const verification = await verifyClaudePlanAuth('/runtime/claude', {
      environment: prepareNativePlanEnvironment('claude', { PATH: '/safe' }),
      runner: jest.fn().mockResolvedValue(okRun(authStatus())),
      managedSettingsInspector,
    })

    expect(verification.decision).toMatchObject({
      allowed: false,
      code: 'organization-opt-in-required',
    })
    expect(verification.decision.evidence).toContain(
      'managed settings file present',
    )
  })

  it('allows an opted-in Team login on a managed computer', async () => {
    const verification = await verifyClaudePlanAuth('/runtime/claude', {
      environment: prepareNativePlanEnvironment('claude', { PATH: '/safe' }),
      runner: jest.fn().mockResolvedValue(okRun(authStatus())),
      managedSettingsInspector,
      ...OPT_IN,
    })

    expect(verification.decision).toMatchObject({
      status: 'subscription',
      allowed: true,
      code: 'organization-subscription',
    })
    expect(verification.decision.evidence).toContain(
      'managed settings file present',
    )
  })

  it('keeps a personal Max login blocked on a managed computer despite opt-in', async () => {
    const verification = await verifyClaudePlanAuth('/runtime/claude', {
      environment: prepareNativePlanEnvironment('claude', { PATH: '/safe' }),
      runner: jest
        .fn()
        .mockResolvedValue(okRun(authStatus({ subscriptionType: 'max' }))),
      managedSettingsInspector,
      ...OPT_IN,
    })

    expect(verification.decision).toMatchObject({
      status: 'billing-blocked',
      allowed: false,
      code: 'managed-settings',
    })
  })

  it('asks a signed-out user on a managed computer to sign in first', async () => {
    const verification = await verifyClaudePlanAuth('/runtime/claude', {
      environment: prepareNativePlanEnvironment('claude', { PATH: '/safe' }),
      runner: jest.fn().mockResolvedValue({
        stdout: JSON.stringify({ loggedIn: false }),
        stderr: '',
        exitCode: 1,
      }),
      managedSettingsInspector,
      ...OPT_IN,
    })

    expect(verification.decision).toMatchObject({
      status: 'login-required',
      allowed: false,
      code: 'login-required',
    })
  })

  it('never runs auth status when an environment override is present', async () => {
    const runner = jest.fn()
    const verification = await verifyClaudePlanAuth('/runtime/claude', {
      environment: prepareNativePlanEnvironment('claude', {
        PATH: '/safe',
        CLAUDE_CODE_OAUTH_TOKEN: 'must-never-be-retained',
      }),
      runner,
      managedSettingsInspector: () => [],
      ...OPT_IN,
    })

    expect(runner).not.toHaveBeenCalled()
    expect(verification.decision).toMatchObject({
      allowed: false,
      code: 'environment-override',
    })
    expect(JSON.stringify(verification)).not.toContain('must-never-be-retained')
  })
})

function okRun(stdout: string) {
  return { stdout, stderr: '', exitCode: 0 }
}
