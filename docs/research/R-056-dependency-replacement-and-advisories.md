# R-056: Dependency replacements and advisory remediation

## Status

- Evidence status: **Partially verified** — local prototype and automated checks; no installed Obsidian smoke test.
- Planning use: **Mandatory** for #18 and #14 in the owner-approved 1.3.1 scope.
- Investigation date: 2026-10-14
- Repository baseline: `origin/main` at `dc7d8f3` (includes #49, #50, #53 and #54), version 1.3.0 unchanged in this lane.
- Target release: **1.3.1 from main, independent of PR #43**. Scope authority: `rig/briefs/1.3.1-scope.md`. No version bump in this lane.

## Executive Summary

The local candidate has **zero production dependency advisories** (`npm audit --omit=dev`). Full audit improves from 73 to 48 entries; all remaining affected package paths are development-only and emit zero bytes into `main.js`. This is not a clean full audit: the named `js-yaml` package retains an indirect development finding through `argparse@1 → sprintf-js`, although its own advisories are patched.

Replace `builtin-modules` with Node's builtin module list, `lodash.isequal` with `util.isDeepStrictEqual`, and the single `lodash.debounce` call with a scoped trailing/max-wait helper. Keep `node-fetch@2.7.0`: the bounded standard-library prototype broke legacy raw-deflate responses. Keep the existing lint plugins until a coordinated toolchain migration; the proposed import-x replacement fails the existing TypeScript-ESLint peer constraints. The integrator accepted these deliberate deferrals on 2026-10-14.

The retained candidate is 5,430,136 bytes (+21,870 against the current baseline). R-055's exact Brotli data experiment gives **4,887,436 bytes**, with zero tokenizer decodes at module load, one decode on first use, exact restored ranks, and identical token IDs. Only 12,564 bytes remain under the earlier 4.9 MB proposal. The final 1.3.1 integration budget decision below supersedes that fixed proposal; no production compression or budget change is made here.

## Research Question

Which advisory and reviewer-requested dependency changes preserve existing features and can be applied to 1.3.1 without blind major upgrades?

### In scope

- The 14 named packages and six replacement suggestions in #18.
- Actual dependency paths, emitted bundle bytes, behavior comparisons, bounded local prototypes.
- Concrete phase-2 package/source changes and explicit residuals.

### Out of scope

- Tagging, publishing, merging, version bumps, edits to other worktrees.
- A general HTTP-client implementation or broad ESLint/Jest migration.
- Removing supported syntax languages, changing migrations, adding Claude Agent SDK, or changing PGlite storage.

## Baseline And Reproducibility

- Phase-2 worktree: `worktrees/issue-18-p2`, branch `fix/18-deps-advisories`, starting at `dc7d8f3`. The net phase-1 diff `8693360..8a76cf5` was applied, preserving #53's save failure catch/Notice and #54's detached ordering.
- Current reference fixture: `/tmp/achmage-18p2-baseline`, created with `git archive dc7d8f3` and `npm ci`; production build is 5,408,266 bytes. This avoids depending on a parked worktree that may be removed. The original phase-1 fixture was `worktrees/issue-14` at `af426ef`.
- Linux x64, Node 22.23.3, npm clean installation. No real Obsidian instance was used.
- Baseline `npm audit --json`: 73 entries (1 low, 19 moderate, 51 high, 2 critical). Compatible-range `npm audit fix` without force: 57. Explicit tested changes: 48 (11 moderate, 37 high).
- Standard-library HTTP prototype is preserved at local commit `3668bad`; final branch restores the original production adapter. Do not cherry-pick that experimental commit into release.
- [Normalized audit evidence](evidence/R-056-audit.json) contains every named advisory URL/range/source ID, baseline and candidate installed paths/versions, direct parent edges, emitted byte counts, and **each of the 48 residual entries** with affected paths, development flags, zero emitted bytes, upstream cause and npm's proposed fix. This avoids treating 48 transitive entries as 48 independent vulnerabilities.

Reproduction:

```sh
npm ci
npm audit --json                         # exits 1: documented dev residuals
npm audit --omit=dev --json              # exits 0: zero findings
npm run type:check
npm run lint:check
npm test -- --runInBand
npm run build
npm --prefix tools/obsidian-review ci
node tools/obsidian-review/check.mjs
node scripts/dependency-compatibility-spike.mjs /tmp/achmage-18p2-baseline --baseline
node scripts/dependency-compatibility-spike.mjs
node scripts/highlight-compatibility-spike.mjs /tmp/achmage-18p2-baseline
# R-055 experiment, executed with this worktree as cwd:
node ../issue-14/scripts/bundle-size-spike.mjs brotli
```

The audit evidence generator accepts saved baseline audit/lock/metafile and current audit JSON, then reads the current lock/metafile:

```sh
node scripts/dependency-audit-spike.mjs BEFORE_AUDIT BEFORE_LOCK BEFORE_META AFTER_AUDIT docs/research/evidence/R-056-audit.json dc7d8f3
npx prettier --write docs/research/evidence/R-056-audit.json
```

## Sources Inspected

### Repository source

- `package.json`, `package-lock.json`, `esbuild.config.mjs`, `.eslintrc.js`, `tools/obsidian-review/`.
- `src/core/mcp/desktopFetch.ts`, existing MCP transport/OAuth tests, new `desktopFetch.boundary.test.ts`.
- `src/hooks/useChatHistory.ts`, serialized message shapes, new helper tests.
- `src/core/rag/{planRerank,exhaustiveFolderRead}.ts`, `src/database/modules/vector/VectorManager.ts` — the only production LangChain imports.
- `src/settings/schema/migrations/20_to_21.ts` and tests: UUID v5 identity must remain stable.
- R-008, R-012 (desktop CORS/streaming), R-024 (native Claude CLI; do not bundle Agent SDK), and R-055 in the issue-14 worktree.
- Installed `@langchain/core` package manifest, callback manager/tracer, `@langchain/textsplitters/dist/text_splitter.cjs`, `refractor/index.js`, `node-fetch/lib/index.js`.
- GitHub issue #18 and current PR #43 file patches. #43 changes package version 1.3.0→1.4.0 and adds `release:preflight`; it **does not bump dependency versions**. Its lock patch changes only the two root version fields. This was a phase-1 comparison only. The later owner decision makes #43 independent: do not import its version, catalog, migration, or release-preflight changes into this lane.

### First-party external sources

Accessed 2026-10-14:

- npm registry metadata via `npm view PACKAGE@VERSION deprecated`, version manifests and `npm audit --json`; exact advisory links are preserved in the evidence ledger JSON.
- [Drizzle identifier escaping advisory](https://github.com/advisories/GHSA-gpj5-g38j-94v9) — fixed 0.45.2.
- [UUID bounds advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq) — fixed 11.1.1; application v5 migration must be tested.
- [Prism DOM clobbering advisory](https://github.com/advisories/GHSA-x7hr-w5r2-h6wg) — fixed 1.30.0.
- [React ESLint plugin](https://github.com/jsx-eslint/eslint-plugin-react) — still maintained, no npm package deprecation flag.
- [Undici documentation](https://undici.nodejs.org/) — Node HTTP/Web streams without browser CORS; considered but discarded in favor of preserving the existing client. No new HTTP dependency remains.

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | Production audit clean; full audit retains 48 dev entries | Verified: live | npm audit JSON and normalized path ledger | High |
| E-02 | No residual affected path is runtime-bundled | Verified: source/build | audit node paths joined with lock dev flags and esbuild output inputs | High |
| E-03 | Standard-library replacement breaks raw deflate | Verified: live | prototype test `incorrect header check`; identical test passes retained adapter | High |
| E-04 | Prism override preserves current highlighting | Verified: live | 367 AST language/alias comparisons, 277 rendered HTML comparisons | High |
| E-05 | Splitter outputs and used path avoid tracing | Verified: live/source | 15 exact chunk/metadata cases; callback/network sentinels with tracing env enabled | High |
| E-06 | LangSmith override is generally compatible with core | Not verified | declared range excludes 0.6; only app's splitter path verified | High |
| E-07 | Brotli plus candidate fits 5 MB today | Verified: build | 4,887,436 bytes, exact token data/IDs | High |
| E-08 | Final 1.3.1 integration and real Obsidian behavior | Not verified | requires phase-2 integration/manual gate | High |

## Verified Findings

### 1. Named advisories and fixes

“Minimum fix” below means the smallest version outside all baseline advisory ranges for that installed major family, not npm's sometimes much larger suggested top-level upgrade. The JSON companion lists each individual advisory and affected range. Installed versions are the actual tested lock resolutions. Runtime indicates emitted code, not merely a production declaration.

| Package | Baseline dependency path(s) | Minimum fix for observed advisories | Tested candidate | Exposure / status |
| --- | --- | --- | --- | --- |
| ajv | MCP SDK→ajv, ajv-formats→ajv; ESLint→ajv6 | 8.18.0 / 6.14.0 | 8.20.0 / 6.15.0 | v8 bundled; v6 dev. Cleared |
| brace-expansion | minimatch→brace-expansion; ESLint/Jest glob tools→older minimatch | 1.1.21 / 2.1.7 | 1.1.21 / 2.1.7 / 5.0.12 | Runtime and dev. Cleared |
| drizzle-orm | direct | 0.45.2 | 0.45.2 | Bundled. Cleared; real PGlite CRUD + escaping check |
| fast-uri | MCP→ajv8→fast-uri | 3.1.8 | 3.1.8 | Bundled. Cleared |
| form-data | Google auth/gaxios/node-fetch3 and SDK dependencies; jsdom | 4.0.6 | 4.0.6 | Installed runtime/dev, zero emitted bytes. Cleared |
| hono | MCP SDK→hono (server side) | 4.13.7 | 4.13.13 | Installed runtime, zero emitted bytes. Cleared |
| js-yaml | langchain→v4; ESLint→v4; Jest→babel-plugin-istanbul→load-nyc-config→v3 | 3.15.2 / 4.3.2 for own advisories | 3.15.2 / 4.3.2 | Zero emitted bytes. Own issues cleared; **dev v3 indirect sprintf-js residual remains** |
| langsmith | @langchain/core and langchain→langsmith | 0.6.0 for all recorded baseline issues | 0.6.0 override | Bundled through inherited Runnable graph; used splitting path verified; override outside declared range |
| minimatch | direct; gaxios→v9; ESLint/Jest/glob/filelist→v3/v5 | 3.1.4 / 5.1.8 / 9.0.7 / 10.2.3 | 3.1.5 / 9.0.9 / 10.2.6 (v5 removed by compatible update) | Direct bundled, other paths unbundled/dev. Cleared |
| prismjs | react-syntax-highlighter→refractor→1.27; direct highlighter/Lexical already 1.30 | 1.30.0 | 1.30.0 override | Bundled. Cleared; all language output comparisons exact |
| qs | MCP→express/body-parser→qs | 6.16.0 | 6.16.0 | Installed runtime, zero emitted bytes. Cleared |
| uuid | direct; LangChain/core/langsmith | 11.1.1 | 11.1.1; override `$uuid` | Bundled. Cleared; v4 validity and exact v5 migration fixture |
| ws | MCP SDK, OpenAI, jsdom | 8.21.0 | 8.22.0 | Installed runtime/dev, zero emitted bytes. Cleared |
| yaml | LangChain and shell tooling | 2.8.3 | 2.9.1 | Installed runtime, zero emitted bytes. Cleared |

The current audit also exposed MCP SDK's OAuth trust advisory GHSA-6qxp-vccf-f47h (not in the original list). The direct pin is updated 1.29.0→1.31.0, the first patched release, and the full MCP transport/auth suite passes. No blind `npm audit fix --force` was used.

### 2. Replacement decisions

Every row was a reviewer replacement suggestion. Only one of these exact baseline packages is marked deprecated by npm today.

| Package | npm deprecated at baseline version? | Usage | Prototype / final recommendation | Behavior proof / deferral |
| --- | --- | --- | --- | --- |
| builtin-modules3.3.0 | No | esbuild Node externals list | Replace with `node:module` builtinModules | Browser-target build succeeds; no new runtime package |
| lodash.debounce4.0.8 | No | one chat-history save callback, wait300/maxWait1000 | Scoped 30-line local helper; remove types package | Latest arguments, quiet trailing edge, continuous1000ms cap, returned previous Promise tested |
| lodash.isequal4.5.0 | Yes | compare serialized chat message arrays before saving | Node `util.isDeepStrictEqual`; remove types package | Key-order-independent objects, ordered arrays, nested metadata, content differences and missing-vs-undefined tests |
| node-fetch2.7.0 | No | only desktop MCP HTTP adapter | **Retain**; no own advisory | 114-line stdlib prototype regresses raw deflate; original adapter passes all54 MCP tests including10 added HTTP boundary cases |
| eslint-plugin-import2.30.0 | No | recommended/type rules and import ordering | Retain maintained2.32.0; defer migration | import-x4.16.1 install fails ERESOLVE: optional peer utils^8 conflicts installed TypeScript-ESLint/utils5.29.0; no force/legacy-peer-deps |
| eslint-plugin-react7.37.1 | No | React recommended rules | Retain; defer toolchain replacement | Removing it would silently lose existing checks; no drop-in standard-library equivalent; independent review toolchain already isolated |

The equality scope is serialized plain message data, not arbitrary class instances. Node strict equality distinguishes prototypes and negative zero where lodash may not. For such out-of-contract data this can cause an extra save, not drop a changed message. No serialization or persisted format changes.

The helper intentionally implements only the call site's trailing + maxWait contract; it is not a public lodash replacement (no leading/cancel/flush API). The hook never used those APIs. Existing lifecycle behavior is retained.

### 3. HTTP alternatives and measured cost

| Variant | main.js bytes | Difference against retained candidate | Decision |
| --- | ---: | ---: | --- |
| Current baseline dc7d8f3 | 5,408,266 | — | Reference |
| Current candidate, original node-fetch adapter retained | 5,430,136 | 0 | Recommended |
| Historical phase-1 Node http/https prototype | 5,121,115 | -308,132 against phase-1 retained 5,429,247 | Rejected for behavior regression |
| Retained candidate + exact R-055 Brotli | 4,887,436 | -542,700 | #14 phase-2 candidate, manual onload gate |

The stdlib prototype handles normal gzip/deflate/Brotli, redirects, credential stripping, abort, and live SSE. Raw-deflate returns `incorrect header check`; node-fetch's source also deliberately handles zero-length legacy deflate and tolerant gzip finalization. Raw-deflate is a **reproduced** regression; tolerant-gzip/legacy-IIS parity is an **unimplemented source-identified gap**, not a claimed reproduced failure. Extending this into a complete client is outside the bounded task. Obsidian requestUrl buffers responses and cannot replace SSE; renderer global fetch reintroduces the R-012 Chromium CORS defect. No new HTTP client is recommended.

The retained boundary suite verifies data arrives before server close, reader cancellation, active/pre-abort, redirects/manual/error/limit, credentials across origins,204 bodies and four compression forms. Test teardown explicitly destroys remaining server sockets: existing reader cancellation is not proof of immediate network socket teardown; no new claim is made about that pre-existing behavior.

### 4. Prism and LangSmith override proof

`prismjs1.30.0` under refractor3.6.0: eight family samples cover JS/TS/C-like code, Python, HTML/CSS, Markdown, SQL/JSON, shell/YAML/INI, JVM/.NET/C, Rust/Go/TeX. The 730-byte combined corpus is tokenized for **every367 registered language/alias**, and actual React syntax-highlighter HTML is byte-compared for **all277 supported languages**. Exact match; combined AST SHA256 `6016041b593a759849d0c2f81d8b5fe321d87a778bff3debd9ebb18d2355150d`. No languages are removed. This is a regression corpus, not proof for every possible string.

`@langchain/core0.3.80` declares `langsmith:^0.3.67`; **0.6.0 does not satisfy it**. This is an explicit tested override, not an in-range upgrade. Production imports only RecursiveCharacterTextSplitter in three files; all call `fromLanguage('markdown').createDocuments(...)`, reading pageContent/loc metadata. `createDocuments→splitText→Document` does not call Runnable invocation/callback configuration. Tracer modules remain transitively bundled through the superclass imports, explaining why installed and bundled exposure differs from executed behavior.

The harness sets all three tracing environment switches to true, makes CallbackManager.configure and global fetch throw if reached, then verifies15 splitter cases (three chunk sizes × five documents). It succeeds and matches baseline whole chunk+metadata SHA256 `382ec4e3c2e92ccd4e261eb26ab5d88423d804148ac61a07b56a856d331d1c1f`. Real PGlite insert/select/update/delete and SQL identifier escaping pass. UUID v5 fixture remains `651fedf6-e1ed-56d5-b93c-3204cd38f159`; existing migration20_to_21 tests pass. The override is scoped to today's non-tracing splitter use: adding a new LangChain tracing/Runnable call must trigger a range-compatible migration or renewed proof.

### 5. Residual audit disposition

All48 residual affected paths are development-only and emit0 bytes; `npm audit --omit=dev` has no findings. The companion ledger gives one row per residual package so none is hidden by grouping.

| Root cause | Affected dependency path | Why deferred / next action |
| --- | --- | --- |
| braces<=3.0.3, GHSA-vfj7-8cjw-p6xm | Jest29 and TS-ESLint5→micromatch/globby/fast-glob→braces | No patched version in the current line reported. npm proposes coordinated Jest30/TS-ESLint8 upgrades; these change discovery/rule semantics. Keep separate toolchain lane, untrusted glob input excluded from build jobs |
| sprintf-js<=1.1.3, GHSA-hp3w-g68c-fv3c | Jest→babel-plugin-istanbul→load-nyc-config→js-yaml3→argparse1→sprintf-js | No patched current line; js-yaml's own3.15.2 security fixes do not remove argparse. Full Jest/toolchain migration or verified parent replacement required; named-package indirect residual remains |
| esbuild<=0.24.2, GHSA-67mh-4wv8-2f99 | direct build0.17.3; drizzle-kit→esbuild and deprecated esbuild-kit loader | Patched>=0.25.0 exists, but build/compiler and drizzle tooling upgrade should be verified as its own lane. This project calls build/watch, not the vulnerable serve endpoint; no runtime bytes |
| moment<2.31.0, GHSA-4p3w-j4w9-5jqw | dev obsidian1.13.1→moment2.30.1 | npm suggests obsidian1.14.4. Do not silently raise Obsidian API assumptions during dependency spike. Externalized host API means npm bump would not patch the installed app; validate host separately |

These are deliberate deferrals, not claims of impossibility. No residual runtime vulnerability was waived. Root install may still show deprecated transitive tooling notices; “all deprecated warnings gone” is **not** satisfied by this phase1 candidate.

## Inferences Requiring Validation

- Real Obsidian desktop still needs MCP modern HTTP and legacy SSE, OAuth refresh, streamed tool execution, chat autosave, code highlighting, and persisted database reopen checks.
- No new LangChain tracing surface is supported by the tested override; broader compatibility remains unproven.
- Full audit must be rerun after integration because advisory metadata and lock resolution can change.

## Decision And Implementation Contract

Phase2 for 1.3.1 (owner scope supersedes the earlier wait-for-#43 plan):

1. Apply the net spike diff `8693360..8a76cf5` to current main; do not take the experimental HTTP commit3668bad. This candidate starts at `dc7d8f3` and includes no #43 source or version changes.
2. Keep compatible-range lock security updates; direct pins MCP1.31.0, drizzle0.45.2, uuid11.1.1; overrides prism1.30.0, langsmith0.6.0 and uuid`$uuid`. Keep the existing LangChain/core major versions and all highlighting languages.
3. Remove builtin-modules/lodash.debounce/lodash.isequal and obsolete typings (uuid11 supplies its own types). Retain node-fetch2 and lint plugins with explicit deliberate-deferral reasons in the Korean PR. Owner permits closing #18 when each item is either cleared or consciously deferred with reason.
4. Preserve #53's try/catch and save-failure Notice in useChatHistory. Its test now uses the actual replacement, not mocks of removed lodash packages. Hook-level fake-timer tests prove latest-call trailing300ms, continuous1000ms maxWait, a new burst after the bound, and one failure Notice. The local helper uses window timers so #15's rule is not regressed.
5. Rerun the entire MCP suite against SDK1.31.0, including StreamableHTTPError/SSE fallback and auth cases. Remeasure bundle and pass the result to #14, which runs after all 1.3.1 changes. No lazy compression or budget implementation belongs to #18.

### Final 1.3.1 budget rule (supersedes the old wait-for-#43 plan)

Hard artifact cap remains **strictly below5,000,000 bytes**. Set the project budget from the actual fully integrated 1.3.1/post-#18/Brotli measurement plus approximately50,000 bytes, rounded upward to a useful10,000-byte increment; budget must remain **strictly below4,950,000** (so the largest such rounded budget is4,940,000). Current measurement4,887,436 would imply4,940,000, providing52,564 bytes; this is illustrative, not approval to set the final budget before final integration measurement.

If the measured build cannot support that headroom, stop the budget increase and take a lossless cut. First candidate: R-055's measured dead WHATWG URL fallback under node-fetch2 (roughly290KB), replacing only that fallback's URL constructor with external Node URL at bundle time while keeping node-fetch behavior; requires compiled-adapter HTTP boundary tests and real desktop smoke before adoption. Other investigation candidates are compressing static Unicode/grammar data without changing language coverage. None is implemented here. **A refractor language subset is forbidden**: features stay intact. R-055 remains in its own worktree; this report is the phase2 planning addendum, not an edit to that lane.

## Expected Change Surface

- package.json/lock, esbuild builtin list, chat-history imports, scoped debounce helper/tests.
- New desktop HTTP boundary tests, compatibility/audit scripts, report/register/evidence.
- No production MCP transport change, schema/migration change, assets, output bundle commit, extra runtime HTTP package, or Claude Agent SDK.

## Test And Release Gates

Observed final candidate:

- type check passes.
- lint check passes with0 errors and18 warnings (non-blocking findings in existing code, including import warnings surfaced by import2.32; no rule disabled).
- **131 suites /857 tests pass**, including54 MCP tests on SDK1.31.0, three real-hook debounce tests, four helper tests and migration fixtures.
- production build passes existing6,815,744-byte gate at5,430,136 bytes (not the new strict5MB goal without #14).
- isolated Obsidian review gate passes.
- audit production0; full audit48 documented development-only entries.
- dependency compatibility harness:15 exact splitter cases, PGlite CRUD/identifier escaping, UUID validity/fixed v5 identity pass.
- highlighting comparison:367 AST/alias and277 rendered-language results exact.
- Brotli rank experiment:4,887,436 bytes,0 module-load decodes,1 first-use decode (one-time timing is recorded in the local experiment output; not a desktop benchmark), exact rank JSON and6 token-ID corpus cases. This is not a real-app onload measurement.

No targeted ESLint reviewer-rule replacement was made in this lane; the issue concerns dependency advisories/replacements, and the unchanged isolated review gate was run. The failed import-x install was rolled back, not bypassed.

## Known Unknowns And Deferred Decisions

1. Actual final 1.3.1 artifact size; derive budget only then.
2. Installed desktop/manual gates and host Electron behavior.
3. Full dev toolchain advisory removal, lint-plugin replacement, and root transitive deprecation warnings.
4. Broad LangSmith0.6 API compatibility outside the tested splitter-only path.
5. Reader cancel/socket lifetime pre-existing behavior; abort path tested, immediate socket closure on cancel not claimed.

## Security And Privacy

Only synthetic local HTTP payloads and in-memory database data were used. No credentials, tokens, account identifiers, private vault content or other secrets are recorded. Audit files contain public package metadata and relative dependency paths only. No real user network endpoint was called by tests.

## Change Log

- 2026-10-14: Phase1 local investigation and rejected HTTP prototype; no PR at that stage.
- 2026-10-14: Phase2 rebased by net diff onto dc7d8f3 for independent 1.3.1. Preserved #53 failure handling, updated real-hook tests, changed helper to window timers, revalidated SDK1.31 MCP behavior, reran compatibility comparisons/audit/build, and refreshed the evidence ledger. No version bump.
