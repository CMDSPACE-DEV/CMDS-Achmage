import { requireNode } from './nodeRuntime'

const MARKER = '__CMDS_CLAUDE_CONFIG_DIR__'
const SHELL_TIMEOUT_MS = 5_000

type ShellReader = (shell: string) => string

let cached: { value: string | undefined } | undefined

/**
 * Obsidian started from the Dock or Finder does not read the user's shell
 * startup files, so it misses a `CLAUDE_CONFIG_DIR` exported there. Claude
 * Code then reads the default `~/.claude` login instead of the one the user
 * signed in to from the terminal, and Plan diagnosis reports "Login required"
 * (R-052). Copy only that one variable from the login shell; every other
 * variable, including billing overrides, stays as Obsidian received it.
 */
export function withClaudeShellConfigDir(
  source: NodeJS.ProcessEnv,
  options: {
    platform?: NodeJS.Platform
    readShell?: ShellReader
    exists?: (path: string) => boolean
  } = {},
): NodeJS.ProcessEnv {
  const platform = options.platform ?? process.platform
  if (platform === 'win32' || source.CLAUDE_CONFIG_DIR?.trim()) return source
  const configuredShell = source.SHELL?.trim()
  const shell = configuredShell ? configuredShell : '/bin/zsh'

  if (!options.readShell) {
    cached ??= { value: readFromShell(shell, readLoginShell, options.exists) }
    return cached.value
      ? { ...source, CLAUDE_CONFIG_DIR: cached.value }
      : source
  }
  const value = readFromShell(shell, options.readShell, options.exists)
  return value ? { ...source, CLAUDE_CONFIG_DIR: value } : source
}

function readFromShell(
  shell: string,
  readShell: ShellReader,
  exists: (path: string) => boolean = directoryExists,
): string | undefined {
  try {
    const output = readShell(shell)
    const start = output.indexOf(MARKER)
    const end = output.lastIndexOf(MARKER)
    if (start < 0 || end <= start) return undefined
    const value = output.slice(start + MARKER.length, end).trim()
    // Accept only an existing absolute directory; anything else keeps the
    // Claude Code default rather than pointing it somewhere unexpected.
    if (!value.startsWith('/') || value.includes('\n')) return undefined
    return exists(value) ? value : undefined
  } catch {
    return undefined
  }
}

function readLoginShell(shell: string): string {
  const { execFileSync } =
    requireNode<typeof import('child_process')>('child_process')
  return execFileSync(
    shell,
    ['-ilc', `printf '%s%s%s' '${MARKER}' "$CLAUDE_CONFIG_DIR" '${MARKER}'`],
    {
      encoding: 'utf8',
      timeout: SHELL_TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { ...process.env, DISABLE_AUTO_UPDATE: 'true' },
    },
  )
}

function directoryExists(path: string): boolean {
  try {
    return requireNode<typeof import('fs')>('fs').statSync(path).isDirectory()
  } catch {
    return false
  }
}

/**
 * Applies the shell lookup only to the live Obsidian process environment.
 * Injected environments (tests, callers that already decided) pass through.
 */
export function claudeEnvironmentSource(
  source: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  return source === process.env ? withClaudeShellConfigDir(source) : source
}
