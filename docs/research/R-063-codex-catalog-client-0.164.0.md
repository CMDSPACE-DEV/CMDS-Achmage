# R-063: Codex catalog client version 0.164.0 and the deferred `ultra` effort

## Status

- Evidence status: **Partially verified**
- Planning use: **Optional**; read with R-044 and R-045 for Plan model discovery
- Investigation date: 2026-10-26
- Repository baseline: `main` at `2b3e618` (1.3.2)
- Target release, if any: none chosen; the PR does not change the version

## Executive Summary

The scheduled catalog watch (issue #44, run 2026-10-26) reported two findings.

1. **Codex 0.164.0 is released, and `CODEX_CATALOG_CLIENT_VERSION` is 0.162.1.**
   Verified. This change sets the constant to 0.164.0. No model in the current
   catalog needs a client newer than 0.155.0, so the bump changes nothing that a
   user sees today. It keeps models that a future catalog gates at 0.163–0.164
   from being hidden.
2. **`ultra` is a reasoning level not in `GPT_5_6_EFFORTS`.** This is not new.
   `ultra` was already in the 0.162.1 catalog, and R-044 and R-045 deferred it
   on purpose. This report does not implement it. It records what supporting it
   would involve.

The live ChatGPT-account `/models` call at `client_version=0.164.0` has not
been made.

## Research Question

Can `CODEX_CATALOG_CLIENT_VERSION` move to 0.164.0 safely, and is the `ultra`
finding a drift that a constant change fixes?

### In scope

- The Codex release and the catalog that ships with it.
- Per-model `minimal_client_version` and `supported_reasoning_levels`.

### Out of scope

- Implementing `ultra` (schema change, composer control, live request).
- Plan authentication, onboarding, and updater work. R-023–R-029 are unchanged.

## Baseline And Reproducibility

- `src/core/llm/modelDiscovery.ts:41` sends the constant as the `client_version`
  query parameter to `https://chatgpt.com/backend-api/codex/models`.
- `scripts/model-catalog-watch.mjs` compares the constant with the latest
  openai/codex release, and compares `GPT_5_6_EFFORTS` with the levels in
  `codex-rs/models-manager/models.json` on the `main` branch.
- Reproduce: download `models.json` at the tags `rust-v0.162.1` and
  `rust-v0.164.0` and at `main`, then list each model's
  `minimal_client_version` and `supported_reasoning_levels`.

## Sources Inspected

### Repository source

- `src/core/llm/modelDiscovery.ts:36-50`
- `src/types/chat-model.types.ts:5-12` (`GPT_5_6_EFFORTS`)
- `scripts/model-catalog-watch.mjs:175-198`
- `docs/research/R-044-model-catalog-refresh-and-discovery.md` (Out of scope,
  Known Unknowns)
- `docs/research/R-045-optional-research-credentials-and-device-local-secrets.md`
  (E-07, Out of scope)

### First-party external sources

- [openai/codex release rust-v0.164.0](https://github.com/openai/codex/releases/tag/rust-v0.164.0)
  — published 2026-10-23, not a prerelease; accessed 2026-10-26
- `codex-rs/models-manager/models.json` at `rust-v0.162.1`, `rust-v0.164.0`
  (`fe3b294`), and `main` — accessed 2026-10-26

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | 0.164.0 is the latest stable Codex release | Verified: source | GitHub releases API: `rust-v0.164.0`, 2026-10-23, `prerelease=false`; newer tags are alphas | High |
| E-02 | No catalog model needs a client newer than 0.155.0 | Verified: source | `minimal_client_version` is at most 0.155.0 (`gpt-6-sol`, `gpt-6-luna`) at `rust-v0.164.0` and `main` | High |
| E-03 | The 0.164.0 catalog lists the same eight visible models as the watch | Verified: source | `visibility: list`: gpt-6-astra, gpt-6.1-sol, gpt-6-sol, gpt-6-luna, gpt-5.6-sol, gpt-5.6-terra, gpt-5.6-luna, gpt-5.5 | High |
| E-04 | `ultra` already existed in 0.162.1 | Verified: source | `rust-v0.162.1` `models.json`: Astra, Sol, and Terra list `ultra` | High |
| E-05 | Codex describes `ultra` as "Maximum reasoning with automatic task delegation" | Verified: source | `supported_reasoning_levels[].description` at `rust-v0.164.0` | High |
| E-06 | The ChatGPT backend accepts `client_version=0.164.0` and returns the same list | Not verified | Needs the plugin's background sync with a signed-in OpenAI Plan, as R-045 E-07 did for 0.162.1 | Not applicable |

## Verified Findings

### 1. The bump is safe for today's catalog

The backend hides a model whose `minimal_client_version` is newer than the
reported version (R-030, R-044). Every model is at 0.155.0 or lower (E-02), so
0.162.1 and 0.164.0 return the same list. Raising the constant to the newest
release follows the rule in the `modelDiscovery.ts` comment and clears the
watch's version finding.

### 2. `ultra` is a deferred feature, not drift

R-044 lists `ultra` under Out of scope and Known Unknowns: it "needs a schema
change and a live request". R-045 kept it out of scope. The watch keeps
reporting it because `GPT_5_6_EFFORTS` lacks it, and adding a constant would
not be enough. The description in E-05 says that `ultra` delegates tasks
automatically, which may interact with the plugin's tool isolation (R-023).

## Inferences Requiring Validation

- The backend's `/models` response matches `models.json` at the release tag.
  R-044 verified that the CLI and the backend share the catalog format, not that
  every release matches the backend. Validate with E-06.

## Decision And Implementation Contract

- `CODEX_CATALOG_CLIENT_VERSION` becomes `'0.164.0'`. No other source changes.
- `ultra` stays unsupported until the owner decides to expose it.

## Expected Change Surface

- `src/core/llm/modelDiscovery.ts` (one constant).
- No schema, migration, bundle, or platform change.

## Test And Release Gates

- Existing `modelDiscovery` unit tests, type check, lint, and build.
- Owner check before release: with OpenAI Plan signed in, let the background
  model sync run once and confirm that no warning appears and the list is
  unchanged (E-06).

## Known Unknowns And Deferred Decisions

1. Whether to support `ultra`. Supporting it needs: an entry in the effort type
   and the settings schema with a migration, a per-model capability check
   (Luna and GPT-5.5 do not offer it), a decision on how automatic delegation
   fits tool isolation, and one live turn.
2. Issue #44 stays open while `ultra` is undecided, because the watch keeps
   reporting it.

## Security And Privacy

No credentials, tokens, account identifiers, private vault content, or other
secrets were recorded. Only public openai/codex sources were read.

## Change Log

- 2026-10-26: Initial report.
