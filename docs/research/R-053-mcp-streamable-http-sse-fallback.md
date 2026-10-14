# R-053: MCP Streamable HTTP With Legacy SSE Fallback

## Status

- Evidence status: **Verified for source and local integration tests; real Obsidian smoke test pending**
- Planning use: **Mandatory for MCP transport negotiation**
- Investigation date: 2026-10-14
- Repository baseline: `origin/main`, `66b9c59c5ea217ca1dd3ad8c074367e9292ed023`, version `1.3.0`
- Target release: `1.4.0` (#21 Part A; no version change in this lane)

## Executive Summary

Remote connections configured for Streamable HTTP now try legacy SSE when the
initial connection receives a protocol 4xx response. Explicit `legacySse: true`
configurations retain their direct SSE path. Both paths use the existing desktop
HTTP adapter, so this change does not restore the browser-CORS failure described
in R-012. Real SDK loopback tests verify initialization and tool discovery.

One deprecated `SSEClientTransport` constructor remains intentionally: the SDK
still requires it to communicate with SSE-only servers. Removing it would break
existing connections. This exception was accepted by the integrator for #21.

## Research Question

How can the plugin prefer Streamable HTTP while preserving old SSE connections,
OAuth retries, bearer headers, and desktop networking?

### In scope

- Remote connection negotiation inside `McpManager`.
- Existing `legacySse` configuration and authentication behavior.
- Targeted #21 deprecation, unused-variable, and assertion checks.

### Out of scope

- Dependency upgrades, settings schema changes, transport UI changes, mobile.
- PR #43 files and #16's `LexicalMenu.ts` / `InlineEditController.ts`.
- Release/version changes and remote production credentials.

## Baseline And Reproducibility

- Workspace: `worktrees/issue-21`, branch `fix/21-deprecations-part-a`.
- Baseline: `66b9c59c5ea217ca1dd3ad8c074367e9292ed023`.
- Environment: Linux, Node `v22.23.3`, MCP SDK `1.29.0`.
- Mandatory predecessors read: R-010, R-011, R-012.
- Before the change, the real-SDK transport suite had **3 failures and 6 passes**:
  HTTP 400/404/405 returned an error instead of discovering tools through SSE.
- After the change, the same suite passes **9/9**. A separate mocked OAuth suite
  passes **6/6**, covering authorization before and after fallback and failures.

Run from the worktree root:

```bash
npm test -- --runInBand src/core/mcp src/settings/schema/migrations/1_to_2.test.ts src/utils/llm/httpTransport.test.ts
```

Observed: **10 suites, 54 tests passed**. The tests bind only to loopback and use
synthetic server responses, authorization codes, and tokens.

## Sources Inspected

### Repository and installed dependency source

- `src/core/mcp/mcpManager.ts`: connection, authorization, retry and tool scan.
- `src/core/mcp/desktopFetch.ts`: Node HTTP fetch and Web stream adapter.
- `src/core/mcp/mcpManager.transport.test.ts`: real SDK HTTP/SSE integration.
- `src/core/mcp/mcpManager.transportAuth.test.ts`: OAuth lifecycle boundaries.
- `node_modules/@modelcontextprotocol/sdk/README.md`: backwards-compatible client.
- `node_modules/@modelcontextprotocol/sdk/dist/esm/examples/client/streamableHttpWithSseFallbackClient.js`.
- `node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js`:
  `StreamableHTTPError.code`, authentication and POST error behavior.
- `node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js`: failed
  initialization closes the client; fallback uses a fresh client.
- `tools/obsidian-review/node_modules/eslint-plugin-obsidianmd/dist/lib/index.js`:
  reviewer rule configuration (`args: 'none'`, `ignoreRestSiblings: true`).
- `node_modules/obsidian/obsidian.d.ts`: `setDestructive` requires Obsidian 1.13.0.

### First-party external sources

- [MCP SDK 1.29.0 client guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.29.0/docs/client.md)
  — accessed 2026-10-14; HTTP first, fallback on 4xx. The npm distribution includes
  the README and compiled example but not the linked `docs/client.md`.
- [MCP transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
  — accessed 2026-10-14; backwards compatibility between HTTP and legacy SSE.

The compiled SDK example catches any connection error even though the guide and
its own comments specify 4xx. The implementation follows the narrower documented
contract, not the example's broad catch. Authentication and rate-limit responses
(401, 403, 429) remain errors/auth challenges rather than transport negotiation.

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | HTTP-only configurations previously could not reach SSE-only endpoints | Verified: source and failing test | Three red loopback cases on baseline | High |
| E-02 | HTTP success avoids the legacy transport; 400/404/405 discover tools through SSE | Verified: local integration | Real SDK transport suite | High |
| E-03 | Explicit legacy SSE remains direct; bearer headers reach SSE GET and POST | Verified: local integration | Request sequence and header assertions | High |
| E-04 | Both paths avoid browser fetch and CORS preflight | Verified: local integration | Browser fetch spy rejects calls; local server sends no CORS headers | High |
| E-05 | Interactive/non-interactive OAuth survives fallback and closes callback/resources | Verified: mocked lifecycle | Six authorization/failure cases | High for unit behavior |
| E-06 | Real browser OAuth and renderer behavior work in Obsidian | Not verified | Pending runtime smoke test | Not applicable |

## Verified Findings

1. The existing SDK already provides both transports; no package update is needed.
2. Legacy SSE is still necessary for backwards compatibility. Its one deprecation
   finding is intentional and is neither suppressed nor hidden by the rule check.
3. A fresh client is used for fallback and after interactive authentication. The
   failed transport/client is closed before replacement.
4. The existing URL, request headers, desktop fetch, and OAuth provider are retained
   across fallback. The fallback choice is runtime-only; saved settings are not
   rewritten.
5. No fallback occurs for 401, 403, 429, 5xx, or a network exception. A failed SSE
   attempt terminates without repeating negotiation.

## Inferences Requiring Validation

Live hosted endpoints and their browser OAuth policies can differ from the local
fixtures. Test a real SSE-only endpoint and browser OAuth in Obsidian before
claiming end-to-end production authentication compatibility.

## Decision And Implementation Contract

- `legacySse: true`: connect directly with SSE, preserving existing behavior.
- Otherwise: Streamable HTTP first; eligible 4xx triggers one SSE attempt.
- Preserve R-012's desktop network adapter on every remote transport.
- Keep `UnauthorizedError` in the existing authentication flow, including when it
  arises after an HTTP-to-SSE transition.
- Keep the one SDK SSE constructor as a documented compatibility exception.

## Expected Change Surface

`mcpManager.ts` and adjacent tests carry the transport change. Other #21 Part A
changes are mechanical: `React.JSX`, `setDestructive`, unused catch bindings,
unnecessary assertions, and a frozen v1 settings type replacing an unused runtime
schema and its dead catalog scaffolding. **Runtime migration unchanged**;
`src/settings/schema/migrations/1_to_2.test.ts` verifies existing migration outputs.
`ResearchManager.ts` and `DatabaseManager.ts` already have zero findings for the
selected rules on this baseline and are unchanged.

No settings migration, SDK bump, generated artifact, or version bump is added.
`setDestructive` requires a later `minAppVersion: 1.13.0` bump after PR #43,
as assigned by the integrator; this branch alone is not a release candidate.

## Test And Release Gates

- Local focused verification: 10 suites / 54 tests, including 15 new transport and
  authentication cases; type check passed.
- Full verification: type check passed; lint passed (0 errors, 10 existing
  nullish-coalescing warnings in unrelated research files); 124 suites / 827 tests
  passed; production build passed (5,407,118 / 6,815,744 bytes); isolated
  community-review gate passed. Exact commands are recorded in the PR.
- Targeted rules run against production `src` using a temporary flat config outside
  the repository. `no-unused-vars` uses the reviewer's options; only the three
  requested rules are enabled. Exact commands, config, and findings are in the PR.
- Owned files: zero unnecessary assertions and unused variables; one intentional
  SSE deprecation remains. Excluded files are listed in the PR, including the
  informational `system_fingerprint` warnings left unchanged for Part B.
- Real Obsidian: connect/scan a modern server and an SSE-only server, exercise
  browser OAuth, and verify a read-only tool call. Not performed in this lane.
- Final release must include the scheduled minimum Obsidian version update.

## Known Unknowns And Deferred Decisions

1. Hosted OAuth and renderer smoke tests remain release validation work.
2. Part B handles #21 findings in files excluded from this lane.
3. Removal of legacy SSE depends on server compatibility, not only SDK deprecation.

## Security And Privacy

No credentials, real tokens, account identifiers, private vault content, or other
secrets were recorded. Test values are synthetic; no production endpoint is used.

## Change Log

- 2026-10-14: Initial source investigation, compatibility implementation, local
  integration and OAuth lifecycle verification for #21 Part A.
