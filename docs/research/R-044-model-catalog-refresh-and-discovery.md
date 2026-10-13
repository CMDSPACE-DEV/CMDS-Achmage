# R-044: Model catalog refresh, runtime model discovery, and the scheduled catalog watch

## Status

- Evidence status: **Partially verified**
- Planning use: **Mandatory for chat model catalog, Plan model selection, and
  model-discovery work** (alongside R-030)
- Investigation date: 2026-09-30
- Repository baseline: `main` at `d7eba16` (version 1.2.0 line), branch
  `feat/model-catalog-sync`; settings schema 31 → 32
- Verified: first-party model pages, Codex source, live vendor model lists for
  OpenAI and Gemini, local tests/build.
- Pending: a live OpenAI Plan (ChatGPT account) call to
  `backend-api/codex/models` and a chat turn on a newly discovered GPT-6 Plan
  model; a live Anthropic `/v1/models` call (no key on the research machine).

## Executive Summary

The bundled catalog was one generation behind and contained one broken
default. `gemini-3-pro-preview` is shut down on the Gemini API but was a fresh
install API default. Anthropic API defaults stopped at Opus 4.8 / Sonnet 4.6
while Opus 5.5 / Sonnet 5.5 are current. OpenAI API defaults lacked
`gpt-6.1-sol` (released 2026-09-29) and `gpt-6-luna`.

The larger finding is structural. Claude Plan and Gemini Plan already track
their runtimes (stable CLI aliases; `agy models`). OpenAI Plan was the only
Plan path pinned to a static list, so every OpenAI launch needed a plugin
release. The ChatGPT-account Codex backend exposes the same model catalog Codex
CLI reads. The plugin now reads it at startup and on demand. API-key providers
get an explicit "새 모델 확인" picker, and a scheduled GitHub Action reports
catalog drift as an issue.

## Research Question

1. Which catalog entries are stale or broken as of 2026-09-30?
2. How can new models reach users without waiting for a plugin release,
   especially on the Plan paths?
3. What can safely be automated in CI, and what must stay a human decision?

### In scope

- `DEFAULT_CHAT_MODELS`, prices, the default chat model id.
- OpenAI Plan model discovery, GPT-6 reasoning controls, internal RAG effort.
- API-key model discovery UI.
- Scheduled drift detection.

### Out of scope

- Plan authentication, onboarding, updater, and billing provenance. R-023–R-029
  are unchanged. This work reads the model catalog only and adds no credential
  storage.
- Supporting the new `ultra` reasoning level (see Known Unknowns).

## Sources Inspected

### Repository source

- `src/constants.ts` (catalog, prices, default ids)
- `src/core/llm/openaiCodexProvider.ts` (auth headers, `withAuthRetry`)
- `src/components/settings/sections/PlanConnectionsSection.tsx`
  (`syncRuntimeModels` for Claude/Gemini)
- `src/core/llm/native/NativeRuntimeService.ts` (`defaultModels`,
  `agy models` parsing)
- `src/components/chat-view/chat-input/reasoning-effort.ts`,
  `src/core/rag/internalModel.ts`, `src/core/llm/providerCapabilities.ts`

### First-party external sources (accessed 2026-09-30)

