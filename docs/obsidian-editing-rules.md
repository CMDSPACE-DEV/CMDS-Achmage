# CMDS Obsidian editing rules

Turning on **Settings → CMDS Achmage → Writing → CMDS Obsidian editing rules**
adds the conventions below to every chat and inline edit. The text is compiled
into the plugin (`src/core/prompts/obsidian-editing-rules.ts`), so it works
without any file in your vault.

Each rule fixes an observed failure in Obsidian, not a style preference. Models
write GitHub-flavoured markdown by default, and GitHub-flavoured markdown breaks
in Obsidian in specific, repeatable ways.

## 1. Two indentation rules in one file

| Region | Indent with | Why |
|---|---|---|
| YAML frontmatter | two spaces | YAML does not accept tabs. One tab and the entire frontmatter fails to parse, leaving the Properties panel blank. |
| Markdown body | tab | Matches Obsidian's own folding and outline behaviour for nested lists. |

```yaml
---
aliases:
  - Example Alias
author:
  - "[[Author Name]]"
---
```

```markdown
- First level
	- Second level (one tab)
		- Third level (two tabs)
```

## 2. Frontmatter

- Quote wikilinks: `"[[Note]]"`, never bare `[[Note]]`.
- Dates in ISO 8601: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`.
- Arrays as hyphen + space entries on their own lines.
- Quote any value containing `:` `#` `[` `]` `{` `}` `,` `&` `*` `?` `|` `>` `!` `%` `@`, or longer than a short phrase.

That last one is the one that bites hardest. YAML 1.2 forbids `": "` and `" #"`
inside an unquoted scalar. A description written without quotes does not fail
loudly; it truncates and corrupts every field after it.

```yaml
description: "Operations: 3 main + 6 assistants"   # safe
description: Operations: 3 main + 6 assistants     # breaks the Properties panel
```

Tags must contain a non-numeric character. Obsidian will not render a numeric
tag, so never harvest a body reference like `#22` into `tags:`, and write such
references in backticks in the body so they are not parsed as tag attempts.

## 3. Blank lines: tight by default

No blank line after a heading, between a heading and its subheading, between a
heading and a list, or between a list and the heading that follows.

Three places require one:

| Place | What happens without it |
|---|---|
| Between consecutive callouts | The second callout is parsed as content of the first. Both render as one box and the `[!quote]` label leaks into the text. |
| Before a table whose previous line is a sentence or list item | Obsidian never starts a table block and prints the raw `\| cell \|` text. |
| Around a `---` rule | The paragraph break does not happen. |

A table directly after a heading is fine without a blank line, because the
heading already closes the block.

## 4. Tables start at column zero

An indented table does not render, and a blank line before it does not help. A
table cannot be nested inside a list item at all. If a list item needs a table,
promote it to a heading or paragraph and start the table at column zero.

## 5. Links

Use `[[wikilinks]]` for vault-internal references rather than markdown links.

If your vault prefixes filenames (with an emoji, a number, or anything else),
that prefix is part of the filename. Writing `[[Note Title]]` when the file is
`[[<emoji> Note Title]]` makes Obsidian treat it as a missing note and create an
empty placeholder file in your inbox the moment someone clicks it. To hide the
emoji in the visible text, use the aliased form `[[<emoji> Note Title|Note Title]]`,
which keeps the target exact.

The rules also tell the model not to invent link targets, since a hallucinated
wikilink has the same placeholder-file effect.

## 6. Mermaid

Obsidian's mermaid parser is sensitive to non-Latin text, spaces, and slashes.

- Quote every node and edge label.
- Never begin a label with `[/`. Mermaid reads it as a trapezoid shape token and throws a lexical error. Quote the label instead.
- No markdown inside labels: no bold, no wikilinks, no backticks.

```
C[/query skill]      ✗ parsed as a trapezoid
C["/query skill"]    ✓
D[**Bold**]          ✗ renders broken
D["Bold"]            ✓ style with a class instead
```

## Where these came from

They are the working conventions of the CMDS vault, each written down after a
real render broke. Turning the setting off changes nothing else about how the
plugin writes; it only stops sending these instructions.
