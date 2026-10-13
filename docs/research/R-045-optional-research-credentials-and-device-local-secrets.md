# R-045: Optional research credentials, device-local secrets, and the 2026-10-12 Plan lineup check

## Status

- Evidence status: **Verified** for the research-connection findings and fix;
  **Partially verified** for the model items (no Anthropic key on the machine)
- Planning use: **Mandatory for Research Connections credential handling**
  (alongside R-017); read with R-044 for model catalog work
- Investigation date: 2026-10-12
- Repository baseline: branch `feat/model-catalog-sync` on `main` at
  `d7eba16` (1.2.0 line), uncommitted R-044 work present; settings schema 32
- Target release: none set

## Executive Summary

On the maintainer's MacBook Pro, Korean Law MCP failed with "missing the stored
oc credential", and three more enabled research sources (OpenAlex, NAVER,
ScienceON) failed their connection tests. All four had one cause. `data.json`
syncs which sources are enabled, but Obsidian SecretStorage is per device, so
this device had settings without keys. R-017 §15.4 documents that split.

Two of the four failures were plugin defects. The Korean Law preset and OpenAlex
required a credential that their providers treat as optional:

- The Korean Law MCP public server (`korean-law` 4.15.7) answers tool calls
  without an OC from a shared operator key with a global token-bucket quota.
  Your own OC skips that quota.
- OpenAlex documents keyless use ("basic queries with no key at all"); a free
  key raises the daily budget 10x.

Both credentials are now optional. NAVER and ScienceON do need user credentials
and stay required; they need re-entry on this device.

The model check found the OpenAI Plan account catalog unchanged. Claude Haiku
5.5 was released (2026-10-07), Codex 0.162.1 was released, and Antigravity no
longer offers two models that the user's settings still enabled.

## Research Question

1. Why did Korean Law MCP and other research harnesses fail on this device?
2. Which credential requirements are imposed by providers, and which only by
   the plugin?
3. What is the current Plan model lineup per runtime as of 2026-10-12?

### In scope

- Korean Law MCP preset, OpenAlex, and the generic MCP secret-query path.
- Live status of every enabled research source.
- Plan model lineup and the Codex catalog client version.

### Out of scope

