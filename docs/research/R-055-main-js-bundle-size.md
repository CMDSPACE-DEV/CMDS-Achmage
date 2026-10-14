# R-055: Single-File Bundle Size Reduction

## Phase-2 Decision — 1.3.1

This section supersedes the historical phase-1 release ordering and 4,900,000-byte proposal below. The owner selected **1.3.1 from main, independent of PR #43**, per `rig/briefs/1.3.1-scope.md`. Implementation started at `085353f` including #18 and was rebased onto `f193dfb` including Team PR #56; version remains unchanged in this lane.

The production build uses `scripts/tokenizer-brotli-plugin.mjs` to losslessly compress only the exact cl100k rank JSON with native Brotli (quality 11). The generated module uses native zlib and JSON.parse; it contains data, not compressed executable code. The existing dynamic import and cached encoder in `token.ts` defer decompression until the first token request. Development builds retain the original data. No charset change, language/provider removal, new asset, HTTP-client change, or dependency change is involved.

`npm run build` now runs `scripts/check-tokenizer-bundle.mjs` after the existing bundle guards. This compiles the actual token entry with the production plugin, verifies the entire restored JSON, compares exact token IDs/counts across six corpus cases, and instruments concurrent/repeated calls: **zero decodes at module load, exactly one after use**. It cleans up its temporary files even on failure. This package.json script addition makes the transform check part of CI and release builds.

The integrated artifact is **4,897,307 bytes**, down from the pre-compression size class above 5 MB. The initial #18-only candidate was 4,887,436 bytes; Team adds 9,871 bytes. The budget is **4,940,000 bytes**, with **42,693 bytes** of headroom and 102,693 bytes below the product limit. Adding 50 KB and rounding would reach 4,950,000, so the strict budget ceiling caps the rounded value at 4,940,000. It remains strictly below 4,950,000; the product requirement remains strictly below 5,000,000. Existing tokenizer and desktop-fetch guards remain intact. Re-measure after the Team and sweep integrations; report budget headroom below 20 KB to the integrator. If another reduction is needed, investigate other lossless data payloads/unused URL fallback with compatibility proof; reducing the language subset is forbidden.

Reproduction: `npm ci`, `npm run type:check`, `npm run lint:check`, `npm test -- --runInBand`, `npm run build`, `npm --prefix tools/obsidian-review ci`, `node tools/obsidian-review/check.mjs`. The phase-1 spike scripts below are historical artifacts on local commit `af426ef`, not production build machinery.

Verification on `f193dfb`: type check, lint (0 errors / 18 existing warnings), isolated community-review gate, full Jest (136 suites / 913 tests), production build and compiled-output checks pass; six corpus cases and all rank JSON match; first decode is approximately **2.21 ms**. The existing seven tokenizer Jest tests also pass against the compiled transformed module.

**Manual release gate remains open:** on the same real Obsidian installation compare plugin load time before/after, then open a long chat and confirm token usage appears. Automated module-load instrumentation does not prove actual Obsidian onload time or heap use. No secrets were recorded.

## Historical Phase-1 Investigation

All measurements and proposed sequencing below describe the original investigation only; the phase-2 decision above governs implementation.

## Status

- Evidence status: **Partially verified** — exact bundle measurements and compiled
  data/behavior checks verified; real Obsidian startup and final integration pending.
- Planning use: **Mandatory for #14 phase 2 and its bundle budget change**.
- Investigation date: 2026-10-14.
- Repository baseline: `66b9c59c5ea217ca1dd3ad8c074367e9292ed023`, `origin/main`, version `1.3.0`.
- Target release: `1.4.0`, after #18 and PR #43.
- Local branch: `spike/14-bundle-size`; **investigation/prototype only, no push or PR**.

## Executive Summary

Losslessly compressing only the exact `cl100k_base` rank JSON with Brotli reduces
the production-equivalent single-file bundle from **5,410,859 to 4,868,159 bytes**
(**542,700 bytes saved**). It preserves every tokenizer field and token ID checked,
all providers, all syntax-highlighting languages, PGlite, and the existing native
CLI boundary. It needs no downloaded data, extra release assets, or executable
code decompression: the embedded payload is JSON data, decoded with native zlib
and `JSON.parse` only.

