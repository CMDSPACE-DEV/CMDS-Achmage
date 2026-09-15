[![English](https://img.shields.io/badge/English-README-134538)](README.md) [![한국어](https://img.shields.io/badge/한국어-README-E985A2)](README.ko.md)

# CMDS Achmage
Work with AI inside Obsidian: supply note context, review edits, research sources, and create images without leaving your writing flow.

**Version 1.2.0 | Available in Community Plugins.**

Obsidian 1.11.4+ | Desktop only.

## What it does
- Chat with notes, selections and folders; review which context is included.
- Review anchored edits, inline changes, and checkpointed long-document drafts.
- Connect research APIs and MCP tools under an explicit execution policy.
- Generate images, render local text cards, and optionally deliver assets to Eagle.

## Install and first use
**Community:** Settings → Community plugins → Browse → **CMDS Achmage** → Install → Enable.

**Manual:** Download `main.js`, `manifest.json`, and `styles.css` from [release 1.2.0](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases/tag/1.2.0), place them in `<vault>/.obsidian/plugins/cmds-achmage/`, reload Obsidian, and enable. Back up existing settings; do not copy another user’s `data.json`.

In **Advanced → Providers/Models**, configure an API provider and chat model. Review **Writing → Include current file** and set **MCP → Tool execution → Per-tool approvals** before connecting tools. Run **Open chat**, mention a sample note with `@`, and ask one narrow question.

## Read the manual
- [English user guide](docs/guide.md)
- [한국어 사용설명서](docs/guide.ko.md)
- [Web manual](https://apps.cmdspace.work/plugins/cmds-achmage/)
- [Product family](https://apps.cmdspace.work/plugins/)
- [Issues and support](https://github.com/CMDSPACE-DEV/CMDS-Achmage/issues)

## Privacy and limits
API usage and subscriptions are separate. Plan authentication is experimental, not a guaranteed official third-party entitlement. MCP defaults to **Full auto**, including enabled write/delete tools without an Allow prompt. Active-note inclusion defaults on. Review these settings before sending private material.

## Development
```sh
npm ci
npm run type:check
npm run lint:check
npm test
npm run build
```
Build the plugin assets for local development.

## Credits and license
Developed by **Yohan Koo (CMDSPACE)**, https://cmdspace.work, together with **Professor Changhyun Ahn**.

Forked from [Smart Composer](https://github.com/glowingjade/obsidian-smart-composer), originally by **Heesu Suh**. See [LINEAGE.md](LINEAGE.md) for the inherited names/versions and [collaboration history](docs/CMDS-COLLABORATION.md). **MIT**; [LICENSE](LICENSE) retains **Copyright (c) 2024 Heesu Suh**. The original copyright and permission notice remain in force.
