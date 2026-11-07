# Shared editor review boundary
The command opens a source editor, an authoring board and a Pele preview.
Cards expose grammar fields; changing them patches only captured source ranges.
Dragging cards and arrow keys update separate layout coordinates. These coordinates
organize the authoring board; they do not override Pele's SVG layout. Semantic
field changes, statement ordering, indenting, insertion and removal reparse before
commit. Undo/redo includes source and coordinates. Escape/pointer cancel does not
commit a drag. The initial adapter catalog is supplied by the following PRs.

Save uses the configured artifact folder and an atomic snapshot comparison.
AI proposals preview separately and require acceptance before save. Closing
cancels requests and disposes preview observers. Unsupported syntax stays in the
source. Parser acceptance alone does not prove semantic equivalence; every type
PR lists the recognized subset and remaining direct manipulation work.

Release gaps: real Obsidian mouse/keyboard/IME/popout smoke, accessibility review,
complex nested source fixtures, and bundle qualification. This is reviewable Draft
code, not a claim of complete diagram-specific drag handles in the rendered SVG.