**Recommend Brotli alone for phase 2**, with the existing lazy tokenizer boundary
and a **4,900,000-byte hard budget** (100,000 bytes below the strict 5,000,000-byte
Sync requirement). The measured candidate has 31,841 bytes of headroom against
that proposed budget, or 131,841 against the product threshold. Re-measure after
#18 and #43 before setting the final gate; this investigation is not qualification
of their eventual combined tree.

`charset: 'utf8'` saves another 33,114 bytes but is **not recommended in phase 2**
until the actual Obsidian loader is verified. An isolated native-URL experiment
shows about 290 KB of removable node-fetch compatibility weight; coordinate that
with #18 rather than introducing a competing fetch rewrite.

## Research Question

Which measured cuts can bring the Obsidian plugin's single `main.js` below
5,000,000 bytes while retaining all existing user features?

### In scope

- Production esbuild metafile attribution and installed dependency graph.
- Isolated build-option, tokenizer-data, URL-compatibility, and splitter probes.
- Compiled-output correctness, lazy initialization, and synthetic startup timing.
- Proposed phase-2 implementation and budget, with #18/#43 integration limits.

### Out of scope

- Shipping these experiment hooks, pushing a branch, opening a PR, or releasing.
- Removing languages/providers, approximating tokens, introducing remote assets.
- Editing other worktrees or changing shared build/dependency/version files.
- Replacing the official native CLI path with a bundled Claude Agent SDK.

## Baseline And Reproducibility

Workspace: `worktrees/issue-14`. Source and lockfile remain at the baseline above.
Installed versions include esbuild 0.17.3, js-tiktoken 1.0.15, node-fetch 2.7.0,
LangChain 0.3.37 / core 0.3.80 / textsplitters 0.1.0, and MCP SDK 1.29.0.

- Linux, Node **22.23.3**; recommended build also repeated with Node **20.20.2**,
  matching the release workflow's Node 20 major. Both produce **4,868,159 bytes**.
- `npm ci && npm run build`: baseline passes, **5,410,859 bytes**.
- `scripts/bundle-size-spike.mjs baseline` produces the **same byte count** using
  the original esbuild options. The harness reads those options rather than
  maintaining a second approximation. All outputs live in ignored
  `node_modules/.cache/bundle-size-spike/<variant>/`.
- Production `esbuild.config.mjs`, source code, dependency manifests, and budget
  script are unchanged. Only research and reproducible local harnesses are added.

Run representative experiments:

```bash
npm ci
npm run build
node scripts/bundle-size-spike.mjs baseline
node scripts/bundle-size-spike.mjs brotli
node scripts/bundle-startup-spike.mjs
npm test -- --runInBand --config node_modules/.cache/bundle-size-spike/brotli/jest.config.json
```

Every experiment writes `result.json`, `meta.json`, and `main.js` below its cache
directory. Applicable experiments also write compiled probe modules and a Jest
config that substitutes those modules into existing tests. The harness is local
research tooling; phase 2 should implement a small explicit production build
plugin, not copy its source-text configuration extraction.

## Sources Inspected

### Repository and installed source

- `esbuild.config.mjs`: CommonJS, one output, tree shaking/minification already on,
  browser default, Node builtins external, and PGlite process shim.
- `scripts/check-bundle-budget.mjs`: current 6.5 MiB limit, tokenizer and desktop
  node-fetch guards. R-008's historic 5.2 MiB ceiling is not the current gate.
- `src/utils/llm/token.ts` / `token.test.ts`: cached lazy encoder, exact-ID corpus.
- `src/main.ts`: onload registration, lazy database/RAG imports, Performance marks.
- `src/core/mcp/desktopFetch.ts` / `desktopFetch.test.ts`: streaming desktop fetch.
- `src/core/rag/{planRerank,exhaustiveFolderRead}.ts` and
  `src/database/modules/vector/VectorManager.ts`: Markdown chunking consumers.
- `node_modules/js-tiktoken/dist/ranks/cl100k_base.js` and package exports.
- `node_modules/node-fetch/lib/index.js`: `Url.URL || whatwgUrl.URL` fallback.
- `node_modules/@langchain/textsplitters/dist/text_splitter.js`, core document
  transformers, and installed package manifests/lockfile.
