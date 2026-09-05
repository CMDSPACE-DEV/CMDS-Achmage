# R-030: Opt-in Obsidian theme following, Style Settings surface, and Fable/Astra model registration

## Status

- **Verified** for the repository-source findings, the Claude CLI model alias,
  and the Codex CLI rejection of `gpt-6-astra`.
- **Partially verified** for `gpt-6-astra` on the Plan path: the model is
  recognized by the ChatGPT-account backend but the installed Codex CLI is too
  old to dispatch it, so an end-to-end run is still pending.
- **Relationship to R-005**: this report **narrows, and does not revoke**,
  R-005 section 18.1. The owned dual skin stays the default. R-005 remains
  Verified and Mandatory.

## Executive Summary

R-005 approved two owned chat skins (Hallym Conversation Studio for light,
CMDS AI Operator Console for dark) and defined success as screenshots staying
materially identical when the surrounding Obsidian theme changes. A user
running a custom light theme reported the chat pane reads as foreign against
their vault.

Inspection shows the shipped implementation is not the strongly isolated skin
R-005 describes. It is a hybrid: `styles.css` consumes Obsidian variables in
many places (`--text-normal` 31x, `--background-modifier-border` 49x,
`--interactive-accent` 23x) while the two skin blocks override both the owned
`--ach-*` tokens and a subset of Obsidian variables. The result follows the
host theme structurally but not chromatically, which is what reads as
"almost matching but wrong".

Separately, `appearance.skinMode` has existed since migration 19_to_20 as
`z.literal('follow-obsidian')` and **no renderer has ever read it**.
`ChatView.ensureMountSurface` picks the skin purely from the `theme-dark` body
class. The settings file has therefore been claiming theme-following behavior
that the product never implemented.

This report keeps R-005's default and makes the dormant setting real as an
explicit opt-in, plus adds a Style Settings surface so appearance tuning does
not require further code changes.

## Research Question

Can the chat pane follow the user's Obsidian theme without discarding the
approved dual-skin identity, and what is the correct migration for the
pre-existing `skinMode` field?

### In scope

- Chat shell skin selection and token derivation.
- `appearance.skinMode` schema, migration, and settings UI.
- A Style Settings manifest for accent and shape tokens.
- Registering Claude Fable and GPT-6 Astra in the chat model catalog.

### Out of scope

- The inline edit Shadow DOM skin (`InlineEditController`,
  `resolveInlineSkin`). It carries its own hardcoded CSS strings and R-005
  section 14.6 treats it as a separate isolation surface. Deferred.
- Any change to R-005's default appearance.

## Baseline And Reproducibility

- Repository: `CMDSPACE-DEV/CMDS-Achmage`, branch
  `feat/theme-follow-and-new-models`, from `main` at `af4cb0a`.
- Version at time of research: `2.6.6-test.3`.
- Node 20.13.1 (matches `.nvmrc` and the CI `setup-node` pin).
- Baseline before any edit: `type:check` clean, `lint:check` 0 errors /
  10 warnings, `npm test` 650/652 passing.

## Sources Inspected

### Repository source

- `src/ChatView.tsx` lines 79-95 (skin assignment).
- `src/settings/schema/setting.types.ts` (the `appearance` object).
- `src/settings/schema/migrations/19_to_20.ts` (origin of the literal).
- `styles.css` (base `.smtcmp-shell` block and both skin blocks).
- `src/core/llm/native/ClaudeAgentProvider.ts` `normalizeClaudeModel`.
- `src/core/llm/openaiCodexProvider.ts` `isGpt56Model`,
  `normalizeGpt56Effort`.
- `src/utils/llm/price-calculator.ts` (missing pricing returns `null`).

### First-party external sources

- Installed Claude CLI `--help`: `--model` documents `'fable'` as an alias and
  `'claude-fable-5'` as a full name.
- Anthropic Claude Fable product page and AWS Bedrock model cards for
  `claude-fable-5` / `claude-fable-5-1`, pricing 10 USD in / 50 USD out per
  million tokens.
- OpenAI model documentation for `gpt-6-astra`.

## Evidence Ledger

| ID | Evidence | Method | Result |
| --- | --- | --- | --- |
| E-1 | `skinMode` is never read | `grep skinMode src/` | Only tests, the schema, and 19_to_20 reference it |
| E-2 | Skin chosen from body class | `src/ChatView.tsx:85-88` | `theme-dark` decides the skin, settings ignored |
| E-3 | Hybrid theming | Token census of `styles.css` | Obsidian vars used alongside `--ach-*` |
| E-4 | Claude CLI knows Fable | `claude --help` | `'fable'` alias documented |
| E-5 | Astra exists but CLI is stale | `codex exec --model gpt-6-astra` vs a control string | Astra returns "requires a newer version of Codex"; the control returns "not supported when using Codex with a ChatGPT account" |
| E-6 | Missing pricing is safe | `price-calculator.ts:20-30` | Returns `null`, cost display is skipped |

