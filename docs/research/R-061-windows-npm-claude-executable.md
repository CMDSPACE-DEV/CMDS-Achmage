# R-061: Windows npm-installed Claude Code executable discovery

## Status

- Evidence status: **Partially verified** — source, npm registry metadata, an
  owner-device observation, and unit tests verified; a fixed-build run on a real
  Windows Obsidian install is pending.
- Planning use: **Mandatory** for Claude executable discovery on Windows; read
  with R-023 through R-025.
- Investigation date: 2026-10-19
- Repository baseline: `origin/main` at `6ff66ee` (1.3.1)
- Target release: 1.3.2

## Executive Summary

On Windows, a Claude Code installation made with
`npm install -g @anthropic-ai/claude-code` was not usable from the Claude Plan
card. Diagnosis ended with "Native runtime diagnosis failed" although
`claude` worked in a terminal.

The resolver never looked in the npm package directory, so it fell back to the
inherited `PATH`. There it accepted the npm shim `%APPDATA%\npm\claude`
(extensionless POSIX shell script) and npm also writes `claude.cmd`.
`runNativeProcess()` spawns with `shell: false`; Windows cannot start either
shim that way, so the spawn failed.

Since `@anthropic-ai/claude-code` 2.1.120 the package's `bin` entry is the real
native `bin/claude.exe`, which the shims merely forward to. The fix adds that
file as a candidate (default `%APPDATA%\npm` prefix and, for custom prefixes,
next to every `PATH` entry) and stops accepting the extensionless `claude` name
on Windows. Users only need to update the plugin; no path override is needed.

## Research Question

Why does an npm-installed Claude Code fail diagnosis on Windows, and how can the
plugin find a spawnable executable without user configuration?

### In scope

- `NativeCliResolver` Windows Claude candidates and `PATH` scan.

### Out of scope

- Updating an npm installation from the plugin. The npm candidate is classified
  `legacy`, so the existing R-025 §9.7 rule keeps the Update action from
  running a guessed updater.
- npm versions before 2.1.120, whose `bin` is `cli.js` (JavaScript, needs
  Node). These remain unsupported without a custom path; Anthropic recommends
  the native installer.
- Antigravity (not distributed through npm).

## Baseline And Reproducibility

- Owner Windows device (sanitized): no `claude.exe` in any resolver candidate
  directory; `%APPDATA%\npm\claude.cmd` present;
  `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe` present
  and runs directly (reported version 2.1.139). Setting that path as the
  advanced executable override was the manual workaround.
- npm registry, 2026-10-19:

  ```sh
  npm view @anthropic-ai/claude-code@2.1.110 bin   # { claude: 'cli.js' }
  npm view @anthropic-ai/claude-code@2.1.120 bin   # { claude: 'bin/claude.exe' }
  npm view @anthropic-ai/claude-code bin           # 2.1.300: { claude: 'bin/claude.exe' }
  ```

  The package ships per-platform binaries as optional dependencies
  (`@anthropic-ai/claude-code-win32-x64`, `-win32-arm64`, …); the published
  `bin/claude.exe` path is stable across versions since 2.1.120.

## Sources Inspected

### Repository source

- `src/core/llm/native/NativeCliResolver.ts` — Windows candidates and `PATH`
  names `['claude.exe', 'claude']`.
- `src/core/llm/native/NativeProcess.ts` — `spawn(..., { shell: false })`.
- `src/core/llm/native/NativeRuntimeService.ts` — update decision: `legacy`
  method yields `unknown`, no updater command.

### First-party external sources

- npm registry metadata for `@anthropic-ai/claude-code` — accessed 2026-10-19.
- [Node.js `child_process` — spawning `.bat` and `.cmd` files on Windows](https://nodejs.org/api/child_process.html#spawning-bat-and-cmd-files-on-windows)
  — `.cmd`/`.bat` need a shell; accessed 2026-10-19.

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | Resolver had no npm package path candidate | Verified: source | `claudeCandidates()` win32 list | High |
| E-02 | `PATH` scan accepted extensionless `claude` on Windows | Verified: source | `executableNames` | High |
| E-03 | Windows cannot spawn npm shims with `shell: false` | Verified: first-party docs + owner device | Node docs; observed diagnosis failure | High |
| E-04 | npm package `bin` is native `bin/claude.exe` since 2.1.120 | Verified: registry | `npm view` above | High |
| E-05 | Fixed build diagnoses npm Claude on real Windows Obsidian | Not verified | Pending owner run | Not applicable |

## Decision And Implementation Contract

- Add `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe`
  as the lowest-priority Windows hard-coded candidate (`legacy`).
- For each `PATH` entry on Windows, also check
  `<entry>\node_modules\@anthropic-ai\claude-code\bin\claude.exe` (custom npm
  prefix).
- Windows `PATH` scan accepts only `claude.exe`.
- Native, WinGet, and custom paths keep priority; ambiguity rules unchanged.

## Test And Release Gates

- Unit: npm shims (`claude`, `claude.cmd`, `claude.ps1`) present together with
  the package exe → the exe is selected and not ambiguous; custom prefix found
  through `PATH` only. Done.
- Full repository gates (type, lint, 900+ tests, build/bundle budget, review
  gate). Done locally.
- Release gate: on a Windows device with only an npm installation and no path
  override, Claude Plan card Diagnose reaches login/ready. Pending.

## Known Unknowns And Deferred Decisions

1. npm installs older than 2.1.120 (`cli.js`) stay undetected; message-level
   guidance could be added if users report it.
2. pnpm/Yarn global layouts were not inspected.

## Security And Privacy

No credentials, tokens, account identifiers, private vault content, or personal
file paths were recorded; device paths are shown with environment variables.

## Change Log

- 2026-10-19: Initial report and 1.3.2 fix.
