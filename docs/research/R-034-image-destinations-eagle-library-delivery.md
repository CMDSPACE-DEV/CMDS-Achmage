# R-034: Image destinations, Eagle library delivery, and the CMDS Eagle hand-off

## Status

- **Verified** against a running Eagle 4.0.0 (2026-09-13): folder listing,
  import into a named folder of the open library, item polling, original-file
  link. Library switching is covered by unit tests that mirror the protocol
  CMDS Eagle established; a live cross-library import was not exercised to
  avoid flipping the author's open library during the session.
- **Relationship to R-001**: keeps the R2 cloud path through the CMDS Eagle
  plugin's active provider. Adds the direct Eagle library path R-001 §13.5
  left open.
- **Origin**: a community fork (roughian, 2026-09-12) added "Eagle library
  (direct)" and "CMDS Eagle (sync)" destinations on top of Smart Composer
  Achmage 1.3. That fork's Eagle client, path builder, and delivery shape were
  ported; the CMDS Eagle bridge it expects (`uploadImageToEagle`) does not
  exist in CMDS Eagle 1.8.2, so the hand-off here reads that plugin's library
  profiles and cloud provider instead of calling a private import.

## Request

Generated images should be able to land in Eagle, in a chosen library and
folder, with the path configurable, and the note should link to them.

## Model

`settings.imageGeneration.destination`: `ask` (default) · `vault` · `eagle` ·
`cloud`. The task adapter still saves every image to the vault output folder
first (R-001 recoverability), then pre-runs the configured destination and
records the result on the artifact. The task card decides what goes into the
note: Keep, Insert embed, **Send to Eagle / Insert Eagle link**, CMDS R2.

`settings.imageGeneration.eagle` (`EagleTarget`):

| field | meaning |
| --- | --- |
| `apiBaseUrl` | Eagle local API, default `http://localhost:41595` |
| `libraryPath` | `.library` bundle to import into; empty = the open library |
| `folderId` / `folderPath` | folder inside that library; empty = root, or the CMDS Eagle profile default for that library |
| `linkStyle` | `vault-embed` (default) · `original-file` (`[![alt](file://…)](eagle://item/id)`) · `deeplink` |
| `removeVaultCopy` | trash the vault file after an Eagle link is inserted (never for vault-embed) |
| `tags` | comma-separated Eagle tags; the prompt becomes the item annotation |

### Library switching

Eagle opens one library at a time. When the target differs from the open one
the client POSTs `/api/library/switch`, polls `/api/library/info` until the
target reports open (the API server drops for a few hundred milliseconds
mid-switch; poll errors are swallowed), imports, and switches back in
`finally`. The folder picker in settings uses the same switch-list-restore
sequence so folders of a non-open library can be chosen.

### CMDS Eagle integration

When the CMDS Eagle plugin is installed its remembered libraries (name, path,
default folder) are merged into the library dropdown, its API URL and default
library are read, and its active cloud provider still serves the `cloud`
destination. Nothing private in that plugin is called.

## Not changed

Image generation itself (GPT Plan only in this PR), the `awaiting-destination`
flow, and the R2 path.

## Follow-ups (planned stages)

1. Image models via Gemini and Grok API keys with a shared `ImageGenerator`
   interface (fork commit `d48b662` is the reference). Grok has no
   subscription API; Gemini Plan image generation is unverified.
2. Prompt template slots for illustration / infographic presets in image mode.
3. Clipboard image → Markdown structure (list, table, Mermaid) via the vision
   path that already accepts pasted images.
