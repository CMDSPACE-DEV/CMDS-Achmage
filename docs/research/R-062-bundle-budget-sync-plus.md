# R-062: main.js budget moves from Sync Standard to Sync Plus

## Status

- Evidence status: **Verified** (owner decision; current first-party Sync limits)
- Planning use: **Mandatory for bundle budget changes**
- Investigation date: 2026-10-20
- Repository baseline: `main` 2b3e61875bb9aa5885f801e33207481a7f6147a7 (1.3.2)
- Target release: next release containing Pele

## Executive Summary

The owner decided (2026-10-20) that CMDS Achmage targets Obsidian Sync Plus
(200 MB per file) instead of Sync Standard (5 MB per file). Splitting features
into several plugins to stay under 5 MB was rejected as harder to develop and
to use. `scripts/check-bundle-budget.mjs` now fails above **8,000,000 bytes**.
8 MB is not a Sync limit; it is a guard that catches an accidentally bundled
large dependency while leaving room above the measured 1.3.3 size.

This supersedes the 4,940,000-byte ceiling and the "do not raise the ceiling"
rules in R-055 and R-059. Their measurements remain historically correct.

## Verified Findings

- Obsidian Sync file limits: Standard 5 MB, Plus 200 MB
  (https://obsidian.md/help/sync/plans, checked 2026-10-20).
- Pele integration (#65–#101) measured `main.js` at 5,615,110 bytes on
  the combined Pele PR (#101). Almost all of the excess over 5 MB is the Pele renderer;
  the 32 editor adapters add about 40 KB (#65 vs #101 measurements).
- The community review reports `main.js` above 5 MB as a warning, not as an
  Error-tier finding that fails the gate (docs/obsidian-community-review.md).

## Consequences

- Sync Standard users cannot sync this plugin's `main.js`. Release notes state
  this from 1.3.3.
- The tokenizer and desktop-fetch guards in the same script are unchanged.
- Raising the 8 MB guard needs a new owner decision recorded in a new report.

## Unverified / Pending

- Sync Plus behaviour with a 5.6 MB plugin file on a real device.
