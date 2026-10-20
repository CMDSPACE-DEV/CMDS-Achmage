# Diagram creation and editing
Use **New diagram** or the editor context-menu **Create diagram with Pele**.
Choose a diagram type and load its sample, or ask for a proposal. The chat
commands /diagram, /pele and /mermaid open the same editor with the request
prefilled. A proposal needs acceptance; saving is another explicit action.

Use field controls to change recognized semantic content. Drag cards or use
arrow keys to arrange the authoring board. Earlier/Later change statement order;
Indent/Outdent change hierarchy where the grammar supports it. Invalid syntax
does not become a committed edit. Undo/Redo includes source and positions.
The Pele preview uses automatic SVG layout; card arrangement is separate.

Save a new document to the configured artifact folder with a filename.
Reopen that Markdown document and run **Open diagram editor**. Source and layout
are saved atomically. If another editor changed the file, reopen rather than
overwriting it. The Mermaid source remains readable without this plugin.

Existing Excalidraw files and explicit /excalidraw requests retain their path.
Nothing is automatically converted or removed.

## Maintainer release checklist
This is a Draft review series. All 32 types have a source-mapped adapter with
documented grammar subsets, not complete arbitrary Mermaid editing. See
docs/pele-adapters for each supported field and limitation. Actual SVG handles,
complex nested grammar interaction, live provider calls, Obsidian pointer/IME/
popout and bundle qualification remain separate checks. CI size failure is
expected under the unchanged budget; do not hide it or merge the series as one
large PR. Merge prerequisites and retarget each branch in order.