- `.github/workflows/{ci,release}.yml`: Node 20 and exact three-asset release set.
- Mandatory background: R-003, R-008, R-024 and the community-review runbook.

### First-party external sources

- [esbuild API: code splitting](https://esbuild.github.io/api/#splitting),
  [charset](https://esbuild.github.io/api/#charset),
  [legal comments](https://esbuild.github.io/api/#legal-comments),
  [drop](https://esbuild.github.io/api/#drop) — accessed 2026-10-14.
- Obsidian developer release documentation was checked, but the installed app's
  proprietary loader implementation was not available on the checked local app
  surfaces. Its exact `main.js` decoding behavior is **not verified here**.

The installed esbuild 0.17.3 behavior and repository asset contract take precedence
for this release over possibilities described by newer tooling documentation.

## Ranked Bundle Attribution

The metafile has **one output**, `main.js`, entry point `src/main.ts`. There are no
separate lazy entry chunks to rank. The following tables rank contributions to that
single output; input attribution excludes some generated wrappers and legal text,
so sums are not identical to the file size.

### By package

| Package / area              | Bytes attributed to output |
| --------------------------- | -------------------------: |
| `js-tiktoken`               |                  1,095,316 |
| `Project source`            |                    813,103 |
| `refractor`                 |                    592,419 |
| `@electric-sql/pglite`      |                    457,517 |
| `tr46`                      |                    264,976 |
| `@google/genai`             |                    245,938 |
| `ajv`                       |                    211,960 |
| `zod`                       |                    134,783 |
| `react-dom`                 |                    131,146 |
| `parse5`                    |                    130,709 |
| `@langchain/core`           |                    114,787 |
| `openai`                    |                    109,486 |
| `@anthropic-ai/sdk`         |                    107,878 |
| `langsmith`                 |                    105,716 |
| `lexical`                   |                    104,252 |
| `drizzle-orm`               |                     92,216 |
| `@modelcontextprotocol/sdk` |                     82,121 |
| `entities`                  |                     53,679 |
| `react-syntax-highlighter`  |                     42,162 |
| `@tanstack/query-core`      |                     34,450 |
| `semver`                    |                     25,847 |
| `zod-to-json-schema`        |                     22,910 |
| `whatwg-url`                |                     22,854 |
| `minimatch`                 |                     19,886 |
| `lucide-react`              |                     19,525 |
| `node-fetch`                |                     19,274 |

### By input module (largest contributors to the entry bundle)

| Input module                                                  | Bytes attributed to output |
| ------------------------------------------------------------- | -------------------------: |
| `node_modules/js-tiktoken/dist/ranks/cl100k_base.js`          |                  1,090,853 |
| `node_modules/@electric-sql/pglite/dist/postgres.js`          |                    395,285 |
| `node_modules/tr46/lib/mappingTable.json`                     |                    260,058 |
| `node_modules/@google/genai/dist/web/index.mjs`               |                    245,938 |
| `node_modules/react-dom/cjs/react-dom.production.min.js`      |                    130,769 |
| `node_modules/lexical/Lexical.prod.mjs`                       |                    100,553 |
| `node_modules/langsmith/dist/client.js`                       |                     67,378 |
| `src/core/inline/InlineEditController.ts`                     |                     67,273 |
| `node_modules/zod/v3/types.js`                                |                     50,724 |
| `node_modules/parse5/dist/tokenizer/index.js`                 |                     49,590 |
| `node_modules/entities/lib/esm/generated/decode-data-html.js` |                     47,210 |
| `node_modules/parse5/dist/parser/index.js`                    |                     46,732 |
| `node_modules/refractor/lang/sqf.js`                          |                     33,479 |
| `node_modules/@langchain/core/dist/runnables/base.js`         |                     27,719 |
| `node_modules/@electric-sql/pglite/dist/chunk-IZM3GSNN.js`    |                     19,938 |

### Duplicate-package conclusions

- Installed OpenAI 4.104.0 (LangChain dependency) and 6.16.0 both exist in the
  lockfile, but only the latter contributes output. Removing installed-only SDKs
  does not automatically reduce `main.js`.
- Installed ajv 6 and 8 both exist, but the emitted ajv surface is version 8.
- Both Zod v3 and v4 modules from one package contribute; they serve different
  consumer APIs (including MCP), so blindly deduplicating them is not safe.
- `groq-sdk` and `@anthropic-ai/claude-agent-sdk` contribute **zero output bytes**.
  Keep the latter absent per R-024; no Agent SDK bundling is proposed.
- PGlite (~457 KB) and Drizzle (~92 KB) provide active database behavior and must
  remain. Syntax highlighting (~592 KB refractor) retains every language per R-008.
- `builtin-modules` and ESLint plugins are build/development-only. #18 changes to
  them affect dependency health, not runtime bundle savings. lodash.isequal adds
  ~10.6 KB and is a smaller #18 opportunity.

## Measured Prototype Results

Independent experiments are measured from the same baseline unless their name
explicitly combines changes. Savings are actual output file bytes, not package
sizes or gzip transfer estimates.

| Experiment               | main.js bytes | Savings vs baseline |
| ------------------------ | ------------: | ------------------: |
| `brotli-utf8-native-url` |     4,544,771 |             866,088 |
| `brotli-native-url`      |     4,577,885 |             832,974 |
| `brotli-utf8`            |     4,835,045 |             575,814 |
| `brotli`                 |     4,868,159 |             542,700 |
| `deflate`                |     4,988,074 |             422,785 |
| `native-url`             |     5,120,585 |             290,274 |
| `splitter-no-runnable`   |     5,335,065 |              75,794 |
| `utf8`                   |     5,377,745 |              33,114 |
| `legal-none`             |     5,391,371 |              19,488 |
| `drop-console`           |     5,396,936 |              13,923 |
| `textsplitters-direct`   |     5,410,805 |                  54 |
| `module-first`           |     5,410,859 |                   0 |
| `baseline`               |     5,410,859 |                   0 |

### Recommended: lazy Brotli rank data

The existing dynamic import for `cl100k_base` stays in place. An esbuild onLoad
hook serializes the rank object's exact fields, compresses them at build time, and
emits a module that restores JSON with `brotliDecompressSync(Buffer.from(...,
'base64'))` on module initialization. That initializer runs only when the existing
first token request imports it. No eval or Function constructor is introduced.
The literal base64 payload is 547,972 characters rather than ~1,090,792 bytes of
serialized rank JSON. Legal comments remain at the default setting.

- Whole restored rank object equals the original, including regex pattern,
  special tokens, and BPE ranks.
- Compiled browser-target tokenizer probe matches all six Korean/English/code/
  emoji/long-text corpus token-ID arrays exactly.
- Instrumented compiled module: **0 decodes at module load**, **exactly 1 decode**
  across repeated token calls. Native decode measured **2.28 ms** on Node 22 (a later loaded-host repeat was **3.95 ms**) and
  **2.20 ms** on Node 20 (individual local observations, not hardware promises).
- Existing seven tokenizer tests, including concurrent calls, pass against the
  compiled compressed module. Deflate, Brotli, Brotli+UTF8, and combined variants
  each pass that suite.
- Deflate also clears 5 MB, but its 4,988,074-byte result leaves only 11,926 bytes
  of product headroom. Brotli is the better candidate.

### Startup evidence and its limits

`scripts/bundle-startup-spike.mjs` executes the actual compiled entry and `onload`
against an empty in-memory Obsidian API fixture. It does not bypass plugin onload.
It represents an already-migrated vault, no saved tasks, and does not invoke the
later layout-ready model-discovery callback. Each run has a fresh Node process,
with alternating variant order; one warm-up pair plus seven measured pairs:

| Metric                        | Baseline median | Brotli median |
| ----------------------------- | --------------: | ------------: |
| Parse/evaluate compiled entry |        55.93 ms |      55.37 ms |
| Synthetic plugin onload       |        2.522 ms |      2.533 ms |
| Decompressions through onload |      0 in all 7 |    0 in all 7 |
| Commands registered           |     15 in all 7 |   15 in all 7 |

The synthetic result shows no material regression and proves decompression is
absent from this startup path. The 0.011 ms onload difference is not evidence of a
meaningful performance change. This is **not a live Obsidian benchmark**: renderer,
vault I/O, memory pressure, native modules, and cold process startup differ. Phase 2
must repeat the existing Performance mark measurements on the same real device.

### UTF-8 output: measured but deferred

UTF-8 saves 33,114 bytes, parses under Node, and passes the compiled token tests
when combined. The baseline already contains 2,594 non-ASCII codepoints (esbuild
preserves some regex/legal content); UTF-8 output contains 13,305. This supports
plausibility but does not prove the actual Obsidian loader path.

Source inspection finds no ASCII-only restriction in the release workflow: assets
are copied, hashed, attested, downloaded, and compared as bytes. We have not run
the external reviewer bot against this variant and have not inspected the app's
loader. **Do not include UTF-8 in the recommended patch.** Brotli alone is enough.

### node-fetch native URL: #18 dependency overlap

node-fetch 2 prefers Node's `url.URL` and retains a WHATWG compatibility fallback.
A build-only alias of that fallback to the native URL constructor removes **290,274
bytes**, largely tr46's Unicode mapping table. Three existing desktop-fetch tests
pass against the compiled alias module: protocol header/no preflight, SSE streaming,
and already-Web-response preservation. This is not full redirect/abort/auth parity.

Treat this as a measured upper opportunity for #18's maintained transport
replacement, **not** a recommendation to ship this alias or replace streaming
with non-streaming `requestUrl`. R-012's Node stream and CORS contract remains.
Brotli plus this isolated measurement is **4,577,885 bytes**, with 322,115 bytes
below the proposed 4.9 MB gate. #18's actual implementation may differ.

### LangChain: imports alone do not solve it

Changing the text splitter re-export to `@langchain/textsplitters` saves only
**54 bytes**: the same implementation and inherited graph remain. A diagnostic
upstream-source rewrite removing the unused Runnable superclass saves **75,794
bytes**, with 15 Markdown content/metadata parity cases passing. It still retains
part of the core/LangSmith graph. This is not a shippable upstream patch or complete
API-equivalence claim. A dedicated, attributed minimal splitter would need fuller
chunk/line-metadata/overlap coverage and carries more semantic risk than the rank
compression. Defer it unless final measurements demand further savings.

### Build flags and rejected reductions

- Tree shaking and all production minifiers are already enabled.
- `mainFields: ['module','browser','main']`: **0 bytes** saved.
- Dropping legal comments saves 19,488 bytes, but removing attribution or changing
  release assets for license notices is unnecessary risk. Retain legal comments.
- Dropping console/debugger saves 13,923 bytes, but can remove diagnostics and
  argument side effects. Not recommended as a feature-preserving cut.
- Property mangling, blanket sideEffects overrides, provider SDK rewrites, or
  language removal are unnecessary for this target and were not adopted.

## Code Splitting And Lazy Imports

The current CommonJS build explicitly rejects `splitting: true` with:

```text
Splitting currently only works with the "esm" format
```

The release workflow requires exactly `main.js`, `manifest.json`, `styles.css`
and rejects additional release assets. The current main already dynamically imports
DatabaseManager, RAG, provider manager, and the tokenizer, yet all their bytes are
in the single output. More inline dynamic imports can delay initialization but
cannot remove those bytes from `main.js`.

Moving to ESM chunks would require a separately proven Obsidian loading/install/
release contract. It is not a safe phase-2 solution for this lane. Keep the current
lazy boundaries for startup and use a single embedded compressed data module.

## Evidence Ledger

| ID   | Claim                                          | Class                                      | Evidence                                                 | Confidence       |
| ---- | ---------------------------------------------- | ------------------------------------------ | -------------------------------------------------------- | ---------------- |
| E-01 | Baseline size 5,410,859 bytes                  | Verified: build/metafile                   | Production build and equivalent harness                  | High             |
| E-02 | Brotli candidate 4,868,159 bytes               | Verified: build                            | Node 22 and Node 20 measurements                         | High             |
| E-03 | Exact rank data and token IDs preserved        | Verified: compiled-output tests            | Whole-object parity, six corpus arrays, seven Jest cases | High             |
| E-04 | Decode is lazy and cached                      | Verified: instrumentation                  | Zero on module load/onload; one across token calls       | High             |
| E-05 | Synthetic startup has no material regression   | Verified: synthetic timing only            | Seven fresh-process measured pairs                       | High for fixture |
| E-06 | Real Obsidian startup/heap unchanged           | Not verified                               | Needs same-device runtime measurement                    | Not applicable   |
| E-07 | #18 may recover ~290 KB of URL fallback weight | Inference informed by isolated measurement | Native-URL alias result, not final #18 code              | Medium           |
| E-08 | UTF-8 is safe in actual loader/reviewer        | Not verified                               | Workflow is byte-oriented; no app/bot run                | Not applicable   |

## Inferences Requiring Validation

The final #18/#43 graph and source additions can alter module retention and name
minification, so savings are not universally additive. Confirm final output on the
actual merged commit rather than subtracting this report's package sizes.

## Decision And Phase-2 Implementation Contract

1. After #18 and #43, rebuild and record a fresh immutable baseline/metafile.
2. Add a small production esbuild plugin for **only** `cl100k_base` rank data;
   retain the public lazy import, exact rank fields, and one cached encoder.
3. Add compiled-output rank/token-ID parity and lazy-decode regression checks.
   Source-only tokenizer tests do not prove a build transform is correct.
4. Keep ASCII charset, legal comments, all providers/languages, desktop transport,
   native CLI architecture, and the three release assets unchanged.
5. Set `maxMainBytes = 4_900_000` in `scripts/check-bundle-budget.mjs` and update its
   stale version-specific error text. Keep the forbidden-tokenizer guards. Update
   the node-fetch-specific guard only with #18's verified replacement contract.
6. Re-run all checks, the real Obsidian startup/first-token flow, and cold/warm
   measurements before claiming release readiness. Do not publish from this spike.

### Budget and integration margin

Let `D18` and `D43` be their actual changes from this report's baseline. The initial
estimate is `4,868,159 + D18 + D43`, not a guaranteed combined result. Without any
#18 saving, the proposed 4.9 MB budget tolerates only 31,841 added bytes. With the
isolated URL saving, it tolerates 322,115, but only the final build can establish
that margin. Aim for **<= 4,800,000 bytes** after integration when feasible; retain
**4,900,000** as the hard gate so at least 100 KB remains below the Sync limit.
Do not loosen the gate back toward 5 MB to absorb an unexplained regression.

## Test And Release Gates

- Baseline production build: pass; Brotli output passes existing bundle guards and
  an explicit `bytes <= 4_900_000` assertion.
- Type check: pass. Repository lint: pass (10 existing unrelated warnings).
- Isolated Obsidian community-review gate: pass on the unchanged production source.
- Full suite with compiled Brotli token module substituted: **122 suites / 812 tests
  passed**. Other modules remain the baseline source; this does not exercise every
  feature through the compiled main bundle.
- Each compressed-token candidate: **7 tokenizer tests passed** against compiled
  browser-target output, plus whole-rank equality and six token-ID corpus checks.
- Native-URL-only and UTF8/Brotli/native-URL combinations: **3 desktop-fetch tests
  passed** each against compiled transport output.
- Splitter diagnostic: 15 content/metadata parity cases and **3 focused RAG suites /
  19 tests passed** with the compiled splitter substituted.
- Diagnostic flag-only/rejected variants are build/size probes, not independently
  qualified user paths. No claim of feature safety is made for dropping console,
  notices, or arbitrary SDK surface.
- Phase 2: full original checks, isolated community gate, real Obsidian onload/
  first token, same-device timing/heap, all providers/features, and exact-SHA CI.

## Known Unknowns And Deferred Decisions

1. Real Obsidian cold/warm startup, first-token latency, and peak heap are not measured.
2. The current host's app loader and external reviewer UTF-8 handling are unverified.
3. Final #18 transport dependencies and PR #43 size delta are not integrated here.
4. Node 20/22 produce the same measured size; phase-2 CI should retain reproducible
   toolchain versions and verify decoded data across supported desktop platforms.
5. PGlite, syntax-highlighting grammar selection, and SDK protocol replacement are
   deliberately not reduced to satisfy a byte target.

## Security And Privacy

No account, credential, private vault content, or production endpoint was accessed.
Tests use public package data, synthetic text, an in-memory vault fixture, and
loopback HTTP. Compressed bytes contain tokenizer data only, not executable code
or user data. No changes were made to other worktrees.

## Change Log

- 2026-10-14: Phase-1 dependency/metafile investigation, local build experiments,
  compiled-token/transport tests, startup instrumentation, and phase-2 proposal.
