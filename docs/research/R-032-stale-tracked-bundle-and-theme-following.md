# R-032: A tracked stale bundle defeated theme following in the author's own vault

## Status

- **Verified** on the author's vault (2026-09-13): live DOM probe, bundle
  fingerprints, git history of `main.js`, and the 1.0.2 release asset.
- **Relationship to R-030**: R-030's theme-following default was correct in
  source and in the published 1.0.2 release. It was never running in the vault
  used to judge it. This report changes no design decision; it removes the
  artifact that hid the decision and adds the guard that keeps it removed.
- **Relationship to #12**: the inline edit panel's move onto the skin system
  ships together with this fix, so the chat pane and the inline panel follow
  the theme in the same release.

## Symptom

Chat pane and inline edit panel kept the neon dual skin (CMDS pink chat header
and user bubble, `#b6ff00` inline focus ring and primary button) although
Settings → Appearance showed **Follow Obsidian theme** and `data.json` stored
`appearance.skinMode = "follow-obsidian"`.

## Evidence

| Probe | Result |
| --- | --- |
| `app.plugins.plugins["cmds-achmage"].settings` | `version: 29`, `skinMode: "follow-obsidian"` |
| `.smtcmp-shell` in the live pane | `data-skin="cmds-dark"` |
| Schema version in source (`migrations/index.ts`) | `30` |
| `grep -c studio-console` on the vault's `main.js` | `0` |
| `grep -c studio-console` on the 1.0.2 release asset | `2` |
| md5 of the vault's `main.js` | equal to the tracked blob on `main` |
| Last commit touching the tracked `main.js` | 2026-08-20 (rebrand, before R-030) |
| Vault plugin folder | a git checkout of this repository, `main.js` never rebuilt |

The chain: `main.js` was force-added on 2026-06-05 and last refreshed on
2026-08-20, while `.gitignore` already listed it. Every checkout since then
carried that August bundle. The vault folder is a checkout, `npm run build`
was never run there, and Obsidian loaded the August bundle. That bundle
predates schema 30, so the migration that makes `skinMode` a real choice never
ran (`version` stayed 29) and its `ChatView` still derived the skin from
`body.theme-dark` alone, which is exactly the pre-R-030 behavior.

`styles.css` is tracked and current, so the theme-following CSS existed in the
vault but nothing set `data-skin="obsidian"` to select it. The stale bundle and
the fresh stylesheet disagreed silently.

## Why nothing caught it

- The release workflow builds fresh in CI and attests the asset, so published
  releases were never affected. The community listing served the right build.
- CI's `npm run build` overwrites `main.js` in the runner and never looks at
  the tracked copy.
- `docs/obsidian-community-review.md` already says not to commit `main.js`,
  but no check enforced it.
- Obsidian has no notion of a bundle being out of date relative to a source
  tree beside it.

## Decision

1. Untrack `main.js` and `meta.json` (`git rm --cached`). They stay gitignored.
2. Add a CI step to the Ubuntu quality gate that fails when either file is
   tracked, so the artifact cannot return through a force-add.
3. Document the vault-checkout workflow in `DEVELOPMENT.md`, including the
   one-line fingerprint that distinguishes a pre-R-030 bundle.
4. Ship the inline edit skin change (#12) in the same PR so the follow-theme
   mode covers every plugin-owned surface at once.

## Not changed

- The theme-following skin still uses the vault's accent for the focus ring,
  the primary button, and the user bubble. In the author's vault that accent
  is Catppuccin pink (`#f38ba8`), so those elements stay pink by the theme's
  own choice. Headings, callouts, and table borders inside assistant messages
  are rendered by Obsidian and styled by the active theme (AnuPpuccin), not by
  the plugin. R-030's boundary holds.

## Follow-ups

- A runtime self-check (bundle build id vs `manifest.json` version, warn once
  in the console) would make the next stale bundle visible in seconds. Not
  done here; it needs a build-time constant and a decision on how loud to be.