- NAVER and ScienceON credential re-entry (requires the user's own keys).
- GPT-6 Plan native image generation and the `ultra` reasoning level.

## Baseline And Reproducibility

- macOS (Darwin 27.2), Obsidian with the plugin folder symlinked to the repo.
- Claude Code 2.1.296, `agy` 1.3.3, local `codex-cli` 0.153.4.
- Live checks ran through `obsidian eval` against the loaded plugin:
  `ResearchManager.testConnection` per enabled source,
  `McpManager.scanConnection('research-korean-law')`, and one
  `search_law` call.

## Sources Inspected

### Repository source

- `src/core/mcp/mcpManager.ts` (`connectConnection`, secret query loop)
- `src/core/research/ResearchSourceRegistry.ts`,
  `src/core/research/ResearchManager.ts` (`isConfigured`, `selectSourceIds`),
  `src/core/research/ResearchAdapters.ts` (`searchOpenAlex`),
  `src/core/research/ResearchSecretStore.ts`
- `src/core/image/resolve-image-model.ts`,
  `src/core/llm/providerCapabilities.ts`

### First-party external sources (accessed 2026-10-12)

- chrisryugj/korean-law-mcp `v4.15.7`: `README.md` (v4.9.7 shared-key quota
  notes) and `src/server/http-server.ts` (key from `apikey`/`law_oc`/`law-oc`/
  `x-api-key`/`x-law-oc` headers or the `oc` query; keyless calls use the
  server `LAW_OC` behind a token bucket and daily cap).
- `https://mcp.gomdori.app/` service descriptor: version 4.15.7, stateless
  streamable HTTP.
- [OpenAlex rate limits and authentication](https://help.openalex.org/how-to-use-the-api/rate-limits-and-authentication)
  (last updated 2026-08-19).
- [Claude models overview](https://platform.claude.com/docs/en/models/overview)
  and [Claude Haiku 5.5](https://platform.claude.com/docs/en/models/haiku-5-5/overview).
- openai/codex latest release `rust-v0.162.1` (2026-10-09).

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | The Korean Law failure was a missing device-local secret, not a server fault | Verified: live | Server state `error: missing the stored oc credential`; `secretStorage.listSecrets()` held only the WoS and KCI research keys; `/health` 200 | High |
| E-02 | The public Korean Law server answers tool calls without an OC | Verified: live + source | `tools/call search_law` with no `oc` returned statutes; `http-server.ts` fallback gate | High |
| E-03 | Keyless Korean Law calls share a global quota and may return 429 with `Retry-After` | Verified: source | README v4.9.7; `http-server.ts` `fallbackAllowed` | High |
| E-04 | OpenAlex works without a key; a free key gives 10x budget | Verified: official docs + live | Help page; keyless `/works` returned 200 | High |
| E-05 | Auto routing already skips unconfigured sources | Verified: source | `selectSourceIds` filters on `isConfigured` | High |
| E-06 | NAVER and ScienceON genuinely need user credentials | Verified: source + R-017/R-018 | Registry secret fields; provider contracts | High |
| E-07 | The ChatGPT-account `/models` call succeeds at `client_version=0.162.1` and lists no model beyond the 8 already present | Verified: live | `syncPlanModelsInBackground` ran with no warning, no models added | High |
| E-08 | Claude Haiku 5.5 is current; prompts up to 100k tokens bill $0.10/$0.50 per MTok, longer ones $0.50/$2.50 | Verified: official docs | Haiku 5.5 page | High |
| E-09 | `agy` 1.3.3 no longer lists `claude-sonnet-4-6` or `claude-opus-4-6-thinking` | Verified: live | `agy models` output | High |
| E-10 | Claude Plan aliases `opus`/`sonnet`/`haiku`/`fable` resolve to the 5.5/5.1 lineup | Inference | Alias contract (R-024, R-044 E-10) plus current docs; no Plan turn was sent | Medium-high |
| E-11 | GPT-6 Plan models can run native image generation | Not verified | Capability allowlist is GPT-5.6 only | Not applicable |

## Verified Findings

### 1. The split between synced settings and device-local secrets surfaces as broken sources

`data.json` carried `enabled: true` for 10 sources and a Korean Law MCP
connection whose transport points at the SecretStorage id
`smart-composer-research-korean-law-oc`. This device's SecretStorage held only
the WoS and KCI keys. Live tests: WoS, Crossref, KCI, RISS, PubMed, and Europe
PMC passed. Korean Law, OpenAlex, NAVER, and ScienceON failed with "Required
credentials or options are missing".

### 2. Two required credentials are provider-optional

R-017 §4.2 states "공식 API에서 `OC`는 필수 인증값이다". That remains true for
law.go.kr itself. It does not apply to the gomdori-hosted MCP server, which has
a shared fallback key. R-017 §7.3 required an OpenAlex key. OpenAlex no longer
requires one.

## Decision And Implementation

1. **Korean Law OC is optional.** The registry field is `required: false`.
   `isOptionalPresetSecretQueryParam(connectionId, param)` reports
   optionality only for a curated preset connection id. A user-made connection
   with the same URL stays strict. `main.ts` injects the predicate when it lazily
   creates `McpManager`. When the secret is absent, the loop skips the `oc`
   query parameter instead of throwing. No schema change or migration: the
   existing `research-korean-law` connection works as stored. A stored OC is
   still sent.
2. **OpenAlex key is optional.** `searchOpenAlex` sends `api_key` only when one
   is stored (the PubMed pattern). The field label says "Optional".
3. **NAVER and ScienceON are unchanged.** Their keys must be re-entered on each
   device.
4. **Models (code).** `CODEX_CATALOG_CLIENT_VERSION` 0.159.2 → 0.162.1.
   Fresh installs list `claude-haiku-5.5` in place of `claude-haiku-4.5`. The
   unreleased 31 → 32 migration inserts it if absent. Haiku 5.5 is priced at the
   base tier.
5. **Models (this user's settings, applied live with a backup).** Dead
   Antigravity entries are disabled. On the user's choice, superseded Plan
   entries are disabled: `gpt-6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`,
   `gpt-5.5`, the pinned `claude-sonnet-5`, and Gemini 3.6/3.7 Flash. Nothing
   was deleted. `gpt-5.6-sol (plan)` stays enabled as the image model (E-11).
6. **Keyless badge.** `describeKeylessMode` decides what a research card shows
   when a source with an optional credential has none stored. A borrowed
   third-party key (Korean Law) gets a warning, "Shared quota", because other
   keyless users can exhaust it. A provider's own keyless budget (OpenAlex,
   PubMed) gets an informational "Keyless". The badge sits on the collapsed
   card, with one sentence in the expanded card.

## Test And Release Gates

- Done: `type:check`, `lint:check` (0 errors), `jest` 122 suites / 812 tests
  (new: `mcpManager.secretQuery.test.ts`, `keylessNotice.test.ts`, OpenAlex
  keyless/keyed cases), `build` within budget, community-review Error gate. Live: Korean Law `scanConnection` → connected with 10 tools,
  `search_law` → success. OpenAlex `testConnection` → OK without a key.
- Pending: a chat turn on Claude Plan `haiku` confirming Haiku 5.5. A Korean Law
  call under 429 pressure, confirming the chat surfaces the operator's
  `Retry-After` message.

## Known Unknowns

- Whether GPT-6 Plan models support native image generation (R-001 path).
- `ultra` reasoning (R-044) remains unsupported.

## Security And Privacy

No OC, API key, OAuth token, or account identifier is recorded here. Live
probes used no credential; plugin-side checks read secret presence and length
only. The pre-change settings backup sits in the session scratchpad with mode
600 and was not committed.

## Change Log

- 2026-10-12: Initial report and implementation.
- 2026-10-14: Keyless badge (decision 6); shipped in 1.3.0.
