# R-042: Paragraph-level Apply for whole and abbreviated note blocks

## Status

- **Verified** (2026-09-13): with the edit-mode system prompt in place the
  model answered a "add one sentence to each of three sections" request with
  three `Replace` cards; Apply produced exactly the three intended
  sentence-level diffs on a copy of the author's note. Unit coverage: full
  rewrite with one changed paragraph, abbreviated block with placeholders,
  deletion between matches, no-match append.

## Why

The first live attempt at Edit note mode came back as a whole-document
`<smtcmp_block>`: the default system prompt (rules 5–7) tells the model to
answer edits with such blocks, which overrode the edit contract carried in a
user message. Two fixes:

1. **Edit note mode swaps the system prompt.** The `<smtcmp_block>` rules are
   gone in that mode; the achmage_edit contract is the system message.
2. **Whole/abbreviated blocks get an Apply too.** Any markdown block in an
   assistant reply shows **Apply changes to <note>**. It aligns the block to
   the active note paragraph by paragraph and changes only what differs.

## Paragraph patch

- Paragraphs split at blank lines; heading lines and
  `<!-- ... existing content ... -->` placeholders are paragraphs of their
  own; fenced code blocks stay whole.
- Placeholders split the block into chunks. Each chunk is aligned to the note
  with LCS on normalized text. Unmatched block paragraphs are inserted after
  the previous match (or before the first); note paragraphs are deleted only
  when they sit strictly between two matches of the same chunk, so text a
  placeholder stands for is never removed.
- Frontmatter on either side is ignored and preserved. Hunks apply bottom-up
  through the open editor (undoable) or `vault.process`.
- A block with no matching paragraph is appended at the end with a notice.
