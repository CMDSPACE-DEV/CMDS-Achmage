# R-050: Model Catalog Refresh 2026-10

> [!NOTE] Renumbered 2026-10-14
> Written as R-045 on `feat/model-catalog-2026-10`. CMDS Achmage 1.3.0 had
> already shipped a different R-045 (optional research credentials) and an
> R-044 (model catalog refresh and runtime discovery), so this report became
> R-050 and its companion organization-login report became R-049. Read it with
> R-044: 1.3.0 shipped settings schema 32, so this report's migration runs as
> 32 -> 33.

## Status

- Evidence status: **Partially verified**
- Planning use: **Mandatory** for the chat model catalog, Plan model
  handling (Claude Code, Codex, Antigravity), and the Anthropic API request
  shape
- Investigation date: 2026-10-01
- Repository baseline: `CMDSPACE-DEV/CMDS-Achmage` `main` at
  `d7eba16777e0577adb6b137e9aaa8dc6521bf053` (version `1.2.0`, settings
  schema 31), branch `feat/model-catalog-2026-10`
- Runtimes inspected: Claude Code `2.1.285`, Antigravity CLI `1.2.14`, on
  Windows 11
- Target release: next CMDS Achmage release; closes
  [#39](https://github.com/CMDSPACE-DEV/CMDS-Achmage/issues/39)

> [!NOTE]
> This report extends R-030 (chat model catalog registration) and R-024/R-028
> (Antigravity protocol and compatibility guard). It is independent of R-049 (organization login, written as R-044);
> both edit `ClaudeAgentProvider.ts` and the register, so whichever pull
> request merges second is rebased.

## Executive Summary

Issue #39 asked for the models released since 1.2.0, the plan models that are
also on the API, current prices, and removal of retired models. Checking
first-party sources and the installed CLIs found more than a missing list:

- **Claude Plan could not run a pinned model.** `normalizeClaudeModel()`
  folded every name containing "opus", "sonnet", "haiku", or "fable" into the
  family alias, so `claude-opus-4.8 (plan)` silently ran the newest Opus.
  Full `claude-*` IDs now pass through; pinned Opus 5.5, Sonnet 5.5, and
  Fable 5.1 entries check the installed Claude Code version first.
- **Claude Plan "off" did not lower effort.** `claudeEffort()` returned the
  saved adaptive effort even when thinking was disabled, so internal RAG calls
  that set `enabled: false` ran at `high`. Disabled thinking now means `low`.
- **GPT-6 Plan models were not handled.** Six modules hard-coded the three
  GPT-5.6 tiers. One table (`core/llm/openaiPlanModels.ts`) now holds each
  model's accepted efforts, default effort, internal-call effort, and image
  capability.
- **Antigravity 1.2 removed `agy models --json`.** The call exits with
  "flags provided but not defined: -json"; CMDS worked only through its text
  fallback, read `id<TAB>label` rows with the ID as the label, and let
  Antigravity's Claude and GPT-OSS models into Gemini Plan. One `agy models`
  call now reads the catalog and keeps Gemini models only.
- **`GOOGLE_GEMINI_BASE_URL` was not blocked.** Antigravity sends model
  requests to that endpoint instead of Google's, a gateway billing route.
- **The Anthropic API request shape no longer fits current models.** Claude
  4.7+ rejects `budget_tokens` and non-default sampling; Opus 5.5 cannot
  disable thinking and Sonnet 5.5 rejects `disabled`; Fable rejects a thinking
  parameter. Earlier turns' thinking blocks are now dropped before replay
  because 5.5/Fable 5.1 bind each block to the exact earlier conversation.
- **Retired models were still defaults**: `gemini-3-pro-preview` (shut down
  2026-03-09), `grok-4-1-fast*` (2026-05-15), `deepseek-chat`/`-reasoner`
  (2026-07-24), `o4-mini` (2026-10-23), `text-embedding-004` (2026-01-14),
  `gemini-2.5-flash-image` (2026-10-02).

Settings schema 32 (`31_to_32`) moves stored data accordingly.

## Research Question

Which models and request shapes should CMDS Achmage ship for each provider on
2026-10-01, and what must change in stored settings so existing vaults keep
working?

### In scope

- Claude Plan (Claude Code), OpenAI Plan (Codex), Gemini Plan (Antigravity)
  model handling.
- API catalog and prices for Anthropic, OpenAI, Gemini, xAI, DeepSeek.
- Image and embedding models in the default catalogs.
- Anthropic Messages API request parameters.

### Out of scope

- Live API-key requests (no API keys were used).
- OpenAI image-model support for API keys (CMDS has none today).
- R-049's organization login handling (written as R-044).

## Baseline And Reproducibility

- Repository `main` at `d7eba16`; branch `feat/model-catalog-2026-10`.
- `claude --version` → `2.1.285 (Claude Code)`; `agy --version` → `1.2.14`.
- `agy models --json` → exit 1, stderr `Error: flags provided but not
  defined: -json`.
- `agy models` → `Fetching available models...` then `id<TAB>label` rows:
  `gemini-3.8/3.7/3.6-flash-{high,medium,low}`, `gemini-3.1-pro-{high,low}`,
  plus Claude and GPT-OSS rows.
- Claude Code headless request with `--model claude-sonnet-5-5` through the
  NotePack CODEX 4.0 runtime, which uses the CMDS flag set → success;
  `system/init` reported `model: claude-sonnet-5-5`.
- Antigravity headless request with `--model gemini-3.8-flash-medium` →
  success.

## Sources Inspected

### Repository source

- `src/constants.ts` (`DEFAULT_CHAT_MODELS`, prices, embedding defaults)
- `src/core/llm/native/ClaudeAgentProvider.ts` (`normalizeClaudeModel`,
  `claudeEffort`)
- `src/core/llm/native/NativeRuntimeAuth.ts`, `NativeRuntimeService.ts`
  (Antigravity catalog)
- `src/core/llm/openaiCodexProvider.ts`, `codexMessageAdapter.ts`,
  `providerCapabilities.ts`, `src/core/rag/internalModel.ts`,
  `src/components/chat-view/chat-input/reasoning-effort.ts`,
  `src/components/settings/sections/models/ChatModelSettings.tsx`
- `src/core/llm/anthropic.ts`, `src/core/image/image-model-catalog.ts`,
  `src/utils/llm/price-calculator.ts`, `src/database/schema.ts`

### First-party external sources (accessed 2026-10-01)

- OpenAI API: [models](https://developers.openai.com/api/docs/models),
  [pricing](https://developers.openai.com/api/docs/pricing),
  [deprecations](https://developers.openai.com/api/docs/deprecations),
  [reasoning](https://developers.openai.com/api/docs/guides/reasoning),
  [predicted outputs](https://developers.openai.com/api/docs/guides/predicted-outputs)
- OpenAI Codex: [models](https://developers.openai.com/codex/models),
  [configuration reference](https://developers.openai.com/codex/config-reference)
- Anthropic: [models overview](https://platform.claude.com/docs/en/about-claude/models/overview),
  [pricing](https://platform.claude.com/docs/en/about-claude/pricing),
  [model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations),
  [effort](https://platform.claude.com/docs/en/build-with-claude/effort);
  migration notes for Fable 5.1, Opus 5.5, and Sonnet 5.5 (thinking
  parameters, preserved thinking, refusal stop reason) from Anthropic's Claude
  API reference shipped with Claude Code 2.1.284
- Google: [Gemini models](https://ai.google.dev/gemini-api/docs/models),
  [pricing](https://ai.google.dev/gemini-api/docs/pricing),
  [deprecations](https://ai.google.dev/gemini-api/docs/deprecations),
  [thinking](https://ai.google.dev/gemini-api/docs/thinking),
  [embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- Antigravity CLI: [installation and auth](https://antigravity.google/docs/cli/install)
  (API-key mode, `GOOGLE_GEMINI_BASE_URL`)
- xAI: [models](https://docs.x.ai/developers/models),
  [pricing](https://docs.x.ai/developers/pricing),
  [May 15 retirement](https://docs.x.ai/developers/migration/may-15-retirement)
- DeepSeek: [pricing](https://api-docs.deepseek.com/quick_start/pricing),
  [updates](https://api-docs.deepseek.com/updates),
  [V4.1 Flash release](https://api-docs.deepseek.com/news/news260910)

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | Full Claude IDs reach Claude Code unchanged and run that model | Verified: live | `--model claude-sonnet-5-5` request; `system/init.model` = `claude-sonnet-5-5` | High |
| E-02 | Pinned Opus/Sonnet 5.5 need Claude Code 2.1.280+, Fable 5.1 needs 2.1.257+ | Partially verified | First-party Claude Code documentation reviewed during planning (page not recorded); only 2.1.285 observed locally | Medium |
| E-03 | `normalizeClaudeModel` folded pinned names into aliases | Verified: source | `ClaudeAgentProvider.ts` before this change | High |
| E-04 | `claudeEffort` ignored `enabled: false` for adaptive settings | Verified: source | Adaptive branch returned before the disabled check | High |
| E-05 | `agy models --json` fails on 1.2.14; `agy models` prints `id<TAB>label` | Verified: live | Commands above | High |
| E-06 | `GOOGLE_GEMINI_BASE_URL` redirects Antigravity model requests | Verified: first-party docs | Antigravity installation and auth page | High |
| E-07 | GPT-6.1 Sol and GPT-6 Astra reject `none`; GPT-6 Sol and Luna accept `none`..`max` | Verified: first-party docs | OpenAI model pages | High |
| E-08 | Codex "Ultra" runs subagents and is not a per-request effort | Verified: first-party docs | Codex models page | High |
| E-09 | GPT-5.6 Sol/Terra/Luna stay available during the GPT-6 rollout | Verified: first-party docs | Codex models page | High |
| E-10 | GPT-6 models work on CMDS's OAuth Codex path | Not verified | No OpenAI Plan login was available; R-030 E-5 shows the backend can gate new models by client version | Not applicable |
| E-11 | GPT-6 Plan models can run the hosted image tool | Not verified | Only GPT-5.6 is verified (R-001) | Not applicable |
| E-12 | Claude 4.7+ reject non-default sampling; Opus 5.5 cannot disable thinking; Sonnet 5.5 rejects `disabled`; Fable rejects a thinking parameter | Verified: first-party docs | Anthropic models overview and migration notes | High |
| E-13 | 5.5 and Fable 5.1 bind thinking blocks to the earlier conversation; dropping a leading run of blocks is allowed | Verified: first-party docs | Anthropic migration notes (preserved thinking) | High |
| E-14 | Retirement dates listed in the summary | Verified: first-party docs | Provider deprecation pages | High |
| E-15 | Vector indexes cover up to 1792 dimensions | Verified: source | `src/database/schema.ts` | High |

## Verified Findings

### 1. Claude Plan pinned models

Claude Code accepts full model IDs (E-01). The fold to aliases (E-03) made
pinned entries misleading, so names that are full `claude-*` IDs now pass
through and every other name keeps folding. Because stored entries relied on
the fold, `31_to_32` rewrites every stored Claude Plan entry with a full ID to
its family alias (its previous behavior), including entries whose ID matches a
new pinned model; only the pinned built-ins that 32 inserts stay pinned. The
built-in `claude-opus-4.8 (plan)` and `claude-sonnet-5 (plan)` are removed and
their selections move to the `-latest (plan)` alias entries, which ran the
same model and work with any Claude Code version. If a user deleted those
alias entries, the old entries stay with their model folded instead. Pinned
entries call `claude --version` once per request and stop with an update
message when the CLI is older than E-02 requires; a slow or failing version
check is skipped, and only a user cancellation stops the request.

### 2. GPT Plan capability table

`openaiPlanModels.ts` replaces the GPT-5.6 checks in the Codex provider, the
adapter's model guard, provider capabilities, internal RAG effort, the quick
effort control, and the model settings dialog. Unknown Codex models still pass
through. The model guard accepts a dated snapshot of the requested model and
rejects any other model. GPT-6 image generation stays off until E-11 is
verified. Older dialogs let any Codex model save `minimal` or `none`; `31_to_32`
turns a stored effort the model does not accept into `low`.

### 3. Antigravity catalog

One `agy models` call reads the catalog (E-05). The parser recognizes
`id<TAB>label` and the older `label  slug` rows, keeps only `gemini-*` IDs, and
the JSON-only classifier is removed; JSON output, if any, still passes through
the shared Cloud and signed-out checks. `GOOGLE_GEMINI_BASE_URL` joins the
blocked variables (E-06).

### 4. Anthropic API request shape

`anthropicRequestShape.ts` maps each model to adaptive (4.6+, 5.x),
always-on (Fable, Mythos), or budget (Haiku 4.5 and older) and builds the
thinking, `output_config.effort`, `max_tokens` (16k when thinking is adaptive),
and sampling parameters (E-12). No saved thinking setting means the model's
own default; thinking "off" (`enabled: false`) becomes effort `low` on the 5.5
models and Fable, `{type: 'disabled'}` on Opus 5 and Sonnet 5, and no thinking
on 4.6 to 4.8. Internal retrieval calls send `enabled: false`; the new 5.x API
entries ship with adaptive thinking at `high`, like the Plan entries. Claude
4.6 effort is capped at `high`. A `refusal` stop reason is reported as an
error. API Claude models get an Effort setting instead of a token budget.

Thinking blocks are replayed only for the tool loop in progress (E-13). A loop
is in progress when tool results follow the last assistant turn; instructions
appended after them do not end it (retrieval adds a user-role instruction after
the whole history on every iteration). Every earlier assistant turn's blocks
are dropped, which is a leading run of blocks and therefore allowed.

### 5. Catalog, prices, image and embedding models

Defaults follow the provider pages (E-14): Claude Opus 5.5, Sonnet 5.5,
Fable 5.1, Opus 5, Sonnet 5, Opus 4.8, Sonnet 4.6, Haiku 4.5; GPT-6.1 Sol,
GPT-6 Astra, GPT-6 Sol, GPT-6 Luna, GPT-5.5, GPT-4.1 mini (kept as the apply
model because it supports Predicted Outputs); Gemini 3.8 Flash, 3.1 Pro
Preview, 3.5 Flash-Lite; DeepSeek V4.1 Flash and V4 Pro; Grok 4.7 and 4.3.
Prices are per million tokens at the standard tier; long-context and
off-peak rates are not modelled, and the calculator now prices DeepSeek.
`gemini-3.1-flash-lite-image` joins the image catalog. `gemini-embedding-2`
replaces `text-embedding-004` at 768 output dimensions, inside the index limit
(E-15); its vectors differ from the old model's, so the index is rebuilt.

## Inferences Requiring Validation

- **Thinking binding within a tool loop.** The chat rebuilds every request,
  including the current-file message. If a tool edits the current file during
  a loop, that message changes and, on accounts that enforce preserved
  thinking, the next request of the loop can be rejected. The opt-in
  `drop_block` behavior would turn that into dropped blocks; it is not adopted
  here.

- **GPT-6 on the Codex OAuth path (E-10).** Sign in to OpenAI Plan and send one
  request each to `gpt-6.1-sol (plan)` and `gpt-6-luna (plan)`. A "requires a
  newer version of Codex" error means the backend gates the plugin's client;
  do not fake a client version, keep GPT-5.6 selected instead.
- **GPT-6 image generation (E-11).** Try one image with a GPT-6 Plan model
  before enabling it in the table.
- **Anthropic API requests.** Exercise one request per style (Opus 5.5,
  Sonnet 5, Fable 5.1, Haiku 4.5) with an API key, including a regenerated
  turn in a conversation with thinking.
- **Claude Code minimum versions (E-02).** Confirm the error text with an older
  Claude Code if one is available.

## Decision And Implementation Contract

- Settings schema 32: retired built-in models are removed only when both the
  id and provider type match and their successor is present; selections move
  only when their model is gone; new models are inserted next to their
  provider type without overwriting existing ids; stored Claude Plan entries
  keep alias behavior; unsupported stored Codex efforts become `low`.
- `openaiPlanModels.ts` is the single source of GPT Plan model limits.
- `anthropicRequestShape.ts` is the single source of Anthropic API reasoning
  parameters.

## Expected Change Surface

- Source: the files listed under Repository source plus the new
  `openaiPlanModels.ts`, `anthropicRequestShape.ts`,
  `native/claudeModelRequirements.ts`, and `migrations/31_to_32.ts`.
- Schema: version 31 → 32.
- Platform: no change; Plan models remain desktop-only.

## Verification

- `npm run type:check`, `npm run lint:check` (0 errors), `npm test`
  (120 suites, 838 tests), `npm run build` with the bundle budget, and the
  Obsidian review ESLint configuration, on Node 25 / Windows 11.

## Change Log

- 2026-10-01: Initial report for issue #39.
