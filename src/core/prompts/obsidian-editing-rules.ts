/**
 * CMDS Obsidian editing rules.
 *
 * Hardcoded on purpose: the plugin must not depend on a file inside the user's
 * vault to produce vault-shaped markdown. The published reference at
 * OBSIDIAN_EDITING_RULES_DOC_URL explains where each rule comes from.
 *
 * Every rule here fixes an observed rendering or parsing failure in Obsidian,
 * not a style preference. Default GitHub-flavoured markdown breaks in specific,
 * repeatable ways that this prompt heads off.
 */
export const OBSIDIAN_EDITING_RULES_DOC_URL =
  'https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/docs/obsidian-editing-rules.md'

export const OBSIDIAN_EDITING_RULES = `# Obsidian markdown rules

Write every markdown file so it renders correctly in Obsidian. These are parser
requirements, not style preferences.

## Indentation: two different rules in one file

- YAML frontmatter indents with TWO SPACES. YAML does not accept tabs; a tab
  makes the whole frontmatter fail to parse and the Properties panel go blank.
- The markdown body indents with TABS. Nested list items use one tab per level.

## The frontmatter is a metadata region, not the top of the document

If a note opens with \`---\`, everything through the closing \`---\` is YAML
metadata. The editable body starts on the line after it.

- "The top of the document", "the beginning", and "add this first" all mean the
  first line of the BODY, below the closing \`---\`. Never insert above the
  opening \`---\`; content placed there detaches the block, and Obsidian then
  shows no properties at all and renders the YAML as plain text.
- Never edit frontmatter fields unless the user asks for that specifically. Do
  not rewrite the title, add tags, or touch dates while making a body edit.
- When a note has no frontmatter and the user asks to add one, it goes at the
  very first line with nothing above it, not even a blank line.

## Frontmatter field rules

- Wrap wikilinks in quotes: "[[Note]]", never bare [[Note]].
- Dates use ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:mm.
- Arrays use hyphen + space entries on their own lines.
- Quote any value containing : # [ ] { } , & * ? | > ! % @ or spanning more than
  a short phrase. YAML forbids ": " and " #" inside an unquoted scalar; leaving
  them bare silently corrupts every field that follows.
- Tags must contain a non-numeric character. Never put a bare number in tags. In
  the body, write a number reference like \`#22\` in backticks so it is not read
  as a tag.

## Blank lines: tight by default

Do not put a blank line after a heading, between a heading and its subheading,
between a heading and a list, or between a list and the heading that follows it.

Three places REQUIRE a blank line:

- Between two consecutive callouts. Without it the second callout is swallowed
  into the first and both render as one box.
- Before a table whose preceding line is a sentence or a list item. Without it
  Obsidian does not start a table block and prints the raw pipe characters.
- Around a --- horizontal rule.

## Tables start at column zero

An indented table does not render; Obsidian prints the raw pipes. A table can
never be nested inside a list item, even with a blank line before it. If a list
item needs a table, promote that item to a heading or paragraph and start the
table at column zero.

## Links

- Use [[wikilinks]] for vault-internal references, not markdown links.
- A filename prefix (emoji, number, or any other marker) is part of the
  filename. Never drop it. Linking [[Note Title]] when the file is
  [[<prefix> Note Title]] creates an empty placeholder file when clicked. Use
  the aliased form [[<prefix> Note Title|Note Title]] to hide the prefix in the
  display text while keeping the target exact.
- Do not invent a wikilink target. Link only to notes you have confirmed exist.

## Mermaid

- Quote every node and edge label. Unquoted Korean text, spaces, or punctuation
  break the parser.
- Never start a label with [/ — Mermaid reads it as a trapezoid shape token and
  throws a lexical error. Quote the label instead.
- No markdown inside labels: no **bold**, no [[wikilinks]], no backticks.`
