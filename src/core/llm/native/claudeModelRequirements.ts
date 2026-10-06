import type { NativeProcessOptions, NativeProcessResult } from './NativeProcess'

type ClaudeModelRequirement = {
  pattern: RegExp
  label: string
  minimumVersion: string
}

// Pinned Claude Plan models need a Claude Code release that knows them (R-045).
const CLAUDE_MODEL_REQUIREMENTS: readonly ClaudeModelRequirement[] = [
  {
    pattern: /^claude-opus-5-5(?:$|-)/,
    label: 'Claude Opus 5.5',
    minimumVersion: '2.1.280',
  },
  {
    pattern: /^claude-sonnet-5-5(?:$|-)/,
    label: 'Claude Sonnet 5.5',
    minimumVersion: '2.1.280',
  },
  {
    pattern: /^claude-fable-5-1(?:$|-)/,
    label: 'Claude Fable 5.1',
    minimumVersion: '2.1.257',
  },
]

const VERSION_CHECK_TIMEOUT_MS = 15_000

export function getClaudeModelRequirement(
  model: string,
): ClaudeModelRequirement | undefined {
  return CLAUDE_MODEL_REQUIREMENTS.find((requirement) =>
    requirement.pattern.test(model),
  )
}

export function parseClaudeCodeVersion(output: string): number[] | undefined {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(output)
  return match
    ? [Number(match[1]), Number(match[2]), Number(match[3])]
    : undefined
}

function compareVersions(left: number[], right: number[]): number {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

/**
 * Throws when the installed Claude Code predates a pinned model. An unreadable
 * version passes, so the request reports whatever Claude Code itself says.
 */
export function assertClaudeCodeSupportsModel(
  model: string,
  versionOutput: string,
): void {
  const requirement = getClaudeModelRequirement(model)
  const installed = parseClaudeCodeVersion(versionOutput)
  const required = requirement
    ? parseClaudeCodeVersion(requirement.minimumVersion)
    : undefined
  if (!requirement || !installed || !required) return
  if (compareVersions(installed, required) < 0) {
    throw new Error(
      `${requirement.label} needs Claude Code ${requirement.minimumVersion} or later (installed: ${installed.join('.')}). Update Claude Code, then try again.`,
    )
  }
}

/** Runs `claude --version` only for pinned models with a minimum version. */
export async function checkClaudeCodeSupportsModel(params: {
  executablePath: string
  model: string
  env: NodeJS.ProcessEnv
  signal?: AbortSignal
  runner: (options: NativeProcessOptions) => Promise<NativeProcessResult>
}): Promise<void> {
  if (!getClaudeModelRequirement(params.model)) return
  const controller = new AbortController()
  const abort = () => controller.abort()
  params.signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, VERSION_CHECK_TIMEOUT_MS)
  let result: NativeProcessResult
  try {
    result = await params.runner({
      executable: params.executablePath,
      args: ['--version'],
      env: params.env,
      signal: controller.signal,
    })
  } catch (error) {
    // Only a user cancellation stops the request; a slow or failing version
    // check lets Claude Code report its own error instead.
    if (params.signal?.aborted) throw error
    return
  } finally {
    clearTimeout(timeout)
    params.signal?.removeEventListener('abort', abort)
  }
  if (result.exitCode === 0) {
    assertClaudeCodeSupportsModel(params.model, result.stdout)
  }
}
