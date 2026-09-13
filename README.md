# CMDS Achmage

[![English](https://img.shields.io/badge/🇬🇧_English-current-2ea44f)](README.md)
[![한국어](https://img.shields.io/badge/🇰🇷_한국어-README.ko.md-blue)](README.ko.md)

A plugin for using AI agents as real working tools inside Obsidian. Built by
[CMDSPACE](https://cmdspace.work) together with Professor Changhyun Ahn.

> **Desktop only.** CMDS Achmage relies on desktop-level capabilities (MCP
> connections, native runtimes, shell execution, the system clipboard), so it
> does not run on Obsidian Mobile.

## What it can do

- **Note-grounded AI chat** — mention notes and folders in the chat box to pull
  them into the conversation. Only the material you are actually discussing is
  sent, instead of scanning the whole vault.
- **Folder reading and search (RAG)** — mention a whole folder and it is read in
  one of three ways (automatic, focused, or exhaustive). Embedding search and
  rerank search are combined, and **folder mentions work even without an
  embedding API key.**
- **Edit note mode with deterministic Apply** — ask for changes to the current
  note and the reply comes back as edit cards anchored to sentences that already
  exist in the note. **Apply** (or **Apply all**) patches the note in place with
  plain string matching: no second model call, undoable with ⌘Z.
- **Inline editing** — select just the part of a note you want to change and edit
  it in place. The same panel can produce an image instead of text.
- **Document-scale editing** — a resumable, checkpointed job for long documents
  that need several places changed at once.
- **Image generation, five doors** — chat composer image mode, text → image,
  selection → image, note → image (the chat model condenses the note into a
  brief you can edit), and clipboard image → image. GPT Plan (subscription),
  Gemini and Grok (API key). Prompt template slots per purpose plus always-on
  instructions that apply to every image.
- **Eagle library delivery** — send generated images to an
  [Eagle](https://eagle.cool) library and folder of your choice, with a link
  style for the note; the CMDS Eagle plugin's libraries and cloud upload are
  reused when it is installed.
- **Clipboard image → Markdown** — turn a screenshot into a Markdown list,
  table, or Mermaid diagram at the cursor.
- **Text cards** — render selected text as a CMDS-styled PNG (quote card) with
  no model call; saved, copied to the clipboard, embedded.
- **Plan connections** — an experimental feature that borrows the authentication
  of subscription accounts (Claude Pro/Max, Gemini, GPT-family) so you can use them
  without an API key, with a per-model reasoning-effort setting in the chat input.
- **Research — built-in MCP tools** — the plugin calls academic and public
  databases directly. See below.
- **MCP tool connections** — connect your own external MCP servers; only
  reviewed tools are exposed.
- **Background tasks** — long-running work runs in the background while you keep
  writing.
- **Appearance** — follows your Obsidian theme by default; presets, accent and
  glow dials, and Style Settings fine tuning when you want the CMDS look.

## Built-in MCP research tools

The research feature is **a bundle of official databases connected over MCP**.
Rather than scraping the web, it calls each institution's official API, so it
returns metadata with a clear source. Turn on only what you need and provide each
service's own API key; keys are stored separately.

- **International academic**: Web of Science Starter, Crossref + Retraction Watch,
  OpenAlex, PubMed, Europe PMC
- **Korean academic**: KCI, ScienceON, RISS Linked Data
- **Korean public / legal**: Korean Law MCP, OpenDART, NTIS, KOSIS MCP
- **News / web**: NAVER API HUB Search

## Installation

### Community plugins

In Obsidian, go to **Settings → Community plugins → Browse**, search for
`CMDS Achmage`, install it, and enable it.

### Manual installation

Download `main.js`, `manifest.json`, and `styles.css` from the
[Releases page](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases), place them
in your vault's `.obsidian/plugins/cmds-achmage/` folder, and restart Obsidian.

## Usage

1. **Enable the plugin**, then open the chat view with the ribbon icon (wand) or
   the command **"CMDS Achmage: Open chat"**.
2. **Add a model**: open **Settings → CMDS Achmage**, add a provider with its API
   key, or set up Plan mode (see below). Optionally add an embedding model for
   vector search.
3. **Chat with your notes**: in the chat input, type `@` to mention a note or
   folder, write your question, and send. Mentioned files become the context for
   the answer.
4. **Edit the current note**: turn on the pen icon (**Edit note**) in the
   composer and describe the change. Each reply card has **Apply**; two or more
   cards add **Apply all**. Whole-document blocks also get **Apply changes**,
   which patches only the paragraphs that differ.
5. **Inline edit**: select text and press ⇧⌘K. **Output: Text edit** rewrites the
   selection; **Output: Image** generates an image from your prompt (or from the
   selected text when the prompt is empty) and shows progress, a preview, and
   Insert / Send to Eagle / Copy / Keep right in the panel.
6. **Index the vault** (for embedding search): run
   **"CMDS Achmage: Rebuild entire vault index"** once, then
   **"CMDS Achmage: Update index for modified files"** as your notes change.

All commands are available from the command palette (Ctrl/Cmd-P), prefixed with
"CMDS Achmage".

### Commands

| Command | What it does |
| --- | --- |
| Open chat | Opens the chat pane |
| Add selection to chat | Adds the selected block as context |
| Inline edit selection (⇧⌘K) | In-place edit of the selection; Output switch for image |
| Generate image (text to image)… | Modal: brief, template, model, count, reference images |
| Generate image from selection | Selection as brief (long text is condensed first) |
| Generate image from current note | Note condensed into a brief you can edit |
| Generate image from clipboard image (image to image)… | Clipboard image attached as reference |
| Render selection as image card (text as image) | PNG quote card, saved + copied + embedded |
| Convert clipboard image to Markdown (auto structure) / list / table / Mermaid diagram | Vision → Markdown at the cursor |
| Review document edit jobs | Resume or review document-scale jobs |
| Rebuild entire vault index / Update index for modified files | Embedding index |

The editor context menu offers Inline edit, Generate image from selection /
note, and Render selection as image card.

### Image generation

Every generated image is saved to the vault output folder first. **Settings →
CMDS Achmage → Writing** controls the rest:

- **Image model** — GPT Plan models draw on your subscription; Gemini and Grok
  image models use that provider's API key. Image-only models never appear in
  the chat model picker.
- **Image destination** — ask on the task card, keep in the vault, send to an
  Eagle library, or upload through the CMDS Eagle plugin's cloud provider. For
  Eagle: library (Eagle's history plus CMDS Eagle's remembered libraries),
  folder, note link style (vault embed / Eagle original file / deep link),
  tags, and whether to drop the vault copy.
- **Image prompt templates** — slots offered in image mode (CMDS illustration,
  infographic, concept diagram, icon set, photorealistic, or your own).
  **Default template per purpose** picks one for each entry point.
- **Always-on image instructions** — appended to every image prompt, from every
  entry point (e.g. "No Korean words or any text inside the image").
- **Copy generated images to the clipboard**, **Text card** style, width, brand
  mark, and **Clipboard image analysis model**.

GPT Plan and Gemini image models accept reference images (image to image);
grok-imagine is text-to-image only.

### Appearance

**Settings → CMDS Achmage → Appearance** offers one-click presets (Follow
Obsidian theme, CMDS Studio / Console, CMDS Operator Console, Neon Lime Console,
Hallym Conversation Studio, Theme colors with neon glow) and three dials: **Base
skin**, **Accent**, **Glow**. Exact colors and sizes live in the
[Style Settings](https://github.com/mgmeyers/obsidian-style-settings) plugin
under the **CMDS Achmage** section. Nothing here restyles the editor, other
panes, or other plugins.

## Before using Plan mode

- Plan connections are **an experimental feature that uses subscription
  authentication and a private backend.** If a provider's policy or backend
  changes, it may stop without notice, and it will not automatically fall back to
  another model.
- Each provider recommends using API authentication with third-party tools. Check
  your own account's policy and risk guidance before connecting.
- Back up your plugin folder and `data.json` before updating.
- Regular models used with an API key keep working independently of this feature.

## Credits

Developed by Yohan Koo ([CMDSPACE](https://cmdspace.work),
[CMDSPACE-DEV](https://github.com/CMDSPACE-DEV)) together with Professor
Changhyun Ahn. The collaboration model is described in
[docs/CMDS-COLLABORATION.md](docs/CMDS-COLLABORATION.md).

## Provenance

This plugin started as a fork of the Obsidian community plugin
[Smart Composer](https://github.com/glowingjade/obsidian-smart-composer). The
lineage of the names and versions it inherited is recorded in
[LINEAGE.md](LINEAGE.md). Design decisions live in `docs/research/` as numbered
reports (R-001 …).

## License

MIT