- [OpenAI models](https://developers.openai.com/api/docs/models): flagships
  `gpt-6-astra` ($10/$50), `gpt-6.1-sol` ($2/$10), `gpt-6-luna` ($0.1/$0.5); no
  general GPT-5.6 entry (only `gpt-5.6-cyber`).
- [Claude models overview](https://platform.claude.com/docs/en/docs/about-claude/models/overview):
  `claude-fable-5-1`, `claude-opus-5-5` ($4/$20), `claude-sonnet-5-5`
  ($2/$10), `claude-haiku-4-5`; Opus 4.8 and Sonnet 4.6 are legacy.
- [Gemini API models](https://ai.google.dev/gemini-api/docs/models): stable
  `gemini-3.8-flash`, `gemini-3.5-flash-lite`; Pro only as
  `gemini-3.1-pro-preview`; `gemini-3-pro-preview` listed as shut down.
- openai/codex at `7219fd7` (main, 2026-09-30):
  `codex-rs/codex-api/src/endpoint/models.rs` (`/models?client_version=`),
  `codex-rs/protocol/src/openai_models.rs` (`ModelInfo`, `ModelVisibility`),
  `codex-rs/models-manager/models.json` (bundled catalog), latest release
  `rust-v0.159.2` (2026-09-29).

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | `gemini-3-pro-preview` is shut down on the Gemini API | Verified: official docs | Gemini models page, "Previous models (Shut down)" | High |
| E-02 | Opus 5.5 / Sonnet 5.5 are the current Anthropic API models | Verified: official docs | Claude models overview | High |
| E-03 | `gpt-6.1-sol`, `gpt-6-luna` exist on the OpenAI API | Verified: live | `GET /v1/models` via the watch script; both listed, no catalog model reported retired | High |
| E-04 | `gemini-3.1-pro-preview`, `gemini-3.8-flash`, `gemini-3.5-flash-lite` exist | Verified: live | `GET v1beta/models` via the watch script | High |
| E-05 | Codex reads its catalog from `{base}/models?client_version=X` and hides models above `minimal_client_version` | Verified: source | `models.rs`, `openai_models.rs` | High |
| E-06 | The ChatGPT base for that path is `https://chatgpt.com/backend-api/codex` | Inference | Same base the plugin already uses for `/responses` | Medium-high |
| E-07 | The plugin's OAuth bearer + `ChatGPT-Account-Id` are accepted by `/models` | Not verified | No live ChatGPT-account call on the research machine | Not applicable |
| E-08 | GPT-6 variants do not accept `none`; Astra/Sol add `ultra` | Verified: source | `models.json` `supported_reasoning_levels` | High for the Codex surface |
| E-09 | R-030's Astra "requires a newer version of Codex" was client-version gating | Inference | E-05 plus `gpt-6-astra` `minimal_client_version` 0.153.0 | Medium |
| E-10 | Claude Plan needs no catalog change for Opus 5.5 | Verified: source + R-024 | `opus`/`sonnet` aliases resolve at the CLI | High |

## Decision And Implementation

1. **Catalog (fresh installs).** API defaults are now `claude-opus-5.5`,
   `claude-sonnet-5.5`, `gpt-6.1-sol`, `gpt-6-luna`, `gemini-3.1-pro-preview`,
   `gemini-3.8-flash`, and `gemini-3.5-flash-lite`. `DEFAULT_CHAT_MODEL_ID` is
   `claude-sonnet-5.5`. List prices were added for the new API ids, including
   Astra, which R-030 had deliberately left unpriced.
2. **Migration 31 → 32 (existing vaults).** Inserts those entries if absent.
   API entries on the shut-down `gemini-3-pro-preview` are disabled but kept,
   and `chatModelId`, `inlineEdit.modelId`, and `imageAnalysis.modelId` move to
   `gemini-3.1-pro-preview`. **No Plan entries are inserted.** A static Plan
   entry would pre-empt the runtime sync, whose exists-check is by vendor id.
3. **OpenAI Plan discovery.** `OpenAICodexProvider.listPlanModels` reuses the
   chat path's token refresh and single 401 retry. `syncOpenAIPlanModels` runs
   once after layout-ready on every launch; failures are silent. It also runs
   from the new "모델 목록 새로 고침" button on the OpenAI Plan card. Only
   `visibility: "list"` models are added, enabled, with the backend's default
   effort. Existing entries are never modified, so the shipped-disabled
   `gpt-6-astra (plan)` stays disabled until the user enables it.
   `CODEX_CATALOG_CLIENT_VERSION` is 0.159.2.
4. **GPT-6 reasoning.** The quick reasoning control covers
   `gpt-6(.N)-<name>` Plan models, without `none`. Internal RAG calls use `low`
   for them, their cheapest level.
5. **API-key discovery.** Settings → Models → "새 모델 확인" lists chat-capable
   models the user's keys can reach but the picker lacks. Nothing is added
   without a tick. Gemini keys go in `x-goog-api-key`, never the URL.
6. **Catalog watch.** `.github/workflows/model-catalog-watch.yml` runs every
   6 hours. It maintains one `model-catalog` issue: it comments only when the
   findings fingerprint changes and closes the issue when drift clears. It
   also flags Codex facts that runtime sync cannot fix: an outdated client
   version, unrecognized GPT slugs, and new reasoning levels. It never edits
   code. Deliberate omissions go in `scripts/model-catalog-ignore.json`.

## Test And Release Gates

- Done: `type:check`, `lint:check` (0 errors), `jest` 120 suites / 798 tests,
  `build` within bundle budget, `node scripts/model-catalog-watch.mjs --dry-run`
  against live OpenAI and Gemini lists.
- Pending before release:
  - With OpenAI Plan connected, launch Obsidian and confirm the Notice lists
    the added models.
  - Send one chat turn on `gpt-6.1-sol (plan)`.
  - Switch its effort through the composer control.
  - Enable `gpt-6-astra (plan)` and send one turn. This closes R-030's
    partial verification if it succeeds.
  - Run "새 모델 확인" with an Anthropic key.
  - Add the `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `GEMINI_API_KEY`
    repository secrets, then run the workflow once by hand.

## Known Unknowns

- `ultra` (Astra/Sol) is not in `GPT_5_6_EFFORTS` or the settings schema.
  Supporting it needs a schema change and a live request; the watch reports it.
- The backend might gate `/responses` by client version independently of
  `/models`. If a discovered model fails at send time, check this first.
- `gemini-omni-*` models appeared on the Gemini API list; their chat
  suitability was not investigated. The watch keeps reporting them until
  someone decides.
- `00-research-register.md` has no rows for R-032–R-043, although those IDs
  are used in source comments. That backlog was not repaired here.

## Security And Privacy

The research used API keys already present in the local environment only for
free model-list calls; no key, token, account identifier, or response header was
printed or recorded. The runtime code sends credentials only in headers, and the
HTTP error surfaced to Notices contains the status code only.

## Change Log

- 2026-09-30: Initial report and implementation.
- 2026-10-12: E-07 verified live by R-045 (the `/models` call succeeds at
  `client_version=0.162.1`). `CODEX_CATALOG_CLIENT_VERSION` bumped to 0.162.1.
  Claude Haiku 5.5 (released 2026-10-07) supersedes the Executive Summary's
  `claude-haiku-4-5` as the current Haiku; the catalog and the 31 → 32
  migration now carry `claude-haiku-5.5`. See R-045.