E-5 is the load-bearing one: sending a deliberately fake model id as a control
separated "upgrade the CLI" from "this account can never use it". Without the
control both cases are indistinguishable HTTP 400s.

## Verified Findings

### 1. The isolation R-005 specifies was never fully implemented

The shipped skin is hardened, not isolated, exactly as R-005 section 14 warned
would happen without a Shadow DOM boundary. The user-visible complaint is a
predicted consequence of that gap, not a regression.

### 2. `appearance.skinMode` is a dead setting

Introduced 19_to_20, typed as a one-value literal, read by nothing. Any user
inspecting `data.json` would conclude the plugin follows their theme.

### 3. The Claude Plan path already supports Fable

`normalizeClaudeModel` maps opus/sonnet/haiku and passes anything else
through, so a Fable entry reaches the CLI intact. The CLI advertises the
alias.

### 4. The Codex Plan path is blocked on the local CLI, not on the account

See E-5. `normalizeGpt56Effort` passes efforts through unchanged for
non-`gpt-5.6` models, so no code blocks Astra; only the installed binary does.

### 5. New default models do not reach existing vaults

`DEFAULT_CHAT_MODELS` seeds fresh installs only. An existing vault keeps its
own stored `chatModels` array, so a catalog addition is invisible there until a
migration inserts it. `27_to_28` established the upsert pattern for exactly
this reason. Verified by loading the branch in a live vault: the four new
entries were absent until the migration was extended.

### 6. A third skin must reimplement every "base hides, skin shows" rule

Intersecting the selector sets scoped to the two owned skins yields the rules a
new skin cannot inherit. Two surfaced:
`.smtcmp-chat-user-input-container:focus-within` (no base rule exists, so a
focused composer loses its outline) and the persona badge (base sets
`display: none`, each skin reveals its own variant). Value overrides degrade to
a sane default when omitted; "base hides it, skin shows it" fails silently.

## Decision And Implementation Contract

1. Default stays `studio-console`. R-005's dual skin is untouched for every
   existing and new install.
2. `appearance.skinMode` becomes
   `z.enum(['studio-console', 'follow-obsidian'])` defaulting to
   `studio-console`.
3. Migration 29 -> 30 rewrites the stored `'follow-obsidian'` literal to
   `'studio-console'`. This is behavior preserving: every vault was already
   rendering the owned skin. An upgrade must not silently change appearance.
4. A third skin `data-skin='obsidian'` maps only the color tokens to theme
   variables and deliberately does not redefine Obsidian's own variables, so
   they inherit. Spacing, radius, and type scale stay owned so an unfamiliar
   theme cannot break layout.
5. Style Settings exposes the accent color and the shape/density tokens, so
   further appearance requests do not require a release.
6. Fable and Astra are registered on both the API and Plan paths. Astra's Plan
   entry ships `enable: false`, matching the existing convention for
   `claude-sonnet-5 (plan)` and `gemini-3-flash-preview (plan)`.
7. Astra pricing is omitted rather than guessed; the calculator degrades to
   `null`.
8. Migration 29 -> 30 also inserts the four new catalog entries, insert-if-
   absent so a user's own entry or `enable` choice is never overwritten.
9. The theme-following skin supplies its own focus ring and persona-badge
   rules, derived from theme variables and the real `theme-dark` state.

## Expected Change Surface

- `src/constants.ts`, `src/core/llm/native/ClaudeAgentProvider.ts`
- `src/settings/schema/setting.types.ts`,
  `src/settings/schema/migrations/29_to_30.ts`, `.../index.ts`
- `src/ChatView.tsx`, `src/utils/chat/chatSkin.ts`
- `src/components/settings/sections/AppearanceSection.tsx`,
  `src/components/settings/SettingsTabRoot.tsx`
- `styles.css`

## Test And Release Gates

- `npm run type:check`, `npm run lint:check`, `npm test`, `npm run build`.
- New unit tests: `chatSkin.test.ts`, `29_to_30.test.ts`.
- Manual: toggle the skin in both a stock and a custom theme, confirm the
  default is unchanged on upgrade, and confirm Style Settings renders the
  manifest.

## Known Unknowns And Deferred Decisions

- End-to-end `gpt-6-astra (plan)` remains unverified until the Codex CLI is
  upgraded. The catalog entry is disabled until then.
- Inline edit Shadow DOM skin still ignores the new preference.
- The two pre-existing `McpOAuthProvider` test failures are unrelated to this
  work and are tracked separately.

## Security And Privacy

No credential, token, or vault content is read or stored by this change. The
new setting is a local enum. No research artifact records account identifiers.

## Change Log

- 2026-09-05: Initial report. Narrows R-005 section 18.1 with an opt-in escape
  hatch; does not supersede it.
