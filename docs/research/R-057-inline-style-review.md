# R-057: Inline stylesheet community-review failure

## Status

- Evidence status: **Partially verified**
- Planning use: **Mandatory for inline stylesheet loading**
- Investigation date: 2026-10-18
- Repository baseline: 1.3.1, `6ff66ee67b016f7a4197d187264d80f537c10596`
- No release is published by this change.

## Executive Summary

The October 15 community scan reports one Error: a dynamically created style
element in InlineEditController.ts:247. Release attestations and byte-for-byte
build reproduction passed. Warnings are separate findings, not this fix's scope.

## Research Question

How can the inline UI use Obsidian's loaded stylesheet and avoid this regression?

## Sources Inspected

- Community dashboard: https://community.obsidian.md/account/plugins/cmds-achmage
- `src/core/inline/InlineEditController.ts`, `styles.css`
- `tools/obsidian-review/eslint.config.mjs`
- R-002, R-005 and R-030: existing input, appearance and isolation contracts.
- Local reviewer package eslint-plugin-obsidianmd 0.4.2.

## Evidence Ledger

| ID | Finding | Evidence class |
| --- | --- | --- |
| E-01 | Inline UI creates a style element inside a ShadowRoot | Verified: source |
| E-02 | Community scan rejects that element | Verified: authenticated dashboard |
| E-03 | The curated CI gate omits no-forbidden-elements | Verified: source |
| E-04 | Community themes may affect light-DOM controls | Known limitation; target-theme smoke pending |

## Decision And Implementation Contract

Move the widget into its editor's ownerDocument and move its CSS into styles.css.
Scope every rule to .smtcmp-inline-host, including media-query rules; namespace the
animation. Keep skin/accent/glow attributes and the body observer. Preserve
keyboard handling, preview approval, cancellation and stale-range protection.

This supersedes R-030's inline Shadow DOM implementation detail and R-005's
inline strong-isolation proposal for this surface only. The resulting skin is
hardened, not immune to arbitrary theme !important declarations. Theme following
remains the default. No claim of universal theme isolation is made.

Enable the reviewer's no-forbidden-elements rule in the existing error gate.
Do not rename the forbidden tag, suppress the rule, or inject CSS another way.

## Test And Release Gates

DOM tests cover preview actions, ownerDocument use, appearance observation and
observer cleanup. Run existing inline tests, type check, lint, build/bundle gates,
and the community error gate. Verify default/custom themes, Korean IME and a real
popout in Obsidian before release. A local pass is not a fresh community scan.

## Known Unknowns

## Local validation (2026-10-18)

- Full Jest: 137 suites / 915 tests passed, including three new DOM cases.
- TypeScript: passed. Formatting/ESLint: passed, 18 existing warnings.
- Community Error rules: passed through the review tooling's ESLint binary
  with tools/obsidian-review/eslint.config.mjs (Windows).
- Production build: 4,877,131 / 4,940,000 bytes; tokenizer compiled checks passed.
- The initial jsdom run could not initialize LangChain's Node-only tracing
  dependency (TextEncoder missing). The fixture now mocks the unused retrieval
  splitter; the widget and DOM behavior remain real. The subsequent focused and
  complete suites passed.
- Runtime research context: research:rr-16f152ba8f11b353667cfcf90a0c8bba:47af6cc299e00b5fbf66e072f8604b376ebe8d459c6625d955ced6cfdf00c70b.

## Remaining release checks

Live Obsidian visual parity and the next published-release scan remain pending.

## Security And Privacy

No credentials, account identifiers or private vault contents are recorded.

## Change Log

- 2026-10-18: Initial report.
- 2026-10-26: The pending live check for E-04 found that Obsidian's own
  `app.css` `.prompt` rule, not a theme, floated the inline instruction input
  (issue #112). The class is renamed; see R-064.
