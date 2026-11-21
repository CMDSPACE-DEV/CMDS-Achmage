# R-068: Gemini Plan model catalog sync and Gemini 4 slugs

## Status

- Evidence status: **Partially verified**; source and automated checks, real app checks pending
- Planning use: Mandatory for this scoped change
- Investigation date: 2026-11-21
- Repository baseline: CMDS Achmage 1.3.2, main `0cd76553c2faddeba1ac7d9e791a387cccf4073c`
- Target release: not selected; no version bump in this PR

## Executive Summary

The current parser accepts Gemini 4 ids, but id-first CLI rows lose their display labels and progress/partner rows can enter the Gemini catalog. Runtime models are merged only when Plan settings is opened/diagnosed; startup sync handles only OpenAI. Add a startup Gemini sync and make its existing manual diagnostic action explicitly refresh the model list. The exact cause of the reporting device's stale model list remains unverified.

## Research Question

What minimal independent change fixes this reported behavior while preserving user settings?

## Sources Inspected

- Exact prior research revision: `research:rr-8dedb26a6f3c58016589ef67e26ee1a7:b101ce28ca95b717770994e332fad0115f4932f49ad82ca52039b4b613914811`.
- Repository native runtime service, Plan settings, startup hooks and model-sync tests.
- [Antigravity headless model listing](https://antigravity.google/docs/cli/headless/), [model availability](https://antigravity.google/docs/models), accessed 2026-11-21.
- R-023/R-024/R-025 for native runtime and cancellation boundaries; R-030/R-044/R-045 for catalogs.
- Parser subset adapted from #43 at `f5c1514f9d93f9e35fa1da39ede19ee191d99365`.

## Verified Findings And Evidence

- Official CLI documentation lists `gemini-4-neon-xhigh` and `gemini-4-carbon-high`; use runtime slugs rather than API base ids.
- Plan availability differs by account; Carbon is not promised on every plan.
- Focused parser/diagnosis/UI/sync and cancellation tests pass.
- The Gemini subset overlaps #43 and should replace those matching hunks when that integration PR merges.

## Decision And Implementation Contract

- Reuse the Gemini text parser approach from #43 (`f5c1514f9d93f9e35fa1da39ede19ee191d99365`): support id-first and older label-first rows, preserve effort suffixes and labels, skip progress and partner models.
- Exclude Orchestrator entries from new discovery: its multi-model agent behavior requires a separate integration. Existing stored entries are not changed.
- Extract the existing native-model merge helper, keeping existing user-disabled/custom models unchanged.
- Add Gemini startup synchronization against fresh settings after local diagnosis; unavailable/blocked runtimes do not change saved models.
- On plugin unload, abort startup diagnosis through the existing native-process AbortSignal contract. Pre-cancelled or cancelled-in-flight sync never saves new models.
- Rename the Gemini card's manual action to 모델 목록 새로 고침 and explain CLI updates when a model is absent.
- No hardcoded Neon/Carbon entitlement, provider installation, credential reads or auth-policy changes.

## Test And Release Gates

- Type check, full Jest, lint, production build/bundle budget, community review Error gate.
- Local Node 26.8.1: full Jest 138 suites / 930 tests passed; lint 0 errors / 18 existing warnings.
- Production build includes TypeScript validation; tokenizer parity, bundle budget, community Error gate and version parity passed (exact size in the PR body).
- Real authenticated CLI/model requests and target-vault rendering remain separate owner checks; CI uses Node 20.

## Known Unknowns And Deferred Decisions

Actual reporting-device agy version/catalog, account entitlement and a real Neon/Carbon request. This Linux task has no agy installation and does not launch Obsidian.

## Security And Privacy

No credentials, tokens, account identifiers, private vault text or screenshots were recorded. Plugin settings in the user's vault are not modified. No public release is created by this PR.

## Change Log

- 2026-11-21: Initial scoped implementation and regression evidence.
