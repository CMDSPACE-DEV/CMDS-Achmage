# Pele diagram editing: delivery contract

## Intent / 도입 의도

CMDS Achmage should generate editable diagrams without requiring an Excalidraw
installation. Mermaid source remains portable; Pele supplies the preview.
Visual editing is a CMDS Achmage feature, not a capability claimed for Pele.

신규 다이어그램 생성 경로를 Mermaid 원문과 Pele 미리보기 중심으로 전환한다.
사용자는 모든 도표 유형에서 위치뿐 아니라 내용도 시각적으로 수정하기를
요청했다. 기존 Excalidraw 파일은 보존하고 자동 변환하지 않는다.

This document is a delivery contract, not a claim that the editor is implemented.
Do not replace the existing generation menu until the replacement is qualified.

## One purpose per PR

Each row below is one independently reviewable PR. Tests and documentation for
that purpose belong in the same PR. Do not combine this series with #41 or #43.
PR titles describe the capability; bodies describe the trigger, previous/resulting
behavior, dependency PRs, tests actually run and remaining release gates.

The sequence numbers are planning IDs, not GitHub PR numbers.

| Sequence | Purpose | Dependencies |
| --- | --- | --- |
| 01 | Fix inline style-element community review error and prevent recurrence | none |
| 02 | Record this editor contract and support matrix | none |
| 03 | Pele source/preview surface, zoom and errors | 02; bundle feasibility |
| 04 | Portable diagram document persistence and conflict detection | 03 |
| 05 | Provider-neutral AI generation and revision with preview before save | 04 |
| 06 | Shared selection, pointer/keyboard editing and undo/redo | 04 |
| 07–38 | One semantic editor adapter per diagram type, listed below | 06 |
| 39 | Switch the default creation menu and publish the user guide | 05, all 07–38 |

Implement types in sequence. Rebase a dependent PR onto main after its prerequisite
merges so reviewers do not see the same diff twice. Keep an incomplete feature
Draft. Do not open empty placeholders or mark source-text editing as drag support.
Merge, version bumps, tags and release publication are separate maintainer actions.

## Document and editing boundary

- The canonical semantic content is a Mermaid fenced code block in Markdown.
- A separate, versioned `achmage-diagram-layout` fenced JSON block stores a
  document ID, diagram ID, source fingerprint and positions keyed by stable
  element IDs. It is plugin-owned metadata, never a new meaning for user YAML.
- A plugin-created document starts with one diagram. Existing general-purpose
  notes are not rewritten into this format. Source text and layout are saved in
  one vault operation, so half-written companion files cannot drift.
- Opening without the plugin must preserve readable Mermaid. Native rendering
  may use automatic layout; custom positions require the editor.
- Semantic changes update Mermaid source. Position-only changes update layout.
  Each edit reparses successfully before it becomes a committed history entry.
- Preserve comments, styling, frontmatter and unsupported statements. Editing
  adapters must use source ranges or a lossless representation, not wholesale
  serialization of Pele's parsed model (which is not a source-preserving API).
- A source fingerprint mismatch triggers reconciliation by stable ID. Never
  apply old coordinates to a new unrelated element; unmatched positions are
  ignored with a visible explanation and retained until a user saves.
- AI revision produces a reviewable proposal and does not commit automatically.
  Use the existing provider adapters; no new credentials or agent runtime.
- Use the user-configured artifact output folder. The model supplies a filename,
  not a destination folder. Existing-document saves compare the read snapshot
  atomically with the current text and reject intervening edits.
- Pointer movement is transient. Pointer-up commits one undo step; Escape or
  pointer cancellation restores the prior state. Keyboard equivalents are
  required. Undo/redo covers source and layout together.

## Renderer and release boundary

Pin the tested Pele package and lockfile. Bundle executable code locally; no CDN,
runtime code download, eval, compressed executable payload, or private Obsidian
API. Keep styles in styles.css, use the Obsidian SVG sanitizer, display errors as
text, and initially disable diagram links/images and arbitrary icon markup.
Dispose resize observers and handlers when the preview closes.

