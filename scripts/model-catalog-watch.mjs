#!/usr/bin/env node
/**
 * Model catalog watch (R-044).
 *
 * Compares the bundled chat model catalog with what vendors publish today and
 * reports drift. Run by .github/workflows/model-catalog-watch.yml on a
 * schedule; with --dry-run (or without GH_TOKEN) it only prints the report.
 *
 * What it checks:
 *   API models   New Anthropic / OpenAI / Gemini chat models missing from
 *                DEFAULT_CHAT_MODELS, and catalog models the vendor no longer
 *                lists (retired). Needs the vendor key in the environment;
 *                a missing key skips that vendor.
 *   OpenAI Plan  The public Codex catalog (openai/codex models.json) needs no
 *                key. Plan models themselves sync at runtime, so this flags
 *                what the runtime sync cannot fix: an outdated
 *                CODEX_CATALOG_CLIENT_VERSION, a slug the reasoning control
 *                does not recognize, or a new reasoning level.
 *   Claude/Gemini Plan  Runtime-owned (CLI aliases / `agy models`); not checked.
 *
 * Keys are sent in headers only and never printed.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const DRY_RUN = process.argv.includes('--dry-run') || !process.env.GH_TOKEN
const ISSUE_TITLE = 'Model catalog drift'
const ISSUE_LABEL = 'model-catalog'
// A vendor model counts as "new" only if it was published this recently.
// Older unlisted models are deliberate omissions; add them to the ignore file
// when a dateless vendor (Gemini) keeps reporting them.
const NEW_MODEL_WINDOW_DAYS = 120

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

// ---------------------------------------------------------------- catalog --

function readCatalog() {
  const source = read('src/constants.ts')
  const start = source.indexOf('export const DEFAULT_CHAT_MODELS')
  const end = source.indexOf('export const DEFAULT_EMBEDDING_MODELS')
  const block = source.slice(start, end)
  const entries = []
  const pattern =
    /providerType:\s*'([^']+)'[\s\S]*?model:\s*'([^']+)'(?:,\s*enable:\s*(true|false))?/g
  for (const match of block.matchAll(pattern)) {
    entries.push({
      providerType: match[1],
      model: match[2],
      enabled: match[3] !== 'false',
    })
  }
  if (entries.length === 0) {
    throw new Error('Could not read DEFAULT_CHAT_MODELS from src/constants.ts')
  }
  return entries
}

function readClientVersion() {
  const match = read('src/core/llm/modelDiscovery.ts').match(
    /CODEX_CATALOG_CLIENT_VERSION = '([^']+)'/,
  )
  if (!match) throw new Error('CODEX_CATALOG_CLIENT_VERSION not found')
  return match[1]
}

function readPlanEfforts() {
  const match = read('src/types/chat-model.types.ts').match(
    /GPT_5_6_EFFORTS = \[([\s\S]*?)\]/,
  )
  return new Set([...(match?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]))
}

const ignore = JSON.parse(read('scripts/model-catalog-ignore.json'))

// ---------------------------------------------------------------- filters --
// Keep in step with isChatCandidate in src/core/llm/modelDiscovery.ts.

function isChatCandidate(provider, id) {
  const lower = id.toLowerCase()
  if (provider === 'anthropic') return lower.startsWith('claude-')
  if (provider === 'openai') {
    return (
      /^(gpt-|o\d)/.test(lower) &&
      !/(embedding|tts|whisper|transcribe|audio|realtime|live|image|dall-e|moderation|search|codex|instruct|cyber)/.test(
        lower,
      ) &&
      !/-\d{4}-\d{2}-\d{2}$/.test(lower)
    )
  }
  return (
    lower.startsWith('gemini-') &&
    !/(embedding|tts|image|live|native-audio|transcribe|computer-use|customtools|robotics)/.test(lower)
  )
}

// GPT Plan ids the chat reasoning control recognizes (reasoning-effort.ts).
const PLAN_REASONING_SLUG = /^gpt-(?:5\.6|6(?:\.\d+)?)-[a-z]+$/

// ---------------------------------------------------------------- vendors --

async function getJson(url, headers = {}) {
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${new URL(url).host}`)
  return response.json()
}

const isRecent = (date) =>
  !date || Date.now() - date.getTime() < NEW_MODEL_WINDOW_DAYS * 86_400_000

async function listVendor(provider) {
  if (provider === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return null
    const body = await getJson('https://api.anthropic.com/v1/models?limit=1000', {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    })
    return body.data.map((m) => ({
      id: m.id,
      created: m.created_at ? new Date(m.created_at) : undefined,
    }))
  }
  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY
    if (!key) return null
    const body = await getJson('https://api.openai.com/v1/models', {
      authorization: `Bearer ${key}`,
    })
    return body.data.map((m) => ({
      id: m.id,
      created: m.created ? new Date(m.created * 1000) : undefined,
    }))
  }
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const body = await getJson(
    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
    { 'x-goog-api-key': key },
  )
  return body.models
    .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => ({ id: m.name.replace(/^models\//, '') }))
}

async function checkApiProvider(provider, catalog) {
  let listed
  try {
    listed = await listVendor(provider)
  } catch (error) {
    return { provider, error: error.message }
  }
  if (listed === null) return { provider, skipped: true }

  const known = new Set(
    catalog.filter((e) => e.providerType === provider).map((e) => e.model),
  )
  const ignored = new Set(ignore[provider] ?? [])
  const listedIds = new Set(listed.map((m) => m.id))
  const added = listed
    .filter((m) => isChatCandidate(provider, m.id))
    .filter((m) => !known.has(m.id) && !ignored.has(m.id) && isRecent(m.created))
    .map((m) => m.id)
    .sort()
  const retired = [...known].filter((id) => !listedIds.has(id)).sort()
  return { provider, added, retired }
}

async function checkCodexPlan() {
  const clientVersion = readClientVersion()
  const efforts = readPlanEfforts()
  const catalog = await getJson(
    'https://raw.githubusercontent.com/openai/codex/main/codex-rs/models-manager/models.json',
  )
  const release = await getJson('https://api.github.com/repos/openai/codex/releases/latest', {
    accept: 'application/vnd.github+json',
    ...(process.env.GH_TOKEN ? { authorization: `Bearer ${process.env.GH_TOKEN}` } : {}),
  })
  const latestVersion = String(release.tag_name).replace(/^rust-v/, '')
  const listed = catalog.models.filter((m) => m.visibility === 'list')

  return {
    clientVersion,
    latestVersion,
    // minimal_client_version above ours means the backend hides the model.
    hiddenByVersion: listed
      .filter((m) => compareVersions(m.minimal_client_version ?? '0', clientVersion) > 0)
      .map((m) => `${m.slug} (needs ${m.minimal_client_version})`),
    unrecognizedSlugs: listed
      .map((m) => m.slug)
      .filter((slug) => slug.startsWith('gpt-') && !PLAN_REASONING_SLUG.test(slug))
      .filter((slug) => !(ignore['openai-plan'] ?? []).includes(slug)),
    newEfforts: [
      ...new Set(
        listed.flatMap((m) =>
          (m.supported_reasoning_levels ?? []).map((level) => level.effort),
        ),
      ),
    ].filter((effort) => !efforts.has(effort)),
    slugs: listed.map((m) => m.slug),
  }
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return Math.sign(d)
  }
  return 0
}

// ----------------------------------------------------------------- report --

function render(apiResults, plan) {
  const lines = []
  const findings = []

  for (const result of apiResults) {
    if (result.skipped) {
      lines.push(`- **${result.provider}**: skipped (no API key secret)`)
      continue
    }
    if (result.error) {
      lines.push(`- **${result.provider}**: check failed — ${result.error}`)
      continue
    }
    if (result.added.length > 0) {
      findings.push(`${result.provider}:+${result.added.join(',')}`)
      lines.push(`- **${result.provider}** new: ${result.added.map((id) => `\`${id}\``).join(', ')}`)
    }
    if (result.retired.length > 0) {
      findings.push(`${result.provider}:-${result.retired.join(',')}`)
      lines.push(
        `- **${result.provider}** no longer listed (retired?): ${result.retired.map((id) => `\`${id}\``).join(', ')}`,
      )
    }
    if (result.added.length === 0 && result.retired.length === 0) {
      lines.push(`- **${result.provider}**: in sync`)
    }
  }

  if (plan.error) {
    lines.push(`- **OpenAI Plan (Codex catalog)**: check failed — ${plan.error}`)
  } else {
    if (compareVersions(plan.latestVersion, plan.clientVersion) > 0) {
      findings.push(`codex-client:${plan.latestVersion}`)
      lines.push(
        `- **OpenAI Plan**: \`CODEX_CATALOG_CLIENT_VERSION\` is ${plan.clientVersion}; Codex ${plan.latestVersion} is released. Bump it in \`src/core/llm/modelDiscovery.ts\`.`,
      )
    }
    if (plan.hiddenByVersion.length > 0) {
      findings.push(`codex-hidden:${plan.hiddenByVersion.join(',')}`)
      lines.push(`- **OpenAI Plan** hidden by our client version: ${plan.hiddenByVersion.join(', ')}`)
    }
    if (plan.unrecognizedSlugs.length > 0) {
      findings.push(`codex-slug:${plan.unrecognizedSlugs.join(',')}`)
      lines.push(
        `- **OpenAI Plan** slugs without a reasoning control (\`reasoning-effort.ts\`): ${plan.unrecognizedSlugs.join(', ')}`,
      )
    }
    if (plan.newEfforts.length > 0) {
      findings.push(`codex-effort:${plan.newEfforts.join(',')}`)
      lines.push(
        `- **OpenAI Plan** new reasoning levels not in \`GPT_5_6_EFFORTS\`: ${plan.newEfforts.join(', ')}`,
      )
    }
    lines.push(`- OpenAI Plan catalog (synced at runtime): ${plan.slugs.join(', ')}`)
  }

  const fingerprint = createHash('sha256').update(findings.join('|')).digest('hex').slice(0, 12)
  const body = [
    `Automated check (\`scripts/model-catalog-watch.mjs\`, R-044). Last run: ${new Date().toISOString()}.`,
    '',
    ...lines,
    '',
    'Checklist when acting on this: update `DEFAULT_CHAT_MODELS` and prices in `src/constants.ts`,',
    'add an insert-if-absent settings migration (see `31_to_32.ts`), and re-check the',
    'research register. Plan models are synced at runtime and need no catalog entry.',
    '',
    `<!-- fingerprint:${fingerprint} -->`,
  ].join('\n')
  return { body, hasDrift: findings.length > 0, fingerprint }
}

// ----------------------------------------------------------------- GitHub --

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' }).trim()
}

function publish({ body, hasDrift, fingerprint }) {
  const open = JSON.parse(
    gh(['issue', 'list', '--label', ISSUE_LABEL, '--state', 'open', '--json', 'number,body', '--limit', '1']),
  )[0]
  if (!hasDrift) {
    if (open) {
      gh(['issue', 'close', String(open.number), '--comment', 'Catalog is back in sync.'])
    }
    return
  }
  if (!open) {
    gh(['label', 'create', ISSUE_LABEL, '--color', 'E985A2', '--force'])
    gh(['issue', 'create', '--title', ISSUE_TITLE, '--label', ISSUE_LABEL, '--body', body])
    return
  }
  const previous = open.body.match(/fingerprint:([0-9a-f]+)/)?.[1]
  gh(['issue', 'edit', String(open.number), '--body', body])
  // Comment only when the findings change, so watchers are notified of a new
  // model once rather than on every scheduled run.
  if (previous !== fingerprint) {
    gh(['issue', 'comment', String(open.number), '--body', 'Findings changed; see the updated description.'])
  }
}

// ------------------------------------------------------------------- main --

const catalog = readCatalog()
const apiResults = await Promise.all(
  ['anthropic', 'openai', 'gemini'].map((provider) => checkApiProvider(provider, catalog)),
)
let plan
try {
  plan = await checkCodexPlan()
} catch (error) {
  plan = { error: error.message }
}

const report = render(apiResults, plan)
console.log(report.body)
if (process.env.GITHUB_STEP_SUMMARY) {
  await import('node:fs').then((fs) => fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report.body}\n`))
}
if (!DRY_RUN) publish(report)
