# Repository Instructions

This file is the shared contract for everyone working on this repository, human or
agent, whatever tool they use. Keep it to project rules only.

## Shared vs personal instructions

Put personal or machine-specific setup outside this file and keep it out of git:
your tool's user-level file (for example `~/.codex/AGENTS.md`, `~/.claude/CLAUDE.md`,
`~/.pi/agent/AGENTS.md`), a context file in a folder above this repository, or
`CLAUDE.local.md` for Claude Code. Local tool folders (`.agents/`, `.codex/`,
`.claude/`) are gitignored. `CLAUDE.md` only imports this file so Claude Code reads the
same rules; do not add rules there.

## Pull request scope

Size each PR so a reviewer can understand its purpose and request changes from
the PR alone. Do not fragment one feature into many PRs; keep unrelated features
apart, and separate changes that need the owner's hands-on testing.

## Mandatory research gate

Before planning or implementing any non-trivial change in this repository:

1. Open `docs/research/00-research-register.md`.
2. Read every report marked **Mandatory** that applies to the affected feature.
   For broad, cross-cutting roadmap, multi-subsystem migration, or architecture
   work, read all reports currently marked **Verified** and **Mandatory**. A
   scoped patch release requires the affected reports plus any explicit set
   named below, not every unrelated historical report.
3. For Plan settings, Claude Code, Gemini Plan, Antigravity CLI, native runtime
   installation, login, diagnosis, or updater work, always read R-023, R-024,
   and R-025 in full before editing code.
4. Treat labels precisely:
   - **Verified** means supported by inspected source, a reproducible test, or a
     current primary source.
   - **Partially verified** means source or current first-party evidence exists,
     but a required target-environment or clean-machine check is still pending.
   - **Inference** is not a verified runtime fact.
   - **Proposal** is not an implemented decision.
5. Re-check time-sensitive external facts against current first-party sources.
   Do not copy commands, model names, version claims, login behavior, or policy
   statements from memory.

## Recording new research

- Give each materially different investigation the next unused, zero-padded ID
  and a descriptive file name: `docs/research/R-###-topic-slug.md`.
- Start from `docs/research/REPORT_TEMPLATE.md`.
- Update `docs/research/00-research-register.md` in the same change.
- Never renumber old reports or silently rewrite history. Mark supersession and
  contradictions explicitly.
- Keep verified findings, inferences, proposals, implementation state, and
  untested release gates separate.
- Record the exact repository tag/commit and source paths whenever available.
- Never record credentials, tokens, account identifiers, private vault text, or
  other secrets in research artifacts, fixtures, logs, or screenshots.

## 2.6.2 Plan onboarding constraint

R-025 is the implementation contract for the 2.6.2 native Plan onboarding
work. Do not reduce the reported issue to a copy-only change: preserve the
state-transition, platform, executable-discovery, updater, authentication,
accessibility, and clean-machine test requirements recorded there.

## Releasing

Releases ship only after the official community **Review branch** scan passes. Order:
collect PRs on `test/YYYY-MM-DD` → pre-check scan and owner testing in parallel → owner
picks the PRs → `review/YYYY-MM-DD` with only those PRs → final scan → set the version
on the review branch → merge commit into `main` → annotated tag. Team PRs target `main`
and stay open until that merge. Never bump the version before the final scan passes.
Full steps: [docs/obsidian-community-review.md](docs/obsidian-community-review.md). Keep
PRs source-only — `main.js` and `meta.json` are gitignored build artifacts.
