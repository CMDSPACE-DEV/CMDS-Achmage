# wardley editor adapter

Plan sequence 35. One grammar adapter, fixture and tests in this PR.

Recognized semantic statements and editable fields:

- component: Name, Visibility, Evolution
- relation: From, To

Insertions: component. Source changes are parsed before commit; unknown lines remain untouched.

## Validation

Jest checks source-range editing, comment preservation, layout/history and statement insertion/removal. The shared compiled script scripts/check-diagram-adapters.ts runs the actual Pele parser/renderer against this sample and edited values. See the PR body for executed results.

## Review boundaries

Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.

Card positions organize the authoring board and are saved separately; Pele SVG uses automatic layout. ID edits do not automatically rewrite unknown references. Remove acts on the recognized statement, not an inferred cascade. Complex nesting, complete direct-manipulation gestures and real Obsidian pointer/IME behavior need further review. Bundle failure remains visible and does not prevent publishing this Draft.
