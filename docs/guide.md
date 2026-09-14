# CMDS Achmage user guide
Use your notes as working context for AI chat, reviewable edits, research, and image creation inside Obsidian.

## Status, requirements, and cost
This manual describes **CMDS Achmage 1.1.0**, checked on **2026-09-14**. It has a public stable release with three plugin assets and is listed in Community Plugins. The listing explicitly says it has not been manually reviewed by Obsidian staff. Older 2.x numbers in research reports belong to its inherited development lineage, not a later CMDS release.
- **Obsidian desktop 1.11.4+**. Desktop capabilities include native processes, clipboard and MCP connections; no Obsidian Mobile support.
- An API provider account/key and available usage credit for the recommended beginner path. A chat subscription is not an API-credit balance.
- Optional embedding-provider access for vector retrieval. Explicit note/folder context can work without an embedding key using the available reading/reranking paths; model calls can still consume usage.
- Optional Eagle/CMDS Eagle, external MCP tools, research-service accounts, and image-provider credentials for their respective features.
- The plugin is MIT-licensed; provider usage, research quotas, storage, and commercial third-party apps have separate terms and costs. No universal model availability or current price is guaranteed by a model appearing in a menu.

## Install and prepare safely
1. In **Settings → Community plugins → Browse**, search **CMDS Achmage**, install and enable it.
2. Alternatively download `main.js`, `manifest.json`, and `styles.css` from [1.1.0](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases/tag/1.1.0) into `<vault>/.obsidian/plugins/cmds-achmage/` and restart/reload Obsidian. Keep existing settings and chat data backed up; do not import someone else's `data.json`.
3. Open a test vault or a non-sensitive note that is safe to send to your chosen provider.
4. Open **Settings → CMDS Achmage → Advanced → Providers**. Add/edit an API provider and its key; use [the API-key guide](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/docs/getting-api-keys.md) and that provider's current official console.
5. In **Advanced → Models**, configure an enabled chat model tied to that provider. Choose it under **Plan → Chat model** or in the chat composer. Despite the tab name, the chat-model selection is not limited to subscription Plan models.
6. Before adding an MCP connection, set **MCP → Tool execution → Per-tool approvals**. The shipped default is **Full auto**, not approval-per-call.
7. Under **Writing**, review **Include current file** (default on) and **Enable tools**. Turn off current-file inclusion if you want to control context through explicit mentions only. Leave external tools disconnected for the first chat.

## First success: ask one question about one note
1. Create a short sample note with three factual bullet points, such as a fictional workshop agenda.
2. Run **Open chat** from Ctrl/Cmd+P, or use the wand ribbon icon.
3. Type `@`, choose the sample note, and ask: “Using only this note, list the three agenda items. Mark missing information as unknown.”
4. Check the context chips and the currently active note before sending; automatic current-file inclusion may add content beyond the explicit mention.
5. Send once, wait for the reply, and compare it with the source. A plausible reply is not evidence that it read the correct file.
Success is a response grounded in the intended note using the intended provider. A connection status or model catalog alone is not an end-to-end chat test.

## Editing: generation is not application
### Edit note in chat
Open the intended note, turn on **Edit note** (pen icon), and request a small explicit change. Reply edit cards are anchored to existing text. Review each card and use **Apply**; **Apply all** can apply multiple cards. Whole-document suggestions can offer **Apply changes** to patch changed paragraphs.
This path applies matching text without a second model call. If the source changed or an anchor is ambiguous, inspect and regenerate rather than forcing a blind replacement. Use the editor's undo immediately for an unwanted applied edit; keep backups for larger changes.
### Inline edit
Select text and run **Inline edit selection** (default Mod+Shift+K, shown as Cmd+Shift+K on macOS). The panel's **Output: Text edit** rewrites that selection. Review the proposed result before applying. Other notes/folders can be included as reference context; this is distinct from granting them write access.
### Long documents
Large edits can become document-scale jobs with checkpoints and visible drafts. **Review document edit jobs** opens their review/resume workflow. Check source, target, completed/failed chunks and generated draft before promoting it to your working document. Cancellation can stop remaining work, not refund completed requests or undo all existing files.
Drafts default to `CMDS Achmage/Document Drafts`; generated drafts carry `achmage-source`, `achmage-generated`, and `achmage-model` provenance without rewriting your authorship schema. Historical snapshots are not automatically purged by this guide.

