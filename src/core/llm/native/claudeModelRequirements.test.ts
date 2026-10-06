import { ChatModel } from '../../../types/chat-model.types'

import { claudeEffort, normalizeClaudeModel } from './ClaudeAgentProvider'
import {
  assertClaudeCodeSupportsModel,
  checkClaudeCodeSupportsModel,
  getClaudeModelRequirement,
  parseClaudeCodeVersion,
} from './claudeModelRequirements'

jest.mock('obsidian', () => ({
  Platform: { isDesktop: true },
  requestUrl: jest.fn(),
}))

type ClaudePlanModel = Extract<ChatModel, { providerType: 'anthropic-plan' }>

function claudeModel(
  overrides: Partial<ClaudePlanModel> = {},
): ClaudePlanModel {
  return {
    providerType: 'anthropic-plan',
    providerId: 'anthropic-plan',
    id: 'claude-opus-5.5 (plan)',
    model: 'claude-opus-5-5',
    ...overrides,
  }
}

describe('Claude Plan model names', () => {
  it('passes full model IDs through as pinned versions', () => {
    expect(normalizeClaudeModel('claude-opus-5-5')).toBe('claude-opus-5-5')
    expect(normalizeClaudeModel(' claude-fable-5-1 ')).toBe('claude-fable-5-1')
    expect(normalizeClaudeModel('claude-sonnet-5-20260715')).toBe(
      'claude-sonnet-5-20260715',
    )
  })

  it('keeps aliases and folds free-text names to the family alias', () => {
    expect(normalizeClaudeModel('opus')).toBe('opus')
    expect(normalizeClaudeModel('default')).toBe('default')
    expect(normalizeClaudeModel('Claude Fable')).toBe('fable')
    expect(normalizeClaudeModel('sonnet latest')).toBe('sonnet')
  })
})

describe('Claude Plan effort', () => {
  it('sends low effort when thinking is turned off, even with adaptive settings saved', () => {
    expect(
      claudeEffort(
        claudeModel({
          thinking: {
            enabled: false,
            mode: 'adaptive',
            effort: 'xhigh',
            display: 'summarized',
          },
        }),
      ),
    ).toBe('low')
  })

  it('uses the adaptive effort when thinking is on and high otherwise', () => {
    expect(
      claudeEffort(
        claudeModel({
          thinking: {
            enabled: true,
            mode: 'adaptive',
            effort: 'medium',
            display: 'omitted',
          },
        }),
      ),
    ).toBe('medium')
    expect(claudeEffort(claudeModel())).toBe('high')
  })
})

describe('Claude Code version requirements', () => {
  it('knows which pinned models need a newer Claude Code', () => {
    expect(getClaudeModelRequirement('claude-opus-5-5')?.minimumVersion).toBe(
      '2.1.280',
    )
    expect(getClaudeModelRequirement('claude-sonnet-5-5')?.minimumVersion).toBe(
      '2.1.280',
    )
    expect(getClaudeModelRequirement('claude-fable-5-1')?.minimumVersion).toBe(
      '2.1.257',
    )
    expect(getClaudeModelRequirement('opus')).toBeUndefined()
    expect(getClaudeModelRequirement('claude-opus-5')).toBeUndefined()
  })

  it('parses the Claude Code version line', () => {
    expect(parseClaudeCodeVersion('2.1.285 (Claude Code)')).toEqual([2, 1, 285])
    expect(parseClaudeCodeVersion('unknown')).toBeUndefined()
  })

  it('rejects an older Claude Code and allows newer or unreadable versions', () => {
    expect(() =>
      assertClaudeCodeSupportsModel('claude-opus-5-5', '2.1.270 (Claude Code)'),
    ).toThrow(
      'Claude Opus 5.5 needs Claude Code 2.1.280 or later (installed: 2.1.270).',
    )
    expect(() =>
      assertClaudeCodeSupportsModel('claude-opus-5-5', '2.1.285 (Claude Code)'),
    ).not.toThrow()
    expect(() =>
      assertClaudeCodeSupportsModel('claude-fable-5-1', '2.1.257'),
    ).not.toThrow()
    expect(() =>
      assertClaudeCodeSupportsModel('claude-opus-5-5', 'garbled'),
    ).not.toThrow()
  })

  it('runs --version only for pinned models with a requirement', async () => {
    const runner = jest.fn().mockResolvedValue({
      stdout: '2.1.270 (Claude Code)\n',
      stderr: '',
      exitCode: 0,
    })

    await checkClaudeCodeSupportsModel({
      executablePath: '/bin/claude',
      model: 'sonnet',
      env: {},
      runner,
    })
    expect(runner).not.toHaveBeenCalled()

    await expect(
      checkClaudeCodeSupportsModel({
        executablePath: '/bin/claude',
        model: 'claude-sonnet-5-5',
        env: { PATH: '/safe' },
        runner,
      }),
    ).rejects.toThrow('Claude Sonnet 5.5 needs Claude Code 2.1.280 or later')
    expect(runner).toHaveBeenCalledWith(
      expect.objectContaining({
        executable: '/bin/claude',
        args: ['--version'],
        env: { PATH: '/safe' },
      }),
    )
  })

  it('skips the check when the version command fails or times out', async () => {
    const runner = jest
      .fn()
      .mockRejectedValue(new DOMException('Request aborted', 'AbortError'))

    await expect(
      checkClaudeCodeSupportsModel({
        executablePath: '/bin/claude',
        model: 'claude-opus-5-5',
        env: {},
        runner,
      }),
    ).resolves.toBeUndefined()
  })

  it('still stops when the user cancels during the version check', async () => {
    const controller = new AbortController()
    const runner = jest.fn(() => {
      controller.abort()
      return Promise.reject(new DOMException('Request aborted', 'AbortError'))
    })

    await expect(
      checkClaudeCodeSupportsModel({
        executablePath: '/bin/claude',
        model: 'claude-opus-5-5',
        env: {},
        signal: controller.signal,
        runner,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
