# R-064: Inline edit input collides with Obsidian's global `.prompt` class

## Status

- Evidence status: **Partially verified**; cause and fix verified in a live
  vault, default-theme and popout-window checks pending
- Planning use: **Mandatory for inline edit class names and light-DOM styling**;
  read with R-057
- Investigation date: 2026-10-26
- Repository baseline: `main` at `2b3e618` (1.3.2)
- Target release, if any: none chosen; the PR does not change the version

## Executive Summary

Since 1.3.2 the inline edit instruction input floats out of its panel and
overlaps the rows below it (issue #112). The input is a `textarea` with the
class `prompt`. Obsidian's `app.css` styles `.prompt` globally for its own
modals, including `position: absolute`, `top`, and `z-index: 1`. 1.3.2 (#64,
R-057) moved the inline UI out of its Shadow DOM, so that rule now reaches the
input. The plugin rule `.smtcmp-inline-host .prompt` overrides `display` and
height but not position.

The fix renames the class to `edit-instruction`, which `app.css` does not use,
and adds a DOM test that fails if the inline UI uses any of Obsidian's
`prompt` family classes. Obsidian 1.15.0 did not cause this: 1.13.6 has the
same rule.

## Research Question

Why does the inline instruction input lose its place in the panel, and which
inline UI class names collide with styles outside the plugin?

### In scope

- Computed styles and matching rules for the inline UI in a running vault.
- Every class name the inline UI assigns.

### Out of scope

- Element selectors such as `textarea` or `button` (the hardened rules already
  reset them; the screenshot showed no other breakage).
- Prefixing every inline class name.

## Baseline And Reproducibility

- Obsidian 1.15.0 (installer 1.13.6), macOS, a community theme with five CSS
  snippets enabled.
- Method: from `obsidian eval`, append a probe that copies the widget's
  structure (`.smtcmp-inline-host > section.panel > .prompt-surface >
  textarea`) to the active editor's `.cm-content`. Then read
  `getComputedStyle`, list every stylesheet rule that matches the textarea and
  sets a layout property, and remove the probe in the same task.
- A second probe gave each of the 52 inline class names (plus `primary`,
  `secondary`, `added`, `removed`, `before`, `after`) its own element. It
  listed rules from outside the plugin whose selector names that class and
  matches the element.
- `app.css` was extracted from the 1.13.6 installer asar and the 1.15.0 update
  asar with `@electron/asar` 3.2.17.

## Sources Inspected

### Repository source

- `src/core/inline/InlineEditController.ts:279-305` (input and prompt surface)
- `styles.css` rules under `.smtcmp-inline-host .prompt*`
- `src/core/inline/InlineEditWidget.test.ts`
- R-057 (E-04 and the pending live visual check), R-005 §14 and R-030 item 13
  (isolation history)

### First-party external sources

- Obsidian `app.css` shipped in the 1.13.6 installer and the 1.15.0 update,
  read locally on 2026-10-26

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | Before the fix, the input is `position: absolute` (`top` 183px, `z-index` 1) and the prompt surface is 10px high | Verified: live | First probe, plugin 1.3.2 | High |
| E-02 | Only two rules set layout on the input: `app.css` `.prompt` and the plugin's `.smtcmp-inline-host .prompt` | Verified: live | First probe rule list | High |
| E-03 | `.prompt` is the only inline class that a stylesheet outside the plugin targets; a theme rule sets one color variable on it | Verified: live | Second probe | High |
| E-04 | `app.css` has `.prompt { position: absolute }` in 1.13.6 (`top: 80px`) and 1.15.0 (`top` computed from `--prompt-max-height`) | Verified: source | Both asars | High |
| E-05 | `app.css` 1.15.0 has eight `prompt` family classes: `prompt`, `prompt-input`, `prompt-input-container`, `prompt-input-cta`, `prompt-instruction`, `prompt-instruction-command`, `prompt-instructions`, `prompt-results`; `edit-instruction` is absent | Verified: source | Class scan of the 1.15.0 asar | High |
| E-06 | After the fix, the input is static, 72px high, and the surface is 82px; only the plugin rule applies | Verified: live | Probe after an in-memory plugin reload | High |
| E-07 | The new test fails on the old class and passes on the new one | Verified: test | `InlineEditWidget.test.ts` run with the controller change stashed and restored | High |

## Verified Findings

### 1. The regression is the 1.3.2 light-DOM move, not Obsidian 1.15

In a ShadowRoot, `app.css` could not reach the input. R-057 moved the widget
into the editor document and listed E-04, "Community themes may affect
light-DOM controls", as a known limitation with the live visual check still
pending. The rule that broke the input comes from Obsidian itself, not a
theme, so every Obsidian version that 1.3.2 supports (1.13 and later) is
likely affected.

### 2. Renaming is safer than resetting

Resetting `position`, `top`, `left`, `z-index`, `box-shadow`, and so on would
fix today's rule, but Obsidian can add properties to `.prompt` in any release.
A class that Obsidian does not style is not affected by such changes.

## Decision And Implementation Contract

- The instruction textarea uses the class `edit-instruction`. The four
  `styles.css` selectors follow, including the forced-colors rule.
- `InlineEditWidget.test.ts` mounts the widget in the `prompt` state and
  asserts that no element uses the eight classes in E-05.
- No other class, behavior, or stylesheet loading changes. R-057's contract
  (scoped rules in `styles.css`, no style element) stands.

## Expected Change Surface

- `src/core/inline/InlineEditController.ts` (one class name and a comment)
- `styles.css` (four selectors)
- `src/core/inline/InlineEditWidget.test.ts` (one test)
- No schema, migration, bundle, or platform change.

## Test And Release Gates

- Full Jest, type check, lint, build and bundle budget, and the community
  review Error gate.
- Owner: open inline edit in a real vault and confirm that the input sits
  under the header with the option rows below it, on the default theme and on
  the owner's theme, and once in a popout window.

## Known Unknowns And Deferred Decisions

1. `prompt-surface`, `prompt-reference-echo`, and `prompt-reference-token` sit
   in the `prompt-` prefix that Obsidian uses for its modals. They do not
   collide in 1.15.0 (E-05). Rename them if a later Obsidian adds them, or
   prefix the inline classes as a separate change.
2. Element selectors from themes (`textarea`, `button`, `select`) were not
   audited beyond the screenshot.

## Security And Privacy

No credentials, tokens, account identifiers, private vault content, or other
secrets were recorded. The user's screenshot shows vault text, so it was not
attached to the issue or to this report. The probes added and removed only
empty elements.

## Change Log

- 2026-10-26: Initial report.
