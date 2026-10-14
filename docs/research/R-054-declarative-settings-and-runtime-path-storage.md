# R-054: Declarative settings search host and native runtime path storage

## Status

- Evidence status: **Partially verified** — typings, reviewer rules, and unit
  tests verified; live Obsidian 1.13 rendering not yet checked
- Planning use: **Mandatory for the settings tab entry point and the native
  runtime executable-path store**
- Investigation date: 2026-10-14
- Repository baseline: `origin/main` `66b9c59` (1.3.x), branch
  `fix/20-settings-platform-hygiene`
- Target release: 1.4.0 (issue #20)

## Executive Summary

Two Obsidian community-review warnings from issue #20 required design
decisions rather than mechanical edits.

1. **Declarative settings.** In Obsidian 1.13, `display()` is not called once
   `getSettingDefinitions()` returns a non-empty array. Real per-setting
   definitions would therefore replace the React settings UI. The decision
   (option A, chosen by the integrator) is one `render` definition that mounts
   the existing React `SettingTabRenderer` into its row and unmounts it on
   cleanup. Its `aliases` carry the tab names, section titles, and main setting
   labels, so settings search finds the tab. `display()` stays as the fallback
   for Obsidian < 1.13 (minAppVersion is still 1.11.4).
2. **Executable path storage.** `NativeRuntimePathStore` now uses
   `App#loadLocalStorage` / `App#saveLocalStorage`. Each vault copies the
   legacy raw key `smart-composer:native-runtime-path:<provider>` once (when it
   has no value of its own) and records a per-vault marker. The legacy key is
   never deleted, so every vault on the device keeps the saved path.

## Research Question

How can the plugin clear `obsidianmd/settings-tab/prefer-setting-definitions`
and `no-restricted-globals(localStorage)` without changing what users see or
losing a saved custom executable path?

### In scope

- `src/settings/SettingTab.tsx`, `src/core/llm/native/NativeRuntimePathStore.ts`
  and the one-line binding in `src/main.ts`.

### Out of scope

- Restructuring the React settings UI into declarative pages or controls
  (options B/C below).
- The `minAppVersion` 1.13.0 bump (separate lane after PR #43).

## Sources Inspected

### Repository source

- `node_modules/obsidian/obsidian.d.ts` 1.13.1: `SettingTab.display()`
  ("Not called when getSettingDefinitions returns a non-empty array"),
  `SettingDefinitionRender.render` (may return a cleanup function),
  `SettingDefinitionBase.aliases`, `App.loadLocalStorage` / `saveLocalStorage`
  (vault-specific, since 1.8.7).
- `tools/obsidian-review/node_modules/eslint-plugin-obsidianmd` rules
  `settingsTab/preferSettingDefinitions` (flags a missing method),
  `settingsTab/noDeprecatedDisplay` (fires only once minAppVersion ≥ 1.13.0),
  and `ruleOptions.restrictedGlobalsOptions` (bare `localStorage`).
- `src/core/llm/native/NativeCliResolver.ts`, `NativeRuntimeService.ts`,
  `ClaudeAgentProvider.ts`, `AntigravityProvider.ts`: each constructs a
  resolver with a default `NativeRuntimePathStore()`.

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | Non-empty definitions suppress `display()` | Verified: source | obsidian.d.ts 1.13.1 `SettingTab.display` doc | High |
| E-02 | A `render` definition can host and clean up imperative UI | Verified: source | `SettingDefinitionRender.render` return type | High |
| E-03 | The React UI looks identical inside the declarative row | Not verified | Needs Obsidian 1.13 live check | Not applicable |
| E-04 | `render()` mounts once and cleanup unmounts | Verified: test | `src/settings/SettingTab.test.ts` | High |
| E-05 | `App#*LocalStorage` is per vault; raw `localStorage` is shared by all vaults on the device | Verified: source (docs "for this vault") | obsidian.d.ts | High |
| E-06 | Two vaults both migrate the same legacy path; a path cleared in one vault stays cleared after reload; new key wins; legacy key kept | Verified: test | `NativeRuntimePathStore.test.ts` | High |

## Decisions

### Declarative settings options considered

- **A (chosen):** one `render` row hosting the React UI with search aliases.
  No restructuring, but search finds the tab rather than individual settings.
- B: one row or page per React tab: per-section search hits, but the tab
  navigation would be restructured.
- C: per-setting control definitions: a rewrite of the settings UI.
- D: return `[]`: silences the lint rule with no search benefit. Rejected.

### Path store

- An `App` binding is set once in `onload` (`bindNativeRuntimePathStore`),
  because the resolvers are default-constructed in files owned by another
  lane (PR #43).
- The legacy read uses `window.localStorage` deliberately: the App API
  prefixes keys per vault and cannot read the old raw key. The bare
  `localStorage` global (what `no-restricted-globals` flags) is not used.
- Per-vault migration: on the first read in a vault without the
  `native-runtime-path-migrated:<provider>` marker, copy the legacy value if
  the vault has none, then set the marker. `set()` also sets the marker, so
  a path cleared in a vault does not come back from the legacy key.
- The legacy raw key is never deleted, so all vaults keep the saved path
  (owner decision "users keep their saved path"; superseded the first draft,
  which removed it after the first vault read it).
- **Behaviour change (known):** after migration the path is per vault, so a
  change made in one vault no longer applies to the others.

## Release Gates

- Obsidian 1.13: the tab looks identical; searching 2–3 aliases (e.g. "Chat
  model", "Embedding model", "MCP") opens it; closing and reopening settings
  leaves exactly one React root.
- Obsidian < 1.13: `display()` path unchanged.

## Security And Privacy

No credentials, tokens, account identifiers, executable paths from a real
machine, or vault content were recorded.

## Change Log

- 2026-10-14: Initial report and implementation for issue #20.
- 2026-10-14: Review fix: migration is per vault with a marker and keeps the
  legacy raw key instead of removing it.
