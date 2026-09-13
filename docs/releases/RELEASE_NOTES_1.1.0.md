# CMDS Achmage 1.1.0

## Edit notes without an apply model, generate images from anywhere, see what the model is doing

This release turns the chat into a note editor that patches in place, gives
image generation five entry points with Eagle delivery, and shows live
progress while a reply is generated.

## What changed

### Editing
- **Edit note mode** (pen icon in the composer): replies come as edit cards
  anchored to sentences that already exist in the note. **Apply** and
  **Apply all** patch the note deterministically — exact → normalized → fuzzy
  anchor matching, undoable, no second model call.
- **Apply changes** on whole-document or abbreviated blocks: paragraph-level
  patching that keeps frontmatter and touches only what differs.
- **Inline edit → Image**: the ⇧⌘K panel gains an Output switch. Image jobs
  run inside the panel with progress, preview, and Insert / Send to Eagle /
  Copy / Keep — no chat sidebar needed.

### Images
- **Five doors**: composer image mode, `Generate image (text to image)…`,
  `Generate image from selection`, `Generate image from current note`
  (condensed into an editable brief), `Generate image from clipboard image
  (image to image)…`. Editor context menu entries included.
- **Providers**: GPT Plan (subscription) plus Gemini and grok-imagine image
  models via API key, behind one generator interface. Reference images for
  GPT Plan and Gemini.
- **Prompt templates** per purpose, **always-on image instructions**, and
  **Copy image** everywhere (optional auto-copy).
- **Eagle library delivery**: choose library, folder, note link style, tags;
  reuses CMDS Eagle's remembered libraries and cloud upload when installed.
- **Text cards**: render selected text as a CMDS-styled PNG, no model call.
- **Clipboard image → Markdown**: list, table, or Mermaid diagram at the
  cursor.

### Chat
- **Live response progress** pinned to the top of the message area: phase
  (waiting / thinking / calling tools / writing) with seconds, model, total
  elapsed, token estimates that switch to provider usage, tool-call status.
  Disappears when the turn settles.

### Appearance and settings
- Follows your Obsidian theme by default; presets (including the original
  Neon Lime Console), accent and glow dials, Style Settings fine tuning.
- Settings footer with version and CMDSPACE links; vault folder
  autocompletion on folder inputs; upstream donation block removed.

### Fixes
- The committed stale `main.js` that hid theme following is gone and CI
  refuses tracked build artifacts.
- Card previews drag as `![[embed]]` instead of an `app://` URL; image
  filenames come from the user's brief; blank output folder falls back to
  Obsidian's attachment folder.
- Writing settings tab crash and the floating "Plan" tooltip.

## Compatibility
- Settings gain fields with safe defaults; no migration is required beyond
  the 1.0.3 vault-safety changes. Desktop only, as before.
