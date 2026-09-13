# R-031: Community-release vault safety — folders, provenance, excluded files, rebrand

## Status

- **Verified** for every repository-source finding below (paths cited).
- Scope decision by the product owner, 2026-09-12: fix what is wrong for
  *any* vault in the community release; leave vault-specific conventions
  (CMDS folder lanes, CMDS frontmatter authorship) to per-vault settings.

## Executive Summary

An audit of every point where the plugin reads or writes the vault
(`src/`, 7 write sites, 1 read scope) found five behaviors that are wrong
regardless of the user's schema:

1. Two top-level folders are created under the pre-rebrand name
   `Smart Composer/…`, and generated images ignore Obsidian's own attachment
   folder setting (`setting.types.ts`, `PlanImageTaskAdapter.ts:84`).
2. Canvas/Base/Excalidraw drafts are written to whatever path the model
   returns; `validatePath` only rejects absolute paths, `..`, and a wrong
   extension, and `ensureParent` creates any folders in between
   (`ArtifactTaskAdapter.ts`).
3. Large-edit drafts copy the source note's frontmatter verbatim
   (`preserveFrontmatter`, default on) and add nothing, so a generated draft
   is indistinguishable from an original by its metadata
   (`DocumentJobRepository.writeVisibleDraft`).
4. Every vault-wide read (`getMarkdownFiles()` in `VectorManager`,
   `exhaustiveFolderRead`, `planRerank`, `VaultReferenceCompiler`) ignores
   Obsidian's Settings → Files and links → Excluded files list.
5. 40 user-facing strings still say "Smart Composer", including the draft
   file name suffix and the inline panel's accessible name.

A sixth finding from the audit was withdrawn: `DocumentEditTaskAdapter.ts`
passes `preserveFrontmatter: false` only when re-splitting a *chunk*, which
has no frontmatter. That is correct.

## Decision And Implementation Contract

1. Defaults: drafts → `CMDS Achmage/Document Drafts`; images → `''`, meaning
   "resolve Obsidian's `attachmentFolderPath` at save time" (`''`/`/` root,
   `./` and `./sub` relative to the source note, else the path). New
   `artifacts.outputFolder` → `CMDS Achmage/Artifacts`.
2. Migration 30 → 31 moves only values still equal to the old defaults.
3. Artifacts: the model supplies a file name; folder segments in its `path`
   are dropped (`resolveArtifactPath`). The system prompt says so. Both the
   approval fingerprint and the write use the resolved path.
4. New drafts get three plugin-namespaced keys — `achmage-source`,
   `achmage-generated`, `achmage-model` — merged into existing frontmatter
   or added as a new block. No existing key is rewritten: authorship and
   date semantics belong to the user's schema. Stamping is idempotent.
5. `ragOptions.respectObsidianExcludedFiles` (default true) applies
   `userIgnoreFilters` (prefix or `/regex/`) at all four read sites.
6. Rebrand: every user-facing "Smart Composer" → "CMDS Achmage", except the
   upstream-credit block, which now names the upstream project explicitly.
   Identifiers (`smtcmp-*` classes, `.smtcmp_*` data dirs, type names) and
   historical migrations are untouched.

## Deferred (vault-specific, per-vault settings or later work)

- Moving `.smtcmp_json_db/`, `.smtcmp_chat_histories/`,
  `.smtcmp_vector_db.tar.gz` out of the vault root (data migration risk).
- Automatic cleanup of finished document-job snapshots.
- Any schema-aware provenance (e.g. rewriting `author`) — belongs to the
  vault, not the plugin.

## Test And Release Gates

`type:check`, `lint:check`, `npm test`, `npm run build`. New tests:
`attachmentFolder`, `userIgnore`, `draftProvenance`, `30_to_31`.

## Change Log

- 2026-09-12: Initial report and implementation.
