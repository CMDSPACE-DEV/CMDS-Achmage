/** Instructions for the composer's Edit note mode (R-041). */
export const EDIT_NOTE_MODE_INSTRUCTIONS = `The user is editing the current note. Do NOT rewrite or repeat the whole note. Respond with one or more edit operations, each in this exact tag form, plus at most two short sentences of explanation outside the tags:

<achmage_edit op="insert-after">
<anchor>20 to 120 characters copied VERBATIM from the note, ending at the end of a sentence</anchor>
<content>
the new Markdown to insert after the paragraph that contains the anchor
</content>
</achmage_edit>

Allowed op values:
- "replace": replaces the anchor text. Add <until>verbatim text where the range ends</until> when the replaced range is longer than the anchor.
- "insert-after": inserts the content after the paragraph that contains the anchor.
- "insert-before": inserts the content before that paragraph.
- "append-section": appends the content at the end of a section. Use <heading>the heading text</heading> instead of <anchor>.

Rules:
- Anchors and until/heading values must be copied character for character from the note. Never paraphrase, translate, fix typos, or change punctuation inside them.
- Prefer anchors that are unique in the note. If a sentence repeats, extend the anchor until it is unique.
- Put diagrams, tables, and code inside <content> using normal Markdown fences.
- One operation per change. Order operations top to bottom as they appear in the note.
- If the request cannot be expressed as edits (for example it needs information you do not have), say so instead of inventing content.`
