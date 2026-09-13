# R-033: Appearance presets, pinned skins, and Style Settings fine tuning

## Status

- **Verified** in the author's vault (2026-09-13): live DOM attributes and
  computed accent per preset on both the chat pane and the inline panel.
- **Relationship to R-030**: keeps its default (follow the theme) and its
  boundary (only plugin-owned surfaces). Adds choice on top of it.
- **Relationship to R-005**: the two owned skins stay as designed. The original
  inline look that #12 replaced with the accent-driven version (lime `#b6ff00`
  on the dark console with the teal secondary and strong halos) returns as an
  explicit preset, not as a default.

## Request

After the theme-following fix (#27) the author asked for three things: choose
the look in the plugin settings, fine-tune it in Style Settings, and keep the
neon colors reachable. R-030 exposed one dropdown with two values and a single
Style Settings accent. That could not express "dark console with lime" or
"theme colors but glowing".

## Model

Three independent axes stored in `settings.appearance`:

| Axis | Values | What it drives |
| --- | --- | --- |
| `skinMode` | `follow-obsidian` (default), `studio-console`, `operator-console`, `conversation-studio` | surfaces, borders, text; `data-skin` resolves to `obsidian` / `cmds-dark` / `hallym-light` |
| `accentPreset` | `skin` (default), `cmds-pink`, `neon-lime`, `hallym-blue`, `signal-teal`, `graphite` | `--ach-preset-accent`, `--ach-preset-on-action`, `--ach-preset-motion` |
| `glow` | `skin` (default), `off`, `soft`, `neon` | `--ach-glow-level`, a multiplier on every blur-type shadow |

Named combinations are exposed as a **Preset** dropdown; editing any axis
afterwards reads back as **Custom**. The table lives in
`src/utils/chat/chatSkin.ts` (`APPEARANCE_PRESETS`) so a new preset is one
entry, no CSS.

### Precedence

Every skin block now reads each color as
`var(--ach-ss-*, var(--ach-preset-*, <skin default>))`:

1. Style Settings (`--ach-ss-accent`, `--ach-ss-on-action`, `--ach-ss-heading`,
   `--ach-ss-motion`, `--ach-ss-glow`, plus the existing radius and type sizes)
2. Accent preset / glow level from the plugin settings
3. The base skin's own default (the theme accent when following Obsidian)

`data-accent='skin'` and `data-glow='skin'` define nothing, so the skin default
shows through. Style Settings only writes a variable once the user changes it,
so untouched values never shadow a preset.

### Glow

Blur shadows were fixed pixel values scattered over both stylesheets. They are
now `calc(<px> * var(--ach-glow, 1))`. Skin defaults: theme-following 0.35,
Conversation Studio 0.6, Operator Console 1. `off` = 0, `soft` = 0.6,
`neon` = 1.7. Neon additionally draws halos on the primary button, the composer
focus ring, and the user bubble, which the theme-following and light skins do
not draw on their own. The two hard-coded teal halos (`#00b5ad29`,
`rgba(0,181,173,.16)`) became `color-mix` on `--ach-motion`, so the motion
color follows the preset too.

### Transport to the inline widget

The chat pane sets `data-skin`, `data-accent`, `data-glow` on its shell. The
plugin mirrors the same three onto `<body>` (`data-ach-skin-mode`,
`data-ach-accent`, `data-ach-glow`); the inline widget's existing
`MutationObserver` reads them and sets the same attributes on its Shadow host.
Both stylesheets carry identical preset and glow blocks.

## Storage and migration

New fields use zod `.catch` defaults, so an older `data.json` parses without a
migration and `skinMode` values from R-030 keep their meaning. No schema bump:
#26 already claims `30 → 31`, and a second migration in flight would collide
for no functional gain.

## Not changed

- Default look, default accent, and the R-030 boundary.
- Headings, callouts, and tables inside assistant replies keep the active
  theme's styling when following Obsidian.

## Follow-ups

- A user-defined accent picker inside the plugin settings would duplicate what
  Style Settings does; left to Style Settings on purpose.
- Preset thumbnails in the settings tab. Text labels carry the hex codes for
  now.
