# R-035: Image generation suite — providers, prompt templates, clipboard image to Markdown

## Status

- **Verified** (2026-09-13, author's vault): catalog merge on settings load,
  image-only models hidden from chat pickers, template picker in image mode,
  four clipboard commands registered. Unit coverage for the generator
  interface, byte sniffing, model resolution, template application, and the
  vision prompt builders.
- **Not exercised live**: a Gemini or Grok generation (needs API keys on this
  machine) and an end-to-end clipboard conversion through the Claude Plan
  path — see "Known limits".
- **Relationship**: extends R-001 (Plan image generation) and R-034 (Eagle
  delivery). Reference implementation for the providers: roughian's fork,
  commit `d48b662`.

## Request

Image generation should work with the subscription models where possible and
with Gemini and Grok as well; image mode should offer prompt template slots for
recurring illustration and infographic briefs; and a captured or copied image
should be turned into Markdown structure (list, table, diagram) instead of
being pasted as a picture.

## Providers

`ImageGenerator` (`src/core/image/image-generator.ts`) is the one interface the
task adapter needs. Three providers implement it:

| provider | route | notes |
| --- | --- | --- |
| OpenAI Codex (`openai-plan`) | subscription OAuth, existing | `gpt-5.6-sol / terra / luna`, PNG |
| Gemini (`gemini`) | **API key** | `gemini-3.1-flash-image`, `gemini-3-pro-image` (+ lite / 2.5 recognised), 3:2, 1K/2K by quality |
| xAI (`xai`) | **API key** | `grok-imagine-image-2.0`, JPEG; no reference images |

Grok has no subscription API, and the Gemini Plan route in this plugin is a
chat transport, so both run on API keys entered in Providers. The catalog is
merged into `chatModels` on every settings load (insert-if-absent, no schema
bump) and `getProviderCapabilities().imageOnly` hides those entries from the
chat, inline, and analysis pickers. The adapter sniffs the returned bytes so a
JPEG from Grok is saved as `.jpg` with the right MIME type.

`resolveImageGenerationModel` prefers **Settings → Image model** and falls
back to the chat model only when it can generate images; the composer's image
button follows the same rule, so an image-only model never has to be selected
as the chat model.

## Prompt template slots

`imageGeneration.promptTemplates` holds `{id, name, prompt}` entries with five
CMDS defaults (illustration, infographic, concept diagram, icon set,
photorealistic). In image mode the composer shows a picker; the chosen prompt
is prepended to the brief after the request is parsed, so batch counts and
follow-up phrasing still parse from the user's own text. Settings offer add,
edit, remove, and reset.

## Clipboard image → Markdown

Four commands read the system clipboard through `navigator.clipboard.read()`,
send the image with a mode-specific system prompt to the analysis model
(Settings → Clipboard image analysis model, default the chat model), unwrap a
stray outer code fence, and insert the Markdown at the cursor. The current
line is passed as a hint. The image is never written to the vault.

## Known limits

- Image input requires a model whose transport forwards `image_url` content
  parts. The OpenAI, Gemini, and xAI API-key providers do; whether the Claude
  Plan CLI transport does is unverified in this session. Pick an API-key
  vision model in Settings → Clipboard image analysis model if a Plan model
  returns text-only errors.
- `navigator.clipboard.read()` needs the Obsidian window focused; the command
  reports "No image on the clipboard" otherwise.
- Reference images for Gemini generation (fork feature) are not ported.
