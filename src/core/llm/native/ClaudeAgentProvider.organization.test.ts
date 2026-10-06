const mockRunNativeProcess = jest.fn()

jest.mock('obsidian', () => ({
  Platform: { isDesktop: true },
  requestUrl: jest.fn(),
}))

jest.mock('./NativeProcess', () => ({
  runNativeProcess: (options: unknown): Promise<unknown> =>
    mockRunNativeProcess(options) as Promise<unknown>,
}))

import type { ChatModel } from '../../../types/chat-model.types'
import type { LLMRequestStreaming } from '../../../types/llm/request'

import {
  ClaudeAgentProvider,
  ClaudePlanRequestBlockedError,
  evaluateClaudeInitEvent,
} from './ClaudeAgentProvider'
import { NativeCliResolver } from './NativeCliResolver'
import type { NativeRuntimeConsentReader } from './NativeRuntimeConsentStore'

type FakeProcessOptions = {
  args: string[]
  signal?: AbortSignal
  onStdoutLine?: (line: string) => void
}

const CLEAN_INIT = {
  type: 'system',
  subtype: 'init',
  model: 'claude-sonnet-5-5',
  apiKeySource: 'none',
  tools: [],
  mcp_servers: [],
}

describe('Claude Plan organization requests (R-044)', () => {
  beforeEach(() => {
    mockRunNativeProcess.mockReset()
  })

  it('stops a Team login before inference until this computer opts in', async () => {
    fakeClaude({ subscriptionType: 'team', init: CLEAN_INIT })

    const failure = await collectFailure(provider(false))

    expect(failure).toBeInstanceOf(Error)
    expect(String(failure)).toMatch(/request blocked/i)
    expect(String(failure)).toMatch(/Team or Enterprise/)
    expect(mockRunNativeProcess).toHaveBeenCalledTimes(1)
  })

  it('answers through an opted-in Team login with a clean session', async () => {
    fakeClaude({ subscriptionType: 'team', init: CLEAN_INIT })

    await expect(collectContent(provider(true))).resolves.toBe(
      'organization response',
    )
    expect(mockRunNativeProcess).toHaveBeenCalledTimes(2)
    expect(mockRunNativeProcess.mock.calls[1]?.[0].args).toContain(
      '--strict-mcp-config',
    )
  })

  it.each([
    ['team', true],
    ['pro', false],
  ])(
    'stops a %s session that reports an API key source',
    async (subscriptionType, optIn) => {
      fakeClaude({
        subscriptionType,
        init: { ...CLEAN_INIT, apiKeySource: 'ANTHROPIC_API_KEY' },
      })

      const failure = await collectFailure(provider(optIn))

      expect(failure).toBeInstanceOf(ClaudePlanRequestBlockedError)
      expect((failure as Error).name).not.toBe('AbortError')
      expect(String(failure)).toMatch(/API key source/)
    },
  )

  it('stops an opted-in Team session with organization MCP servers', async () => {
    fakeClaude({
      subscriptionType: 'team',
      init: {
        ...CLEAN_INIT,
        mcp_servers: [{ name: 'org-server', status: 'connected' }],
      },
    })

    await expect(collectFailure(provider(true))).resolves.toBeInstanceOf(
      ClaudePlanRequestBlockedError,
    )
  })

  it('discards an opted-in Team answer when the session never reported init', async () => {
    fakeClaude({ subscriptionType: 'team', init: undefined })

    const failure = await collectFailure(provider(true))

    expect(failure).toBeInstanceOf(ClaudePlanRequestBlockedError)
    expect(String(failure)).toMatch(/session settings/)
  })

  it('keeps Pro working when a future CLI omits init', async () => {
    fakeClaude({ subscriptionType: 'pro', init: undefined })

    await expect(collectContent(provider(false))).resolves.toBe(
      'organization response',
    )
  })

  it('reports a user cancellation as AbortError, not as a block', async () => {
    fakeClaude({ subscriptionType: 'pro', init: CLEAN_INIT })
    const controller = new AbortController()
    controller.abort()

    const failure = await collectFailure(provider(false), controller.signal)

    expect((failure as Error).name).toBe('AbortError')
  })
})

describe('evaluateClaudeInitEvent', () => {
  it('accepts a clean subscription session for every plan', () => {
    for (const organization of [false, true]) {
      expect(
        evaluateClaudeInitEvent(CLEAN_INIT, {
          organization,
          allowImageRead: false,
        }),
      ).toBeUndefined()
    }
  })

  it('accepts Read for image attachments and ignores built-in tools', () => {
    expect(
      evaluateClaudeInitEvent(
        { ...CLEAN_INIT, tools: ['Read'] },
        { organization: true, allowImageRead: true },
      ),
    ).toBeUndefined()
  })

  it('flags MCP tools only on the organization path', () => {
    const event = { ...CLEAN_INIT, tools: ['mcp__org__search'] }
    expect(
      evaluateClaudeInitEvent(event, {
        organization: false,
        allowImageRead: false,
      }),
    ).toBeUndefined()
    expect(
      evaluateClaudeInitEvent(event, {
        organization: true,
        allowImageRead: false,
      }),
    ).toMatch(/MCP/)
  })
})

function fakeClaude(params: {
  subscriptionType: string
  init: Record<string, unknown> | undefined
}) {
  mockRunNativeProcess.mockImplementation(
    async (options: FakeProcessOptions) => {
      if (options.args[0] === 'auth') {
        return {
          stdout: JSON.stringify({
            loggedIn: true,
            authMethod: 'claude.ai',
            apiProvider: 'firstParty',
            subscriptionType: params.subscriptionType,
          }),
          stderr: '',
          exitCode: 0,
        }
      }
      if (params.init) options.onStdoutLine?.(JSON.stringify(params.init))
      if (options.signal?.aborted) {
        const error = new Error('Native runtime request was canceled.')
        error.name = 'AbortError'
        throw error
      }
      options.onStdoutLine?.(
        JSON.stringify({
          type: 'result',
          subtype: 'success',
          result: 'organization response',
        }),
      )
      return { stdout: '', stderr: '', exitCode: 0 }
    },
  )
}

function provider(allowOrganizationPlans: boolean): ClaudeAgentProvider {
  const consent: NativeRuntimeConsentReader = {
    allowsClaudeOrganizationPlans: () => allowOrganizationPlans,
  }
  return new ClaudeAgentProvider(
    { type: 'anthropic-plan', id: 'anthropic-plan' },
    { resolve: () => '/runtime/claude' } as unknown as NativeCliResolver,
    { PATH: '/safe/bin' },
    { consent, managedSettingsInspector: () => [] },
  )
}

async function collectContent(
  target: ClaudeAgentProvider,
  signal?: AbortSignal,
): Promise<string> {
  const stream = await target.streamResponse(model(), request(), { signal })
  let content = ''
  for await (const chunk of stream) {
    content += chunk.choices[0]?.delta.content ?? ''
  }
  return content
}

async function collectFailure(
  target: ClaudeAgentProvider,
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    await collectContent(target, signal)
  } catch (error: unknown) {
    return error
  }
  throw new Error('Expected the Claude Plan request to fail.')
}

function model(): Extract<ChatModel, { providerType: 'anthropic-plan' }> {
  return {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-sonnet-latest (plan)',
    model: 'sonnet',
  }
}

function request(): LLMRequestStreaming {
  return {
    model: 'sonnet',
    messages: [{ role: 'user', content: 'Reply safely.' }],
    stream: true,
  }
}
