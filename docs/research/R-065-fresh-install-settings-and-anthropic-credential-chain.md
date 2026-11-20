# R-065: Console errors on a fresh install and on keyless Anthropic clients

## Status

- Evidence status: **Partially verified**; both causes reproduced (unit tests and
  a live Obsidian renderer probe), fixed build not yet run in a clean vault
- Planning use: **Mandatory for settings loading/migrations and for
  Anthropic API client construction**
- Investigation date: 2026-11-21
- Repository baseline: `main` at `0cd7655` (1.3.2 plus #113)
- Target release, if any: none chosen; the PR does not change the version

## Executive Summary

A collaborator testing PR #101 in Obsidian reported two developer-console
errors. Neither is specific to that PR; both are in `main`.

1. **`Invalid settings provided, using defaults: TypeError: Cannot read
   properties of undefined (reading 'baseUrl')`** on plugin load. On a fresh
   install `loadData()` resolves to `null`. `migrateSettings` reads the missing
   `version` as 0 and runs the whole chain on `{}`. `0_to_1` writes the three
   Ollama blocks only when v0 had `ollamaBaseUrl`, and `1_to_2` reads
   `data.ollamaEmbeddingModel.baseUrl` unguarded. The catch then falls back to
   the schema defaults, so first-run settings were already correct, but every
   first launch logged a TypeError. The same throw would reset **all** settings
   to defaults for any v0/v1 data without the Ollama blocks.
2. **`Access to script at 'node:path' … blocked by CORS policy`** when chat
   creates an Anthropic API client without a key. `AnthropicProvider` passed
   `apiKey: provider.apiKey` (possibly `undefined`). `@anthropic-ai/sdk` 0.93.0
   then reads `ANTHROPIC_API_KEY` and, when that is unset, starts its
   credential-file chain **in the constructor**. The chain calls
   `import('node:path')`, which Chromium treats as a module URL fetch. The
   plugin's own missing-key check still ran, so the visible result was only
   the console error.

Fixes: a fresh install (`null`, `undefined`, non-object, array, or `{}`)
starts at `SETTINGS_SCHEMA_VERSION` without running migrations; `1_to_2` fills
missing Ollama blocks with the empty values the former v1 schema used; and
`AnthropicProvider` passes `provider.apiKey ?? ''`, as the other 11 API
providers already do.

## Research Question

Where do the two console errors in the PR #101 feedback come from, do they
affect `main`, and what is the smallest change that removes them without
changing what users get?

### In scope

- `parseSmartComposerSettings` / `migrateSettings` on empty and early-version
  data.
- `AnthropicProvider` construction and the SDK's default credential chain.

### Out of scope

- Pele (#101) UI feedback items 1 and 2 (editor UX, `/diagram` discovery).
- Backing up unparseable settings before the defaults are saved. The schema
  uses `.catch` on 60 fields, so a parse failure is rare; the realistic
  trigger was the migration throw fixed here. Recorded as deferred.

## Baseline And Reproducibility

- Source: `main` at `0cd7655`, Node 22.22.1, Jest 29 (`testEnvironment: node`).
- Error 1, unit reproduction: `parseSmartComposerSettings(null)` with
  `console.warn` spied prints exactly the reported message and
  `TypeError: Cannot read properties of undefined (reading 'baseUrl')`. The
  existing test "should return default values for empty input" passed anyway,
  because the fallback returns the same defaults.
- Error 2, live renderer probe: in a running Obsidian vault,
  `obsidian eval code="import('node:path').then(()=>'loaded', e => 'FAILED: ' + e.message)"`
  returned `FAILED: Failed to fetch dynamically imported module: node:path`,
  while `typeof require('path').join` returned `function`. No plugin state was
  read or changed.
- Bundle check: every `import("node:path")` and `import("node:fs")` in the
  production `main.js` (5 and 7 call sites) comes from
  `@anthropic-ai/sdk`'s credential modules; none comes from plugin source.

## Sources Inspected

### Repository source

- `src/settings/schema/settings.ts:22` — `migrateSettings`, `version ?? 0`
- `src/settings/schema/settings.ts:58` — catch-all fallback and the warning
- `src/settings/schema/migrations/0_to_1.ts` — Ollama blocks written only
  when `ollamaBaseUrl` exists
- `src/settings/schema/migrations/1_to_2.ts:280` — unguarded Ollama reads; the
  v1 shape has been a type only since before #49 (`8693360`)
- `src/main.ts:415` — `loadSettings` saves the parsed result immediately
- `src/core/llm/anthropic.ts:58` — client construction
- `src/core/llm/*Provider.ts`, `openai.ts`, `gemini.ts`, `ollama.ts` — the
  other 11 providers pass `provider.apiKey ?? ''`

### Dependency source (`@anthropic-ai/sdk` 0.93.0, `node_modules`)

- `src/client.ts:472-477` — `apiKey === undefined` reads `ANTHROPIC_API_KEY`
- `src/client.ts:551-570` — with no key, token, credentials, config, or
  profile, the constructor calls `_resolveDefaultCredentials()`
- `src/core/credentials.ts:129,277,286,339` and
  `src/lib/credentials/types.ts:212` — `await import('node:path')`

### First-party external sources

- None needed; the behavior is fully determined by the pinned dependency source
  above.

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | A fresh install logs the reported TypeError and falls back to defaults | Verified: unit reproduction | `parseSmartComposerSettings(null)` with `console.warn` spied | High |
| E-02 | The fallback result equals `smartComposerSettingsSchema.parse({})`, so skipping migrations for empty data changes no first-run value | Verified: test | New test compares both for `null`, `undefined`, `{}` | High |
| E-03 | v0 data without `ollamaBaseUrl` reset every setting to defaults | Verified: test | `{ chatModel: 'gpt-4o' }` warned before the fix | High |
| E-04 | The `node:path` error comes from the Anthropic SDK credential chain started in the constructor | Verified: source + reported stack | `_resolveDefaultCredentials` frame in the report; SDK source lines above | High |
| E-05 | Dynamic `import('node:path')` fails in Obsidian's renderer | Verified: live probe | `obsidian eval` result above | High |
| E-06 | With `apiKey: ''` the SDK skips the chain and the plugin still raises `LLMAPIKeyNotSetException` | Verified: test | `anthropicCredentials.test.ts` spies on `_resolveDefaultCredentials` | High |
| E-07 | The fixed build loads without either console error in a clean vault | Not verified | Needs a clean-vault smoke run | Not applicable |

## Verified Findings

### 1. Fresh installs ran the v0 migration chain on an empty object

`migrateSettings` copies `data` with `{ ...data }`; for `null` that is `{}`.
With no `version`, every migration from `0_to_1` runs. `1_to_2` assumes the
stored v1 shape. Stored v1 data always had the Ollama blocks, because the v1
schema of that era filled them with `.catch({ baseUrl: '', model: '' })`, but
the migration only ever used that schema for its type (`z.infer`, before #49
removed it). Data that reaches `1_to_2` in memory through `0_to_1` therefore
can lack the blocks.

### 2. Keyless Anthropic clients started an SDK credential lookup

Only `AnthropicProvider` passed the key through unchanged. When the key was
never set it is `undefined`, the SDK falls through to its credential chain, and
the chain's dynamic `node:` imports fail in the renderer. A key stored as `''`
never started the chain, so behavior already depended on whether the field was
absent or empty.

## Inferences Requiring Validation

- The fixed build shows neither error when enabled in a new vault and when a
  chat is sent with an Anthropic API model and no key (E-07).

## Decision And Implementation Contract

- `migrateSettings` returns `{ version: SETTINGS_SCHEMA_VERSION }` for `null`,
  `undefined`, non-objects, arrays, and `{}`; the schema defaults fill the rest.
- `migrateFrom1To2` treats missing `ollamaChatModel`, `ollamaApplyModel`, and
  `ollamaEmbeddingModel` as `{ baseUrl: '', model: '' }`.
- `AnthropicProvider` passes `provider.apiKey ?? ''`.
- **Behavior change, deliberate:** a never-set Anthropic key no longer falls
  back to the `ANTHROPIC_API_KEY` environment variable. This matches the other
  providers and the settings UI, which only offers an in-plugin key. On macOS
  an app launched from the Dock does not see shell-only variables anyway
  (R-052).

## Expected Change Surface

- `src/settings/schema/settings.ts`, `src/settings/schema/migrations/1_to_2.ts`,
  `src/core/llm/anthropic.ts`, and their tests.
- No schema version change, no new migration, no bundle-size change of note.

## Test And Release Gates

- New tests fail on `0cd7655` (7 failures) and pass with the fix.
- Full Jest, `tsc`, ESLint (0 errors), Prettier, production build and bundle
  budget, and `tools/obsidian-review/check.mjs`.
- Release gate: E-07 in a clean vault on the release candidate.

## Known Unknowns And Deferred Decisions

1. Whether to keep a backup of unparseable `data.json` before `loadSettings`
   saves the defaults over it.

## Security And Privacy

No credentials, tokens, account identifiers, private vault content, or other
secrets were recorded. The test sets a placeholder `ANTHROPIC_API_KEY` value
and restores the environment afterwards.

## Change Log

- 2026-11-21: Initial report.
