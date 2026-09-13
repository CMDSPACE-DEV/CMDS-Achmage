# R-036: Image entry points (text, note, selection, clipboard), image-to-image, folder autocompletion

## Status

- **Verified** (2026-09-13, author's vault): commands registered, Generate
  image modal opens with template/model/count/reference controls, jobs land
  in the chat image queue. Unit coverage for the request content builders.
- **Not exercised live**: an actual image-to-image generation (would spend a
  Plan generation); the Codex `input_image` shape follows roughian's fork,
  which ran it.

## Request

"Where is the image generation menu?" — it lived only behind the wand icon in
the chat composer. Needed: text → image, Markdown note → image, and image →
image, reachable from the command palette and the editor menu.

## One queue, many doors

Every entry point produces an `ImageGenerationSubmission` (brief, template,
count, model, reference images, target note, origin) and hands it to
`ChatView.generateImage`, which queues background tasks in the current
conversation exactly like composer image mode. The task cards, destinations
(vault / Eagle / R2), and progress UI are therefore identical.

| door | how | brief |
| --- | --- | --- |
| Composer image mode | wand icon, template picker | typed text; attached images become references |
| `Generate image (text to image)…` | command → modal | typed in the modal |
| `Generate image from selection` | command / editor menu | selection as-is when short; condensed by the chat model when long |
| `Generate image from current note` | command / editor menu | note body condensed by the chat model into a 60–120 word brief |
| `Generate image from clipboard image (image to image)…` | command → modal | clipboard image pre-attached as reference |

The modal always opens for review before anything is queued, so a synthesized
brief can be edited. Reference images can be added from the clipboard or from
any image file in the vault.

## Image-to-image

References are stored once per batch under `.smtcmp_json_db/references/` and
the task payload carries paths, not bytes. Providers: GPT Plan sends
`input_image` parts before the `input_text` brief; Gemini sends `inlineData`
parts; grok-imagine rejects the job with a clear message (text-to-image only).

## Folder autocompletion

`ObsidianTextInput` accepts `folderSuggest={app}`, attaching an
`AbstractInputSuggest<TFolder>` that filters vault folders as you type and
fires an `input` event on selection so React state updates. Applied to the
document draft folder and the image output folder.

## Follow-ups

- Reference images in the composer are stored even when the model is
  grok-imagine; the adapter fails the job with the provider message. A
  pre-check in the composer would be friendlier.
- The "Locate origin" action on cards has no message to jump to for modal /
  command jobs.