**Unresolved integration gate:** main.js has a 4,940,000-byte ceiling. R-055 records
only 42,693 bytes of release headroom. Pele's advertised gzip size is not its
contribution to this CommonJS bundle. Dynamic imports delay initialization but do
not split this single-file build. Measure actual output before proposing a
mergeable dependency change. Do not raise the ceiling or remove existing
providers/languages to pass. A larger architectural change needs its own PR and
an explicitly documented compatibility decision.

## Semantic support matrix

All rows initially have status **planned**, not implemented. Each type PR must
replace that status with the exact supported syntax, tested gestures, limits and
test references. Every type supports label/content editing, adding/removing its
semantic items, undo/redo and save/reopen where those operations are meaningful.

| Sequence | Type | Required direct manipulation |
| --- | --- | --- |
| 07 | flowchart | Move nodes; create/reconnect/remove edges; edit node labels/shapes |
| 08 | sequence | Reorder participants/messages; change sender/receiver and message text |
| 09 | mindmap | Reparent/reorder branches; edit labels |
| 10 | gantt | Move/resize tasks to change start/end dates; edit dependencies |
| 11 | class | Move classes; edit members and relationships |
| 12 | er | Move entities; edit attributes, relationships and cardinalities |
| 13 | state | Move states; edit transitions and nested states |
| 14 | kanban | Move/reorder cards across columns; edit metadata |
| 15 | timeline | Reorder periods/events; edit dates and labels |
| 16 | journey | Reorder tasks; edit actors and scores |
| 17 | xychart | Drag data values; edit series and axis labels |
| 18 | pie | Adjust slice values; edit labels |
| 19 | quadrant | Move points; edit quadrant names and axes |
| 20 | radar | Drag axis values; edit series |
| 21 | sankey | Reconnect flows; adjust their values and labels |
| 22 | treemap | Reparent nodes; adjust values and labels |
| 23 | architecture | Move groups/services; reconnect edges |
| 24 | c4 | Move elements/boundaries; edit relationships across supported C4 variants |
| 25 | block | Move/resize blocks in grid; reconnect links |
| 26 | requirement | Move requirements; edit fields and typed relationships |
| 27 | git | Edit/reorder valid commit/branch/merge operations; reject invalid histories |
| 28 | swimlane | Move items across lanes; edit ordering and connections |
| 29 | agentflow | Move agents/tasks; edit directed connections |
| 30 | treeview | Reparent/reorder nodes; edit labels |
| 31 | usecase | Move actors/cases; edit associations and boundaries |
| 32 | eventmodeling | Reorder events/commands; edit associations |
| 33 | ishikawa | Reparent causes; edit branches |
| 34 | venn | Edit sets/membership/values; keep geometry and membership distinct |
| 35 | wardley | Move components on evolution/value-chain axes; edit dependencies |
| 36 | cynefin | Move items between domains; edit content |
| 37 | packet | Resize/reorder fields within valid bit ranges; edit labels |
| 38 | railroad | Rearrange grammar nodes; edit sequence/choice/repetition safely |

The information-only `info` renderer has no editable domain model and is excluded.
Aliases and subgrammars belong to their type PR. Future Pele types do not silently
expand this release contract. Unsupported syntax remains readable and preserved;
disable only unsafe gestures and explain why. A type is not complete merely
because its SVG renders or the canvas can pan.

## Acceptance

For every type, include synthetic fixtures proving: source -> preview -> semantic
gesture -> valid changed source -> save/reopen; undo/redo; Korean labels; comments
and unsupported syntax preservation; invalid edits rejected without losing the
last good state; source/layout consistency after an external edit.

Common gates: type check, lint, related tests, production/bundle checks and the
community error gate. Actual Obsidian smoke covers light/dark themes, narrow panes,
keyboard/IME, popout windows, reload and original Excalidraw file preservation.
Report mocked, automated and real-app results separately.
