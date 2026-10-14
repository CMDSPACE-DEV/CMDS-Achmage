import { withClaudeShellConfigDir } from './claudeShellConfigDir'

const MARK = '__CMDS_CLAUDE_CONFIG_DIR__'
const shellPrinting = (value: string) => () =>
  `oh-my-zsh banner\n${MARK}${value}${MARK}`
const exists = () => true

describe('withClaudeShellConfigDir (R-052)', () => {
  it('adds CLAUDE_CONFIG_DIR from the login shell on macOS', () => {
    const env = withClaudeShellConfigDir(
      { PATH: '/usr/bin', SHELL: '/bin/zsh' },
      {
        platform: 'darwin',
        readShell: shellPrinting('/Users/u/.claude-x'),
        exists,
      },
    )
    expect(env.CLAUDE_CONFIG_DIR).toBe('/Users/u/.claude-x')
    expect(env.PATH).toBe('/usr/bin')
  })

  it('copies only CLAUDE_CONFIG_DIR, never other shell variables', () => {
    const env = withClaudeShellConfigDir(
      { PATH: '/usr/bin' },
      {
        platform: 'darwin',
        readShell: () => `ANTHROPIC_API_KEY=x\n${MARK}/a${MARK}`,
        exists,
      },
    )
    expect(Object.keys(env).sort()).toEqual(['CLAUDE_CONFIG_DIR', 'PATH'])
  })

  it.each([
    ['empty value', ''],
    ['relative path', '.claude'],
  ])('keeps the default on %s', (_, value) => {
    const source = { PATH: '/usr/bin' }
    expect(
      withClaudeShellConfigDir(source, {
        platform: 'darwin',
        readShell: shellPrinting(value),
        exists,
      }),
    ).toBe(source)
  })

  it('keeps the default when the directory does not exist', () => {
    const source = { PATH: '/usr/bin' }
    expect(
      withClaudeShellConfigDir(source, {
        platform: 'darwin',
        readShell: shellPrinting('/missing'),
        exists: () => false,
      }),
    ).toBe(source)
  })

  it('keeps the default when the shell fails or times out', () => {
    const source = { PATH: '/usr/bin' }
    expect(
      withClaudeShellConfigDir(source, {
        platform: 'darwin',
        readShell: () => {
          throw new Error('timeout')
        },
        exists,
      }),
    ).toBe(source)
  })

  it('does not override a value Obsidian already has', () => {
    const source = { CLAUDE_CONFIG_DIR: '/given' }
    const readShell = jest.fn(shellPrinting('/other'))
    expect(
      withClaudeShellConfigDir(source, {
        platform: 'darwin',
        readShell,
        exists,
      }),
    ).toBe(source)
    expect(readShell).not.toHaveBeenCalled()
  })

  it('does nothing on Windows', () => {
    const readShell = jest.fn(shellPrinting('/a'))
    const source = { PATH: 'C:\\' }
    expect(
      withClaudeShellConfigDir(source, {
        platform: 'win32',
        readShell,
        exists,
      }),
    ).toBe(source)
    expect(readShell).not.toHaveBeenCalled()
  })
})