## Notes, folders, and retrieval
RAG means retrieving relevant source passages before asking the model to answer. It is not an assurance that every note was read.
- `@` selects notes/folders; **Add selection to chat** adds a selected block.
- **Writing → Vault search** contains **Retrieval mode**, **Folder mention scope**, **Embedding model**, include/exclude patterns, chunk size, token thresholds, similarity, limits and database management.
- Automatic/focused/exhaustive folder modes trade coverage, latency and token usage. An exhaustive request can be much larger than a short note mention.
- With a configured embedding model, **Rebuild entire vault index** can send eligible text to that embedding provider. **Update index for modified files** updates the index later. Review include/exclude scope **before** starting a rebuild.
- **Respect Obsidian's excluded files** defaults on for the vault-search paths. It is a scope setting, not a universal authorization boundary for every explicitly attached file or external tool.
- Chat context can include the active note, mentions, retrieved passages, previous conversation, image references and tool results. Do not describe the system as sending only explicitly mentioned files.

## Images and text cards
Five image entry points are available: composer image mode, text prompt, selection, current note, and clipboard reference image. A long selection or note may first be condensed into an editable brief by the chat model. That preparation is itself an AI request.
**Writing** offers Image model, Image output folder, quality, destination, prompt templates, purpose defaults, always-on instructions, clipboard copying, and text-card/vision settings. Image-only models do not belong in the chat picker.
- GPT Plan image generation is an experimental subscription-authenticated route; Gemini and Grok image routes use API credentials.
- GPT Plan and Gemini image models can accept reference images; the implemented Grok image route is text-to-image only.
- Images are saved to the vault first. A blank Image output folder follows Obsidian's attachment-folder setting at save time; it does not mean “do not save.”
- Delivery can keep the vault image, ask on the task card, send it to Eagle, or use CMDS Eagle cloud upload. Eagle library/folder, link style, tags and removal of the vault copy deserve a deliberate choice. Dropping the local copy changes recovery options.
- **Render selection as image card (text as image)** creates a PNG text card without a model request. This is different from generative illustration.
- Clipboard image conversion uses a vision-capable model to create Markdown. Confirm that the clipboard contains the intended, non-sensitive image before invoking it.
- Generated labels, citations, layouts and diagrams need review; an attractive output is not a verified source.

## Research connections and source boundaries
**Research** offers individually configurable sources including Web of Science Starter, Crossref/Retraction Watch, OpenAlex, PubMed, Europe PMC, KCI, ScienceON, RISS Linked Data, Korean Law, OpenDART, NTIS, KOSIS, and NAVER search. These are built-in provider/API adapters exposed to chat tools; not every entry is a separately installed remote MCP server.
1. Enable only the source relevant to the task and enter its own required credentials/options. Some sources need credentials and some do not.
2. Use the source's connection/test controls. A live test can consume that service's quota.
3. Set **Source routing** and **Maximum Auto sources**, or name/mention the intended source in chat.
4. Ask for a narrowly bounded result including title, identifier, source URL and retrieval limitations.
5. Open the primary record before relying on a citation. An abstract/metadata lookup does not prove full-text access, Scopus/SSCI coverage, or verification of a claim inside the paper.
[Research setup reference](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/docs/research/R-017-power-7-research-connections-setup-and-usage-guide.md) records credential and source-specific boundaries. Check the provider's current documentation when onboarding; inherited research dates are not fresh service guarantees.

## MCP permissions: the default matters
MCP is a connection protocol through which a model can call external tools. Tool results are sent to the current chat model and can increase usage and disclose data.

| MCP → Tool execution | Actual behavior |
|---|---|
| **Full auto (default)** | A manual connect/rescan trusts current schemas automatically; enabled read, write and delete tools can execute without an Allow prompt |
| Safe auto: read only | Read-only tools run automatically; write/delete/unknown tools require approval |
| Per-tool approvals | Explicit approval-oriented operation; recommended while learning or adding an unfamiliar connection |

