# R-041: Edit note mode with deterministic Apply (no apply model)

## Status

- **Verified** (2026-09-13, author's vault): Edit note request through the
  composer → two `achmage_edit` cards (insert-after a table, replace the
  conclusion) → Apply → note updated in the open editor, both cards "Applied".
- Unit coverage: anchor matching (exact / normalized / fuzzy / ambiguous /
  not-found), all four operations, blank-line hygiene, tag parsing incl.
  streaming.

## Why

Smart Composer's Cursor-style "apply" ran a second model to merge chat text
into the note. That was slow, non-deterministic, and awkward, and CMDS Achmage
had removed it. The replacement moves the placement decision to generation
time and makes application pure string work.

## Contract

Composer **Edit note** mode (pen icon) sets `editNoteMode` on the user
message. `PromptGenerator` then injects `<edit_mode_instructions>`: answer with
`<achmage_edit op="…">` blocks carrying `<anchor>` (verbatim note text),
optional `<until>` / `<heading>`, and `<content>`; explanation outside the
tags stays short. Operations: `replace`, `insert-after`, `insert-before`,
`append-section`.

`parseTagContents` (parse5, same path as `<smtcmp_block>`) yields
`achmage_edit` blocks with `complete` = closing tag seen, so cards render
while streaming but Apply enables only when the block is whole.

## Apply

`applyEditOp(text, op)`:

1. `locateAnchor`: exact substring → whitespace/curly-quote normalized (with
   an index map back to the source) → fuzzy over sentence segments and
   adjacent pairs (max of bigram Dice and Levenshtein similarity, threshold
   0.75, runner-up margin 0.08). Multiple hits → `ambiguous`, never a guess.
2. Range: `replace` = anchor, or anchor…`until`; `insert-after` = end of the
   paragraph containing the anchor; `insert-before` = its start;
   `append-section` = end of the heading's section (next heading of equal or
   higher level).
3. `padBlock` keeps exactly one blank line on each side.

`applyEditToFile` prefers the open editor (`replaceRange`, undoable, cursor
kept) and falls back to `vault.process`. Failures show the reason on the card
with **Insert at cursor instead** and **Retry**.

## Not done

- Apply-all per message (cards apply individually, top to bottom is safest).
- Manual anchor picking UI for the ambiguous case (the fallback is insert at
  cursor).
