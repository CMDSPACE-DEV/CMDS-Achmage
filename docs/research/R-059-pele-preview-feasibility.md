# R-059: Pele preview integration and bundle feasibility

## Status

- Evidence status: **Partially verified**
- Planning use: **Mandatory for Pele preview**
- Baseline: 1.3.1, 6ff66ee67b016f7a4197d187264d80f537c10596; design c9c2f91
- Environment: Windows, Node 25.9.0, npm 11.12.1, Pele 1.6.0.
- Investigation date: 2026-10-18.

## Research question

Can a locally bundled Pele preview fit the current single-file release contract?

## Sources and implementation

Inspected R-055, R-058, esbuild.config.mjs, scripts/check-bundle-budget.mjs
and the installed pele@1.6.0 package declarations and exports.
First-party sources: https://pele.run and https://github.com/obsidianmd/pele.

The command opens an explicit source/preview modal. It uses lazy initialization,
the host SVG sanitizer, disabled links/images, source/output/edge bounds and
Pele zoom controls. It clears replaced output, ignores superseded asynchronous
loads and destroys renderer observers/handlers on close and plugin unload.
No persistence, AI generation, semantic editing or menu replacement is claimed.

## Experiments

- Initial type check rejected an incomplete Mounted test double. Changed evidence:
  the package's Mounted declaration requires source/result/error/zoom/update/refresh.
  The fixture now supplies the complete interface; production code is unchanged.
- Type check passed after the complete fixture. Three lifecycle tests passed.
- Formatting/lint passed with 0 errors and 18 pre-existing warnings.
- Production compilation completed, but the unchanged bundle gate rejected
  **5,594,658 bytes** against **4,940,000 bytes** (654,658 over).
  This branch contains the design PR, not the independent inline CSS fix.
  The latter saves 20,176 bytes on the same baseline, far less than this excess;
  the combined build is not measured here.
- Because the bundle gate exits first, the following tokenizer compiled check
  was not run on this branch. This is a failed integration experiment, not a
  passing production build.
- Runtime research baseline:
  research:rr-16f152ba8f11b353667cfcf90a0c8bba:47af6cc299e00b5fbf66e072f8604b376ebe8d459c6625d955ced6cfdf00c70b.

## Conclusion and unresolved decision

The planned in-process all-types renderer cannot currently be released within
the existing budget. Deferring import initialization does not remove Pele from
the single CJS file. Keep this PR Draft; persistence/AI/editor/menu delivery
depends on resolving the packaging boundary first. The remaining 36 planned
PRs are not implemented.

Alternatives require an explicit product/architecture choice: investigate at
least 655 KB of additional lossless savings (no guarantee), move diagram editing
to an independently installed companion plugin with a documented integration
contract, or revise the existing size/Sync compatibility requirement. Do not
silently reduce diagram coverage or raise the numeric check.

## Release gate

Keep this prototype Draft until the unchanged 4,940,000-byte gate passes and
real Obsidian sanitizer/theme/zoom/popout behavior is checked. A mock lifecycle
test does not validate the host sanitizer or upstream renderer.
Do not raise the ceiling or substitute compressed executable code.

## Security and privacy

Only synthetic source is used. No credentials or private vault content recorded.
