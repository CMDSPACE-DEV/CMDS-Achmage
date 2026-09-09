# Obsidian community review & release runbook

How the Obsidian community-plugin review classifies findings, how to reproduce the
reviewer locally _before_ shipping, and the exact release procedure. Written for
maintainers and for AI agents working in this repo.

## How the review works

- The plugin is listed via a submission PR to
  [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases).
  An automated bot runs [`eslint-plugin-obsidianmd`](https://www.npmjs.com/package/eslint-plugin-obsidianmd)
  plus a build-reproduction check and posts a report; a human reviewer follows.
- **The review re-runs against your latest published release automatically.** Publish
  a fixed release and a fresh report appears — no manual trigger needed (observed
  across 1.0.0 → 1.0.1 → 1.0.2).
- Findings are tiered **Error / Warning / Recommendation**. **Only the Error tier makes
  the automated review Fail.** Warnings and Recommendations do not block the bot,
  though a human reviewer may still raise them.

## What actually fails: the Error tier

The Error tier is a specific subset of `obsidianmd/*` rules. The ones we have hit and
how we cleared them:

| Rule / finding | Fix |
| --- | --- |
| Undescribed `eslint-disable` directive | Append `-- <reason>` to the directive |
| Disabling `@typescript-eslint/no-explicit-any` | Not allowed — type the value instead of disabling |
| iOS-unsupported lookbehind regex `(?<=…)` | Rewrite without lookbehind (mobile / iOS < 16.4) |
| Setting styles directly (`el.style.x = …`) | `el.setCssStyles({ … })` |
| Raw `<h2>` heading in settings | `new Setting(el).setName(…).setHeading()` |
| Settings heading contains the word "settings" or the plugin name | Rename the heading (e.g. "Could not load") |

> **Gotcha:** fixing one finding can _expose_ another. Converting a raw `<h2>` to
> `.setHeading()` made the heading text newly subject to the "no 'settings' / no
> plugin-name in heading" rules — which then failed the _next_ release. Always
> reproduce the reviewer locally before shipping (below).

### Not Error tier (do not block the bot)

These appear as **Warning / Recommendation** and never fail the automated gate:
all `@typescript-eslint/*` type-aware rules (floating / misused promises, `no-unsafe-*`),
popout-window compatibility (`prefer-window-timers`, `no-global-this`),
`prefer-create-el`, `no-console`, `no-default-hotkeys`, `prefer-setting-definitions`,
`main.js` larger than 5 MB, dependency advisories, and CSS lint. Track them as quality
follow-ups, not release blockers.

## Reproduce the reviewer locally (before every release)

`eslint-plugin-obsidianmd` needs ESLint 9 + flat config, but this repo is pinned to
ESLint 8. So the gate lives in an isolated, committed toolchain at
`tools/obsidian-review/` (its own `package.json`, lockfile, and ESLint 9 flat config)
that never touches the project's ESLint 8 lint. Run it from the **repository root** —
the same command the CI gate runs:

```bash
npm --prefix tools/obsidian-review ci   # first time / after tooling changes
node tools/obsidian-review/check.mjs    # the gate
```

It exits non-zero when a review-failing **Error**-tier finding is present (or when the
tooling fails to run) and prints nothing when clean. A green local run means a green
`Obsidian community review gate` CI job. (The gate reads the plugin name from
`./manifest.json`, so it must run from the repository root — `check.mjs` enforces this.)

### What the gate enforces

`tools/obsidian-review/eslint.config.mjs` loads the reviewer's plugin but enables
**only** the Error-tier rule IDs (everything else off), so ESLint's exit code is the
gate:

- `eslint-comments/require-description`, `eslint-comments/no-restricted-disable`,
  `eslint-comments/no-unlimited-disable`
- `obsidianmd/regex-lookbehind`, `obsidianmd/no-static-styles-assignment`
- `obsidianmd/settings-tab/no-manual-html-headings`,
  `obsidianmd/settings-tab/no-problematic-settings-headings`

Warning-class rules (`no-console`, `prefer-create-el`, popout timers, floating
promises, …) are deliberately **not** gated — they never fail the community review, so
gating them would keep CI red on pre-existing findings.

**When a future release report surfaces a NEW Error rule,** add its rule ID to
`GATE_RULES` in `tools/obsidian-review/eslint.config.mjs`. This list is seeded from the
findings the bot actually failed us on (1.0.0–1.0.2); it does not claim to mirror the
bot's full, undocumented Error set. To see everything the plugin would report (the
Warning-class findings too), run its `recommended` config directly against `src`.

## Behavior flags (human-review context, not bot Errors)

The report's **Behavior** section flags capabilities the bot cannot fully analyze. For
this plugin they are legitimate, but a human reviewer may ask about them:

- **Shell execution** — the Plan / native-runtime feature (`src/core/llm/native/`)
  spawns subscription CLIs. Desktop-gated (`requireNode`, `isDesktopOnly: true`),
  opt-in.
- **Direct filesystem access** — native-runtime paths, desktop-gated.
- **Dynamic code execution (`eval` / `new Function`)** — **not our source.** It comes
  from transitive `ajv` compiling JSON schemas with `new Function`. Benign and
  explainable; removing it would mean ajv standalone mode or dropping the transitive
  dependency.

## Release procedure

Prerequisites: the fix is ready, and your git author is the org account
(`gh auth switch` to `cmds-contact`; commits authored `CMDSPACE <cmdspace.contact@gmail.com>`).

1. **Bump the version.** Updates `manifest.json`, `versions.json`, `package.json`, and
   `package-lock.json` together:
   ```bash
   node version-bump.mjs X.Y.Z
   ```
2. **Verify parity:**
   ```bash
   node check-version-parity.mjs        # internal consistency
   node check-version-parity.mjs X.Y.Z  # matches the target tag
   ```
3. **Merge to `main` via a PR.** Never push `main` directly. Keep fix PRs source-only —
   `main.js` and `meta.json` are gitignored build artifacts; do not commit them (the
   release workflow rebuilds them).
4. **Tag the merged `main` HEAD with an annotated tag and push it:**
   ```bash
   git tag -a X.Y.Z <merged-main-sha> -m "…"
   git push origin refs/tags/X.Y.Z
   ```
   The tag must point to the same commit as `origin/main` HEAD — the release workflow
   enforces `tag == branch head` and version parity.
5. **The release workflow does the rest.** `.github/workflows/release.yml` runs the full
   cross-platform CI (`gates`), builds, **attests build provenance** for `main.js` and
   `styles.css`, drafts the release, verifies the downloaded assets byte-for-byte, and
   publishes it as latest.
6. **The review bot re-reviews the new release automatically.** Check the fresh report.

## Version history

| Version | Result | Notes |
| --- | --- | --- |
| 1.0.0 | Failed | Korean-only README, wrong `isDesktopOnly`, many `obsidianmd` Errors, no attestations |
| 1.0.1 | Failed | English README, `isDesktopOnly: true`, directive / lookbehind / static-style / any-disable Errors fixed, attestations added — but converting `<h2>` → `.setHeading()` exposed the settings-heading content rules |
| 1.0.2 | **Passed** | Renamed the load-error heading to "Could not load" |

## References

- Obsidian plugin guidelines: <https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines>
- Submitting a plugin: <https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin>
- `eslint-plugin-obsidianmd`: <https://www.npmjs.com/package/eslint-plugin-obsidianmd>
- Quality follow-ups: issues #14–#21.
