# R-052: Claude Plan Uses The Terminal's `CLAUDE_CONFIG_DIR` On macOS

## Status

- Evidence status: **Partially verified**
- Planning use: **Mandatory** for Claude Plan authentication and environment
  preparation (with R-023 to R-025, R-027, and R-049)
- Investigation date: 2026-10-14
- Repository baseline: `integration/1.4.0` at `0085e7b` (version `1.4.0`
  candidate), branch `fix/claude-config-dir-gui`
- Runtime inspected: Claude Code `2.1.281` and `2.1.299` on macOS 26.5.2
  (Apple Silicon, MacBook M1); owner report and command output from a second
  Mac (MacBook M5, Claude Code `2.1.299`)
- Target release: CMDS Achmage `1.4.0`

## Executive Summary

After updating to 1.3.0, the owner's MacBook M5 showed "Login required / Sign
in to Claude Code with an eligible Claude subscription." on the Claude Plan
card although `claude auth status` in Terminal reported a Max login. Logging
in again from Terminal did not help.

The owner's shell exports `CLAUDE_CONFIG_DIR`. Terminal runs of Claude Code
therefore read the login stored for that directory. Obsidian launched from the
Dock or Finder does not read shell startup files, so the plugin's
`claude auth status` ran without the variable, read the default `~/.claude`
login, and correctly reported it signed out. Every terminal login wrote to the
other location, which is why signing in again never fixed the card.

The plugin code that diagnoses and runs Claude did not change between 1.2.0
and 1.3.0 (`git diff 1.2.0 1.3.0 -- src/core/llm/native` is empty). The
version update coincided with the failure; it did not cause it.

Fix: before preparing the Claude environment from the live Obsidian process
environment, read only `CLAUDE_CONFIG_DIR` from the user's login shell and add
it when Obsidian does not already have it. Diagnosis, the request preflight,
and the request itself use the same prepared environment, so they agree. The
Sign in button already opens a login shell in Terminal, which sees the same
value, so login, diagnosis, and requests now point at one location.

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | On M5, Terminal `claude auth status` is logged in and the same binary without shell variables is logged out | Verified: owner-run command | `env` lists `CLAUDE_CONFIG_DIR`; `env -i HOME USER PATH claude auth status` → `loggedIn: false`; shell run → `true`, `max` | High |
| E-02 | Making the variable visible to GUI apps fixes the card | Verified: owner report | `launchctl setenv CLAUDE_CONFIG_DIR …` plus a LaunchAgent, then restarting Obsidian → Ready | High |
| E-03 | Claude Plan native code is identical in 1.2.0 and 1.3.0 | Verified: source | empty diff under `src/core/llm/native`; same `auth status` call and message in both release bundles | High |
| E-04 | 1.3.0 reaches Ready on a Mac whose default login is valid | Verified: real Obsidian on M1 | Codex computer use pressed Diagnose → Ready, `2.1.299`; screenshot kept outside the repository | High |
| E-05 | Obsidian's process environment lacks shell-only variables | Verified: real Obsidian on M1 | `process.env` inside Obsidian has no `CLAUDE_*` names | High |
| E-06 | A login-shell read from inside Obsidian is fast and parses | Verified: real Obsidian on M1 | `zsh -ilc printf …` returned the marker pair in 38 ms | High for that machine |
| E-07 | The fixed build follows the shell value in real Obsidian | Verified: real Obsidian on M1 | Fixed 1.4.0 build: shell `CLAUDE_CONFIG_DIR` pointed at an empty test directory → Login required (the shell value was used); line removed → Ready | High |
| E-08 | With the fix, the M5 configuration reaches Ready without the LaunchAgent workaround | Not verified | Requires removing the workaround on M5 and installing the fixed build | Not applicable |

## Decision And Implementation Contract

1. New module `src/core/llm/native/claudeShellConfigDir.ts`.
2. Applies only when the source is the live `process.env`, the platform is not
   Windows, and `CLAUDE_CONFIG_DIR` is absent or blank. Injected environments
   (tests, explicit callers) are unchanged.
3. Runs `$SHELL -ilc` (default `/bin/zsh`) with a 5-second timeout, stdin and
   stderr ignored, printing only `$CLAUDE_CONFIG_DIR` between markers.
4. Accepts only an absolute path to an existing directory. Anything else, a
   shell error, or a timeout keeps today's behavior.
5. Copies that one variable. No other shell variable reaches Claude Code, so
   the R-025/R-027 billing-variable filter and its blocked-name evidence are
   unchanged.
6. The result is cached for the Obsidian session; a changed shell value takes
   effect after restarting Obsidian.
7. Used by `diagnoseClaude()` and `ClaudeAgentProvider.streamResponse()`
   before `prepareNativePlanEnvironment('claude', …)`.

No settings schema, consent, classification, or protocol change. R-027 and
R-049 matrices are unchanged: the variable only selects which official Claude
Code login is inspected; that login is classified exactly as before.

## Security And Privacy

The plugin reads one shell variable's value, a directory path, and never reads
credentials, keychain items, or files inside that directory. No email,
organization, token, or path from the owner's machines is recorded here.

## Test And Release Gates

- `claudeShellConfigDir.test.ts`: shell value added; only that variable copied;
  blank, relative, missing directory, shell failure all keep the default;
  existing value not overridden; Windows untouched.
- All native suites (219 tests, including the new file) pass.
- Release gate (E-08): on the M5 configuration, remove the LaunchAgent
  workaround, restart Obsidian with the fixed build, Diagnose → Ready, one
  minimal request.
- Regression gate: M1 (no `CLAUDE_CONFIG_DIR`) still Ready.

## Known Unknowns

1. Shells other than zsh/bash with unusual `-ilc` behavior fall back to the
   default; not tested.
2. A slow interactive shell startup longer than 5 seconds falls back to the
   default.
3. `CLAUDE_CONFIG_DIR` set only in a non-login, non-interactive file that
   `-ilc` does not read is not found.

## Change Log

- 2026-10-14: Initial report and fix.
