# Inherited identifiers: what stays, what changes

CMDS Achmage is a fork of [Smart Composer](https://github.com/glowingjade/obsidian-smart-composer)
(see [LINEAGE.md](../LINEAGE.md)). The rebrand changed the plugin id, name, and
everything users read. It deliberately did **not** change a set of identifiers
that still spell `smtcmp` or `smart-composer`, because renaming them would
destroy data or break a working integration.

This document records which is which, so a future contributor tidying up the
last traces of the old name knows where to stop.

## The rule

Ask what the string names.

- **Names us to another system or to the user** — it must say CMDS Achmage.
  These now come from `src/constants/client-identity.ts`, which reads
  `manifest.json`, so they cannot drift from the shipped version again.
- **Names data that already exists on a user's disk** — it must not change.
  The old name is the key that finds their data.

## Kept on purpose

### `.smtcmp_json_db/` — on-disk job and reference store

`src/core/tasks/TaskRepository.ts`, `src/core/document-edit/DocumentJobRepository.ts`,
and `src/core/image/reference-image-store.ts` all read and write under this
folder inside the vault.

Renaming it orphans every stored task, document-edit job, and reference image in
every existing install. A rename would need a migration that moves the folder,
and the folder is visible in the vault, so the move would also surface in the
user's sync history. The name is ugly; the cost of changing it is real.

### `smtcmp-` CSS class prefix

Roughly 1,400 occurrences across `src/` and `styles.css`. These are internal, but
they are also the selectors that users' own CSS snippets and Style Settings
customizations target. Renaming the prefix silently breaks every snippet anyone
has written against this plugin.

### `smart-composer-mcp-<connectionId>-<kind>` — MCP secret ids

`src/core/mcp/McpSecretStore.ts` derives the storage id for every MCP credential
from this prefix. Changing it makes saved MCP secrets unreadable, so users would
have to re-enter every server credential with no warning that they needed to.

### `smart-composer:native-runtime-path` — runtime path storage key

`src/core/llm/native/NativeRuntimePathStore.ts`. Same reasoning: it is the
lookup key for a setting the user already configured.

### `originator: 'obsidian-smart-composer'` — Codex OAuth parameter

`src/core/llm/codexAuth.ts` sends this in the authorization request to OpenAI.
It is not branding. It identifies the client to OpenAI's Codex sign-in flow, and
the value is the one the upstream project uses. Changing it for cosmetic reasons
risks breaking ChatGPT subscription sign-in, with no user-visible benefit.

### `'Smart Composer/Generated Images'` and `'Smart Composer/Document Drafts'`

These appear in `src/settings/schema/migrations/` (19_to_20, 21_to_22, 30_to_31).
Migration code is a historical record: it describes what an older settings
version actually contained. Editing an old migration's constants rewrites
history and can make a real user's upgrade path diverge from the one that was
tested. Migrations are append-only.

### Upstream issue links in explanatory text

`src/core/llm/anthropic.ts` points at upstream issue #286 when it explains the
Anthropic CORS failure on new accounts. The issue thread is the actual source of
that explanation, so the link stays, worded to say it belongs to the upstream
project. It is a citation, not a support channel.

## Changed, and why

| Was | Now | Reason |
|---|---|---|
| Report Bug button opened `glowingjade/obsidian-smart-composer/issues` | `CMDSPACE-DEV/CMDS-Achmage/issues` | Our users' bug reports were landing in another project's tracker. |
| MCP client announced `smart-composer-achmage` v`2.3.0` | `manifest.id` and `manifest.version` | Every MCP server we connect to logged a stale version and the old brand. The hardcoded `2.3.0` had already drifted from the shipped version. |
| Excalidraw artifacts written with `source: 'smart-composer-achmage'` | `manifest.id` | The string is embedded in files the user keeps. |
| PubMed requests sent `tool=smart-composer-achmage` | `manifest.id` | NCBI asks the `tool` parameter to identify the calling client for rate-limit accounting. |
| Settings linked to the upstream wiki for API keys | [docs/getting-api-keys.md](getting-api-keys.md) | The upstream wiki describes a settings screen that no longer matches ours. |

## If you are about to rename one of the kept identifiers

Write the migration first, then rename. A rename with no migration is data loss
that only shows up on other people's machines.
