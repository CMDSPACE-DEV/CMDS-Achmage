# R-066: Style Settings YAML manifest parsing

## Status

- Evidence status: **Partially verified**; source and automated checks, real app checks pending
- Planning use: Mandatory for this scoped change
- Investigation date: 2026-11-21
- Repository baseline: CMDS Achmage 1.3.2, main `0cd76553c2faddeba1ac7d9e791a387cccf4073c`
- Target release: not selected; no version bump in this PR

## Executive Summary

The CMDS Achmage 1.3.2 `@settings` description contains `itself: the` in an unquoted YAML scalar. Style Settings 1.0.9 reports a YAMLException and cannot show any CMDS Achmage controls. A folded `>-` scalar preserves the complete description and fixes the document syntax.

## Research Question

What minimal independent change fixes this reported behavior while preserving user settings?

## Sources Inspected

- Exact prior research revision: `research:rr-3acfda033986c5a41c21e2a806a6f4aa:4f1d8e19aae46b22166e4efa82b654d784394028cc1b280205ad8f645253c93a`.
- Repository `styles.css`, installed 1.3.2 stylesheet, Style Settings 1.0.9 parser bundle, and `src/utils/styleSettingsManifest.test.ts`.
- R-030 for the appearance/Style Settings contract.

## Verified Findings And Evidence

- Installed 1.3.2 stylesheet and repository `styles.css` manifest bytes are identical.
- Original YAML fails parsing; folded scalar parses all 11 items and preserves the text.
- Focused stylesheet manifest Jest test passes.
- Initial formatting warnings were corrected with Prettier.

## Decision And Implementation Contract

- `styles.css`: serialize the first description as a folded scalar; leave CSS rules and settings ids/defaults unchanged.
- `src/utils/styleSettingsManifest.test.ts`: extract every manifest block, parse with js-yaml 4, check control availability and description content.
- Declare the already locked js-yaml 4.3.2 as a direct development dependency; it is not imported into the plugin bundle.

## Test And Release Gates

- Type check, full Jest, lint, production build/bundle budget, community review Error gate.
- Local Node 26.8.1: type check passed; full Jest 138 suites / 917 tests passed; lint 0 errors / 18 existing warnings.
- Production bundle 4,877,060 / 4,940,000 bytes; tokenizer parity and community Error gate passed.
- Original manifest reproduced the exact js-yaml `YAMLException: bad indentation of a mapping entry`; the regression test passes on the corrected manifest.
- Actual Obsidian rendering remains a separate owner check; CI uses Node 20.

## Known Unknowns And Deferred Decisions

Style Settings rendering after reloading the fixed build in a real Obsidian vault.

## Security And Privacy

No credentials, tokens, account identifiers, private vault text or screenshots were recorded. Plugin settings in the user's vault are not modified. No public release is created by this PR.

## Change Log

- 2026-11-21: Initial scoped implementation and regression evidence.
