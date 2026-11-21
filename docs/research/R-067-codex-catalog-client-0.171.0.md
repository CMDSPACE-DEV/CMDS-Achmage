# R-067: Codex catalog client 0.171.0 and GPT-6.2 visibility

## Status

- Evidence status: **Partially verified**; source and automated checks, real app checks pending
- Planning use: Mandatory for this scoped change
- Investigation date: 2026-11-21
- Repository baseline: CMDS Achmage 1.3.2, main `0cd76553c2faddeba1ac7d9e791a387cccf4073c`
- Target release: not selected; no version bump in this PR

## Executive Summary

The current main client reports 0.162.1; PR #111 previously proposed 0.164.0. GPT-6.2 Sol and Astra require 0.166.0 in the current Codex catalog. Raise the reported version to released 0.171.0 so the account catalog can return those models. This supersedes R-063's version choice and its time-specific claim that no model needs more than 0.155.0; R-063 remains intact as historical evidence.

## Research Question

What minimal independent change fixes this reported behavior while preserving user settings?

## Sources Inspected

- Exact prior research revision: `research:rr-f8b53d4c2f3d07991ad806f68fcb8435:2f69f492108f1943334d444f3645fd444ab7b64ea0323c45feb4d6a1b4d0acc1`.
- Repository discovery/sync code and tests, R-030/R-044/R-045/R-063.
- [OpenAI models](https://learn.chatgpt.com/docs/models), [Codex 0.171.0 release](https://github.com/openai/codex/releases/tag/rust-v0.171.0), and tagged `codex-rs/models-manager/models.json`, accessed 2026-11-21.

## Verified Findings And Evidence

- Official release rust-v0.171.0, published 2026-11-20, prerelease=false.
- Tagged models.json blob `56e0f43cb66259e3b8d5a59d8ff12f41e1c8be06`: GPT-6.2 Sol/Astra minimal_client_version=0.166.0; Terra=0.153.0.
- Focused discovery/sync tests: 18 passed.
- Live public catalog watch dry-run no longer reports outdated client or hidden-by-version models; deliberately unsupported `ultra` remains.
- Initial shallow-history merge was refused. Fetching full ancestry and configuring the authenticated user's repository-local noreply identity enabled a normal merge; both research-register rows were preserved.

## Decision And Implementation Contract

- Change `CODEX_CATALOG_CLIENT_VERSION` to 0.171.0.
- Add a version-gated catalog sync fixture covering GPT-6.2 Sol/Astra and existing disabled Terra customization, default efforts, selected-model preservation and idempotency.
- Preserve #111's original commit and merge current main without rewriting history.
- No static Plan model entries, schema changes, `ultra`, API model refresh or image capability changes.

## Test And Release Gates

- Type check, full Jest, lint, production build/bundle budget, community review Error gate.
- Local Node 26.8.1: type check passed; full Jest 137 suites / 917 tests passed; lint 0 errors / 18 existing warnings.
- Production bundle 4,877,060 / 4,940,000 bytes; tokenizer, community Error gate and version parity passed.
- Public catalog dry-run reports neither outdated client nor version-hidden models; ultra remains deliberately deferred.
- Actual authenticated catalog and response requests remain separate owner checks; CI uses Node 20.

## Known Unknowns And Deferred Decisions

An authenticated account /models request and actual GPT-6.2 plugin response. A synced saved Terra entry is enabled, so its reported UI absence is not independently reproduced.

## Security And Privacy

No credentials, tokens, account identifiers, private vault text or screenshots were recorded. Plugin settings in the user's vault are not modified. No public release is created by this PR.

## Change Log

- 2026-11-21: Initial scoped implementation and regression evidence.
