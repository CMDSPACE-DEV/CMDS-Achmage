# R-037: Text-as-image cards, default template per purpose, clipboard hand-off

## Status

- **Verified** (2026-09-13, author's vault): `Render selection as image card`
  produced a 1200 px PNG of a Korean sentence with word wrap, caption (note
  title) and brand mark, saved it to the image output folder, inserted the
  embed after the selection, and left a PNG on the system clipboard.

## Request

Selected text should become an image; each kind of image job should have its
own default template; generated images should land on the clipboard.

## Decisions

- **Text card is drawn locally** (canvas, no model call). It is a different
  product from "Generate image from selection" (which asks a model to depict
  the text); both stay. Styles: CMDS dark (pink bar), CMDS light (green bar),
  plain. Width, brand mark, and embed insertion are settings.
- **`templateByPurpose`** maps each entry point (composer, text, selection,
  note, clipboard) to a template id. The modal and the composer pre-select it;
  the per-job picker still wins. Default: note → CMDS illustration, others none.
- **Clipboard**: `copyToClipboard` copies every generated image right after
  the vault save (Electron `nativeImage`); the task card also has **Copy
  image**. Text cards are always copied.

## Notes

- Word wrap breaks long CJK runs by character, so mixed Korean/English text
  fills the width evenly.
- Filenames derived from the text are sanitized and trailing dots trimmed.
