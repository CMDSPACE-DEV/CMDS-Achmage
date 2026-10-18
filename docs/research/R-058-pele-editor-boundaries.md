# R-058: Pele renderer versus semantic diagram editor

## Status

- **Partially verified / Mandatory for Pele integration**
- Baseline: CMDS Achmage 1.3.1, 6ff66ee67b016f7a4197d187264d80f537c10596.
- Investigation: 2026-10-18. Pele upstream package manifest reports 1.6.0.
- This PR changes documentation only.

## Research Question

Can Pele replace the new Excalidraw generation path while retaining semantic
visual editing for all supported diagram types?

## Sources Inspected

- https://pele.run/api
- https://pele.run/compatibility
- https://pele.run/security
- https://github.com/obsidianmd/pele (core API and diagram model types)
- ArtifactTaskAdapter.ts, MarkdownCodeComponent.tsx, ObsidianMarkdown.tsx.
- R-003, R-008, R-031 and R-055.

## Verified Findings

Pele renders Mermaid source to SVG. Its mount/update/parse APIs and zoom/pan
behavior do not provide lossless serialization, element editing or position
persistence. The core parsed-model registry accepts models created by parse;
this does not make those models a portable save format.

The source has 33 diagram type modules, including an information-only type.
Excalidraw generation in CMDS Achmage has a separate typed draft/write path and
uses ExcalidrawAutomate when available. Swapping a renderer alone cannot replace
that contract.

R-055 specifies a strict single-file bundle budget with little headroom. Full
Pele import feasibility must be measured before a production dependency change.

## Decision And Implementation Contract

See [the delivery contract](../pele-editor-plan.md): 39 one-purpose PRs, portable
Mermaid source, separate layout metadata, lossless type-specific editing, safe
vault writes, and existing Excalidraw file preservation. This new user-approved
direction supersedes R-003's recommendation to prioritize Excalidraw integration
for future diagram creation; it does not rewrite that report's historical facts.

## Inferences And Unknowns

The editor needs a semantic adapter per grammar. Mapping a rendered SVG to source
is not proven by the public renderer API. No all-type editing prototype, bundle
qualification, real Obsidian test or native Obsidian Pele integration is claimed.

## Test And Release Gates

Measure full and per-type production bundle contributions; preserve the budget.
For every editor adapter, prove lossless unchanged-source round trips and edited
semantic round trips. Require pointer, keyboard, undo, conflict and reload tests.

## Security And Privacy

Only public code, synthetic examples and the user-approved feature scope are
recorded. No credentials, account identifiers or private vault text are included.
