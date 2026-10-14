# R-051: Integrating PR #41 after 1.3.0, and the release preflight

## Status

- Evidence status: **Partially verified**. Merge, tests, build, the
  community-review gate, a live Claude Plan session check, and an offline
  migration run on a real vault are done. A live Team/Enterprise account and a
  live Eagle 1.8.4 upload are pending.
- Planning use: **Mandatory for 1.4.0 release review**; read with R-044, R-045,
  R-046, R-049, and R-050.
- Investigation date: 2026-10-14
- Repository baseline: `main` at `66b9c59` (1.3.0, settings schema 32); branch
  `integration/1.4.0`
- Target release: 1.4.0 (maintainer review before merge and tag)

## Executive Summary

1.3.0 was released while contributor laguna821's integration PR #41 was open.
PR #41 carried three independent changes: Claude Team/Enterprise opt-in
(`2d3ee86`, issue #38), an October model catalog refresh (`df6c3b4`, issue
#39), and an Eagle 1.8+ cloud compatibility fix (`0184e6d`). Two of them
collided with 1.3.0 on research IDs: both sides used R-044 and R-045 for
different reports. Both also added a settings migration 31 → 32 with different
content.

All three are integrated on top of 1.3.0:

- The shipped R-044/R-045 keep their numbers. The contributor reports become
  R-049 (organization login) and R-050 (model catalog). R-047 is used outside
  the repository and is skipped.
- The contributor migration runs as 32 → 33.
- Where the two catalog refreshes disagreed, the Codex catalog decides for Plan
  requests.
- The organization opt-in gained one stricter rule from review.

A release preflight script now fails on open PRs, unmerged remote branches, and
research ID collisions, so the 1.3.0 situation is caught before tagging.

## Integration Decisions

| Area | 1.3.0 (ours) | PR #41 (theirs) | Integrated |
| --- | --- | --- | --- |
| Settings migration | 31 → 32 (R-044), shipped | 31 → 32 (R-045 there) | Ours unchanged; theirs is `32_to_33.ts`, id-keyed and idempotent on 32 data |
| GPT Plan efforts | Regex: GPT-6 without `none`, internal `low` | Per-model table; gpt-6-sol/luna allowed `none`, internal `none` | Table kept. GPT-6 follows the Codex catalog: no `none` for any GPT-6 model, internal `low`. GPT-5.6 keeps `none` (shipped since July). |
| Unknown GPT slugs from runtime sync | Regex fallback | Passed through without controls | Table lookup returns GPT-6 or GPT-5.6 family defaults |
| Default catalog | Opus/Sonnet/Haiku 5.5 API, GPT-6.1 Sol, Gemini 3.8 Flash | Pinned Claude Plan 5.5/Fable entries, GPT-6 Plan entries, retired-model successors | Union. Duplicate ids removed (their thinking-enabled API entries kept); prices merged |
| Antigravity catalog | Accepted Claude/GPT-OSS rows | Gemini rows only | Theirs. Existing Gemini Plan entries for Claude models still run (the provider checks only the provider type); sync no longer adds new ones. **Maintainer decision flagged.** |
| Managed settings + org opt-in | n/a | Opted-in organization passes even if inspection failed | Inspection failure blocks every login, as R-027 requires |

### Fact check: GPT reasoning levels (source of truth for Plan)

`openai/codex` `codex-rs/models-manager/models.json` (fetched 2026-10-14):

- `max`: every GPT-6 and GPT-5.6 model.
- `ultra`: Astra, 6.1 Sol, 6 Sol, 5.6 Sol, and 5.6 Terra.
- `none`: no model.

PR #41's table followed the API model pages, where some models accept `none`.
Plan requests go through the Codex backend, so the Codex catalog decides. R-044
E-08 (no `none` for GPT-6) is confirmed. `ultra` remains unsupported in the
schema (R-044 Known Unknowns).

## Verification

- `tsc --noEmit`, `lint:check` (0 errors), and jest (130 suites, 941 tests) pass.
- `build` is within budget, and `tools/obsidian-review/check.mjs` reports no
  Error-tier findings.
- New tests cover:
  - `32_to_33` on schema-32 input;
  - managed-settings inspection failure with an opted-in organization (4 cases);
  - the GPT-6 family fallback for an untabled slug;
  - runtime sync of an untabled model.
- **Live Claude Plan session (personal subscription, 2026-10-14):** a minimal
  `claude -p` run with the plugin's stripped environment emitted `system/init`
  with `apiKeySource: "none"` and `model: claude-haiku-5-5`. The new init guard
  therefore does not block Pro/Max. This also closes R-045's E-10: the `haiku`
  alias resolves to Haiku 5.5.
- **Offline migration on the maintainer's real settings copy:**
  - Removed: 10 entries, all disabled or retired.
  - Added: pinned Claude Plan Opus 5.5, Sonnet 5.5, and Fable 5.1 (enabled);
    API entries (Claude Opus/Sonnet 5, GPT-6 Sol, DeepSeek Flash/V4 Pro,
    Grok 4.7/4.3).
  - Selections unchanged: chat `gpt-6.1-sol (plan)` and image
    `gpt-5.6-sol (plan)`.

## Pending Before Release

- Maintainer review of the flagged decisions: Antigravity Claude rows, pinned
  Claude Plan entries enabled by default, and version 1.4.0 versus 1.3.1.
- Live Team/Enterprise account on macOS and Windows: Ready after opt-in, one
  request, and revocation (R-049 E-09).
- Live Eagle 1.8.4 install: inline auto-upload, the chat CMDS R2 button, and
  local image kept on failure (R-046).
- Hosted CI on the release PR.
- Close or supersede PR #41 with a note to the contributor.

## Release Preflight (process change)

`scripts/release-preflight.mjs` (`npm run release:preflight`) is step 0 of the
release procedure in `docs/obsidian-community-review.md`. It exits non-zero on:

1. open pull requests against `main`;
2. remote branches with commits `main` lacks;
3. a research ID claimed by different report files on any branch.

`--ack <PR | branch | R-###>` records a deliberate exclusion. Run against
1.3.0's state, it reports PR #41 and the R-044/R-045 collisions. The global
`obsidian-plugin-dev` skill gained the same check for other plugins.

A git `index.lock` was left behind twice in this repository (2026-10-12 and
2026-10-14), with no git process running. The source is not identified. A
background git status poller is the likely candidate.

## Security And Privacy

No credentials, account identifiers, or vault text are recorded. The live
Claude check printed only the `apiKeySource`, `model`, and MCP server count
fields of the init event. The migration dry run printed model ids only.

## Change Log

- 2026-10-14: Initial report.