Schema means the tool's declared name, input format and metadata; trusting it is not a security audit of its server. Rescanning can change what is enabled/trusted. Inspect credentials, tool names, side effects and the selected execution policy before using a connection. Disconnect unused servers. Do not send broad instructions such as “clean up everything” while full-auto write/delete tools are available.
**Tool routing** controls automatic selection versus on-demand exposure. **Writing → Maximum automatic tool rounds** bounds consecutive rounds (1–50 in the UI); a bound is not a spending cap or a guarantee of harmless actions. Stopping a request cannot undo external actions already completed.

## Plan connections are experimental
The **Plan** tab offers subscription-authenticated compatibility paths. They are **not an official, guaranteed third-party subscription entitlement**, and “ready” does not prove a free request or universal model access. Use API authentication for a conventional provider integration and check current provider terms before opting into Plan.
For native Claude/Gemini onboarding, use the plugin's platform-specific installation guide and visible terminal. The intended sequence is **install → check installation → sign in → check connection → test one short chat**. Merely copying a command, opening a terminal, or closing a guide does not complete installation/login. Native runtime discovery and login are device-specific; a synced settings file cannot install a CLI on another machine.
- Claude delegates to the installed official Claude Code CLI. Concrete API/cloud/billing overrides, unsupported account classifications and malformed auth data can block the Plan path. Do not remove organizational controls just to make a status green.
- The Gemini Plan implementation delegates to Antigravity CLI (`agy`), not the separate `gemini` executable. A discovered model catalog supports connectivity but does not machine-verify personal quota. Explicit cloud/API billing markers can still block it.
- Native authentication belongs to the runtime's login flow/protected storage. Do not paste native OAuth codes or token files into plugin settings or an issue.
- GPT-family Plan has its own connection flow; do not assume the native Claude/Gemini instructions apply to it.
- Use the selected runtime's diagnostic/update flow and current official installer documentation. Do not guess an updater command or interpret the update UI as proof a new version was installed.
- Policy, account, model and backend changes may break compatibility without notice. There is no automatic promise to fall back to another paid model.
The R-023 through R-029 reports distinguish historical live probes, implementation changes and still-unverified environments. This manual did not perform fresh native login, billable inference or clean-machine qualification.

## Settings map
The actual top-level tabs are **Plan, Research, Writing, MCP, Advanced**.

| Tab | Main controls |
|---|---|
| Plan | Subscription/native connection cards; Chat model; Inline edit model |
| Research | Source routing, source-count limit, individual credentials/options and live tests |
| Writing | Inline surrounding context; Large inline edits; draft folder; Preserve document frontmatter; concurrency/retries; image/artifact output and templates; System prompt; Include current file; Enable tools; tool-round limit |
| Writing, Appearance section | Theme-following default, presets, Base skin, Accent, Glow; optional Style Settings fine tuning |
| Writing, Vault search section | Retrieval/folder modes, embedding selection, include/exclude scope and indexing parameters |
| MCP | Tool execution, Tool routing, server connection/authentication/discovery and tool controls |
| Advanced | API Providers, Models including embedding models, additional plugin utilities |

Artifact drafts default to `CMDS Achmage/Artifacts`. Deleting an API provider can also remove its models and associated embeddings after confirmation; it is not merely hiding a menu row. Back up before altering provider/model infrastructure.

## Command reference

| Exact command | Purpose |
|---|---|
| Open chat | Open the chat pane |
| Add selection to chat | Attach selected text as context |
| Inline edit selection | Edit a selection; output can also be image |
| Generate image (text to image)… | Open image-generation prompt controls |
| Generate image from selection | Use selection as image brief |
| Generate image from current note | Condense note into an editable image brief |
| Generate image from clipboard image (image to image)… | Use clipboard image as a reference |
| Render selection as image card (text as image) | Local PNG text card without a model call |
| Convert clipboard image to Markdown (auto structure) | Infer a Markdown structure from a clipboard image |
| Convert clipboard image to Markdown list | Vision-to-list conversion |
| Convert clipboard image to Markdown table | Vision-to-table conversion |
| Convert clipboard image to Mermaid diagram | Vision-to-diagram conversion; review syntax and content |
| Review document edit jobs | Review/resume long-edit jobs |
| Rebuild entire vault index | Rebuild eligible embedding index; may incur provider usage |
| Update index for modified files | Incrementally refresh eligible modified-file index |

