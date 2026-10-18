# R-060: Source-mapped diagram editor qualification

- Status: Partially verified; Mandatory for the Pele editor series.
- Baseline: ab18f96; Pele 1.6.0; upstream source 458322a5b8abb1ae57ddf127c32017ab9fb14a92.
- Date: 2026-10-18. Windows/Node 25.9.0; CI Node 20.
- Scope: persistence, AI proposal boundary, common board and 32 grammar adapters.
- User correction: publish all 39 review PRs despite the measured size failure.
  Merge/release decisions stay with the owner and developers. This supersedes
  R-059's pause instruction, not its measured byte count.

## Evidence and experiments
Source schemas and examples were checked against the installed package and the
upstream tests under tests/<type>. Unknown syntax is preserved byte-for-byte;
edits patch captured ranges and parse before committing. Source and layout are
stored separately; layout applies to the authoring board, not Pele SVG geometry.

Core tests: 4 suites / 11 tests and typecheck passed. Adapter Jest: 36 suites /
75 tests passed. Initial real-parser/render contract passed 19/32 fixtures.
The failed checks exposed three conditions: JSON.stringify omits Map contents,
the detector calls treeview 'treeView', and actors in usecase use parentheses.
The next experiment changes semantic comparison to serialize Maps/Sets and fixes
that alias and actor syntax. No claim that a mock test proves actual parsing.

The Map-aware rerun passed 28/32. Remaining confirmed conditions: detector
aliases quadrantChart/gitGraph; block labels require quoting for the Korean
fixture; requirement name test is a reserved token. The next experiment changes
those aliases and uses quoted labels and a non-reserved requirement ID.

The next run passed 31/32. The block fixture also rejects the unquoted label
End (not just the Korean label); the earlier diagnosis was incomplete. Both
block labels and insertion labels are now quoted, and field captures preserve
their quotes. Retry changes only this grammar fixture/capture boundary.
Full integrated Jest before this fixture correction: 174 suites / 991 tests
passed, including real DOM event tests with a mocked renderer. Typecheck passed.

Actual Pele 1.6.0 parse/render/edit/undo/insertion contracts now pass **32/32**
fixtures. This validates the documented samples, not every syntax form. Lint
then identified import grouping, unnecessary escapes and explicit string
conversion requirements; fixes preserve behavior and the gate is rerun.
The lint autofixer narrowed DOM fixtures to Element instead of HTMLElement;
explicit querySelector generics restore the intended test types before retry.

## Release boundaries
All adapters provide a bounded source-mapped subset. Complete rendered-SVG drag
handles, arbitrary nesting, coordinate-to-domain transformations (for example
Gantt resizing) and target-app interaction qualification remain incomplete.
Do not call these features complete solely because a preview renders.

Exact prior measured bundle record:
research:rr-20638be978a7deba03447d7a238f7ad0:3fb1b3476572929dd34c53132ee5199f04a728b16c34e85033e607d621109a68.

No private vault data, credentials or account identifiers recorded.

## Final integrated validation

- Full Jest: 174 suites / 991 tests passed; after final corrections, diagram tests: 38 suites / 79 tests passed.
- Actual Pele 1.6.0 parser/render/edit contracts: 32/32 passed.
- Typecheck passed; lint: 0 errors, 22 warnings. Changed-surface Obsidian lint passed.
- Production build and tokenizer verification passed. Bundle budget FAILED: 5,635,233 bytes / 4,940,000 allowed. Publication proceeds as Draft under explicit user instruction; merge/release readiness is separate.