## Data, privacy, and recovery
Chat and RAG stores retain inherited `.smtcmp_*` names, including chat histories, JSON data and vector storage. These are not proof of a second installed plugin. Do not delete them merely to remove old naming. Keep them and `data.json` private; they may contain conversations, context, model settings, credentials or searchable derivatives of notes.
MCP and research credentials use Obsidian secretStorage, separately from ordinary settings. This does not make all provider settings, conversation stores or backups secret-free.
Data can leave your machine through the chosen model, embedding provider, research API, MCP server and image/cloud route. Optional local runtimes still contact their provider. An API key field being visually masked does not guarantee encryption of every stored setting. Review vault-sync and backup policies accordingly.
For an unwanted edit, use editor undo or restore a verified backup. For an unwanted external tool call or uploaded image, inspect that service's state separately; reverting Markdown cannot undo a remote write. Avoid deleting job/checkpoint stores until the relevant jobs are stopped and recovery is no longer needed.

## Troubleshooting

| Symptom | Check next |
|---|---|
| No response / unauthorized | Correct API provider/key/model, quota, connectivity; Plan status is a separate path |
| Answer cites wrong material | Context chips, Include current file, folder scope, retrieved passages and prior conversation |
| Apply cannot match text | Source changed or anchor ambiguous; inspect current note and regenerate a small change |
| Folder search incomplete | Include/exclude patterns, Obsidian exclusions, retrieval mode and index freshness |
| Unexpected usage | Embeddings, long folder reads, image brief generation, tool-result size and automatic rounds |
| MCP runs without asking | Full auto is the default; change execution policy before reconnecting/testing |
| Runtime installed but not detected | Finish the installer, run local diagnosis, check current-machine executable selection; do not copy another machine's ready state |
| Plan billing/auth blocked | Read the sanitized diagnostic and use a supported API path; do not bypass billing/organization safeguards |
| Generated image missing | Task state, configured output/attachment folder, reference-image support and Eagle/cloud destination |
| Theme looks different | Writing → Appearance; start with Follow Obsidian theme, then inspect optional Style Settings |

## Support, lineage, and license
[Web manual](https://apps.cmdspace.work/plugins/cmds-achmage/) | [Releases](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases) | [Issues](https://github.com/CMDSPACE-DEV/CMDS-Achmage/issues).
Report versions, OS, provider **type**, command, sanitized error and a synthetic note. Do not post keys, full diagnostic environment, private prompts, OAuth codes or real account data.
Developed by **Yohan Koo (CMDSPACE)**, https://cmdspace.work, together with **Professor Changhyun Ahn**. See [collaboration](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/docs/CMDS-COLLABORATION.md).
Forked from [Smart Composer](https://github.com/glowingjade/obsidian-smart-composer). Preserve [LINEAGE.md](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/LINEAGE.md), [LICENSE](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/LICENSE). The MIT license retains **Copyright (c) 2024 Heesu Suh**; rebranding does not replace upstream attribution.

## Verification scope
The 1.1.0 `manifest.json`, command registration, `SettingsTabRoot.tsx`, `ChatSection.tsx`, `RAGSection.tsx`, `McpSection.tsx`, settings schema, research register and relevant runtime/provenance reports were inspected. Source evidence is not a fresh functional test of every provider/tool/OS. No current UI screenshot is claimed or fabricated, no code changed, and no credentials or private source notes were sent for these documentation checks.

## Appendix: the ship of Theseus
Repairing a ship means replacing one plank after another. When the mast, deck, bow and stern have all changed, is it still the same ship?
CMDS Achmage also began with someone else's ship: an existing Obsidian AI plugin. Daily work revealed places where note writing, research and editing could flow better. The project extended provider connections, folder reading and the place where editing happens.
**Its final shape is not predetermined.** Better methods discovered through daily use become the next changes. This is a ship under way, not a declaration that every possible feature is finished. Its upstream license and attribution remain part of that journey.
