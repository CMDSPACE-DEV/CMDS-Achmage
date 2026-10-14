# R-049: Claude Team/Enterprise Organization Plan Opt-In

> [!NOTE] Renumbered 2026-10-14
> Written as R-044 on `fix/claude-organization-plan-opt-in`. CMDS Achmage 1.3.0
> had already shipped a different R-044 (model catalog refresh and runtime
> discovery), so this report is R-049. The integration review also changed one
> behavior: a managed-settings inspection that fails now blocks an opted-in
> organization login too (see the R-027 change log).

## Status

- Evidence status: **Partially verified**
- Planning use: **Mandatory** for Claude Plan authentication classification
- Investigation date: 2026-10-01
- Repository baseline: `CMDSPACE-DEV/CMDS-Achmage` `main` at
  `d7eba16777e0577adb6b137e9aaa8dc6521bf053` (version `1.2.0`, settings
  schema 31), branch `fix/claude-organization-plan-opt-in`
- Runtime inspected: Claude Code `2.1.285` on Windows 11
- Target release: next CMDS Achmage release; closes
  [#38](https://github.com/CMDSPACE-DEV/CMDS-Achmage/issues/38)

> [!IMPORTANT]
> This report **partially supersedes R-027**: the R-027 classification row
> "`team` or `enterprise` → `billing-blocked` with organization-policy
> explanation → Block" now applies only until the user opts in on that
> computer. Every other R-027 block (environment, Console/API key/helper/
> gateway/cloud markers, long-lived token, unknown schema) is unchanged, and
> endpoint-managed settings keep blocking personal and unidentified logins.
> R-023's legal and product-distribution boundary is unchanged.

## Executive Summary

Issue #38 reported that every Claude Team account is rejected in Settings →
Claude Plan with the message "Claude is configured for API, helper, gateway,
or cloud-provider billing instead of subscription Plan usage." The account
was a normal claude.ai Team login (`authMethod: "claude.ai"`,
`subscriptionType: "team"`).

The message is wrong for that account. `subscriptionType` is a recognized
root auth field, but `isAllowedClaudeRootAuthField()` accepted only `pro` and
`max`, so `hasBlockedClaudeAuthMetadata()` treated the non-empty value
`team` as an unknown billing marker and returned before any branch could
explain the organization policy that R-027 itself specified.

This change:

- recognizes `team` and `enterprise` as subscription types, so they are no
  longer reported as API/gateway billing;
- adds an explicit organization branch that blocks with a dedicated
  organization explanation and code until the user opts in on this computer;
- stores that opt-in device-locally, outside synced vault settings;
- after opt-in, allows a clean first-party Team/Enterprise login, including on
  a computer with administrator-managed Claude Code settings;
- keeps every billing-marker and environment block ahead of the organization
  branch;
- adds a request-time `system/init` session guard and `--strict-mcp-config`.

Technical readiness is still not legal authorization; R-023's experimental,
personal-use labeling remains.

## Research Question

Why does a signed-in Claude Team account fail Plan diagnosis with an
API/gateway message, and what is the narrowest change that lets an informed
Team/Enterprise user use their own organization login without reopening any
API, gateway, cloud, or unknown-billing route?

### In scope

- `claude auth status` classification for `team` and `enterprise`.
- The user-facing explanation and an explicit, revocable opt-in.
- Managed-settings handling for organization logins.
- A request-time check of the session Claude Code actually started.

### Out of scope

- Reading organization-managed setting contents, credentials, account emails,
  or organization identifiers.
- Reimplementing Claude OAuth or storing Claude credentials.
- Model catalog changes (tracked separately for issue #39).
- Any claim that the technical change grants Anthropic contractual permission.

## Baseline And Reproducibility

### Reported environment (issue #38, sanitized)

| Field | Value |
| --- | --- |
| Plugin | CMDS Achmage 1.2.0 |
| OS | macOS 26.6.2 (Apple Silicon) |
| Plan | Team (three organization accounts) |
| `authMethod` | `claude.ai` |
| `subscriptionType` | `team` |
| Observed diagnosis | "Claude is configured for API, helper, gateway, or cloud-provider billing instead of subscription Plan usage." |

### `claude auth status --json` shape in Claude Code 2.1.285

Read-only string inspection of the installed 2.1.285 executable on Windows
shows the object that `auth status --json` prints:

```text
loggedIn, authMethod, apiProvider, analyticsDisabled,
projectsDirectory, configDirectory,
forcedLoginMethod   (only when a managed policy sets it)
allowedProviders    (only when a managed policy sets it)
apiKeySource        (only when a source other than "none" is active)
email, orgId, orgName, subscriptionType   (only for authMethod "claude.ai")
```

`subscriptionType` is derived from the organization type and takes the
values `max`, `pro`, `team`, `enterprise`, or `null`. `forcedLoginMethod`
takes `claudeai`, `console`, or `gateway`. Known `allowedProviders` entries
include `anthropic`, `customEndpoint`, `bedrock`, `vertex`, `foundry`, and
`gateway`.

Running every field name through the existing `isClaudeAuthMarkerKey()`
shows that only `allowedProviders` (matches `provider`) and `apiKeySource`
(matches `apikey`) are markers. For a clean Team login the only trigger was
`subscriptionType`.

### `system/init` stream event in Claude Code 2.1.285

The same inspection shows the `system/init` event includes `cwd`,
`session_id`, `tools`, `mcp_servers`, `model` (the resolved model),
`permissionMode`, `slash_commands`, `apiKeySource`, `betas`, and
`claude_code_version`. It is printed before the model works on the prompt.

No account email, organization identifier, token, credential file,
environment value, or managed-setting content was read, printed, or stored.

## Sources Inspected

### Repository source

- `src/core/llm/native/NativeRuntimeAuth.ts:94` (`{pro, max}` allowlist)
- `src/core/llm/native/NativeRuntimeAuth.ts:500-508` (billing-marker branch)
- `src/core/llm/native/NativeRuntimeAuth.ts:679-741` (root-field and marker scan)
- `src/core/llm/native/NativeRuntimeAuth.ts:169-233` (verification order)
- `src/core/llm/native/ClaudeAgentProvider.ts:101-129, 242-343`
- `src/core/llm/native/NativeRuntimeService.ts:205-274`
- `src/components/settings/sections/PlanConnectionsSection.tsx:636-656`
- `src/components/settings/modals/NativeRuntimeLoginModal.tsx:288-319`
- `src/components/settings/modals/NativeRuntimeInstallModal.tsx:700-733`
- `src/core/llm/native/NativeRuntimeAuth.test.ts:115-129`

### First-party external sources (accessed 2026-10-01)

- [Anthropic: Configure server-managed settings](https://code.claude.com/docs/en/server-managed-settings)
  - available for Claude for Teams and Claude for Enterprise;
  - settings are fetched at startup and refreshed hourly; cached at
    `~/.claude/remote-settings.json`;
  - delivered settings may include hooks, environment variables, permissions,
    `apiKeyHelper`, telemetry, and managed MCP servers;
  - "A non-interactive run, such as `claude -p` … can't show the dialog, so
    when the delivered settings would require approval, it applies them for
    that run only";
  - `claude doctor` reports the remote fetch outcome (2.1.248+) as text only.
- [Anthropic: Authentication](https://code.claude.com/docs/en/authentication)
  - Team and Enterprise members log in with the claude.ai account their admin
    invited; subscription OAuth is the default for Pro, Max, Team, and
    Enterprise;
  - documented credential precedence: cloud provider, `ANTHROPIC_AUTH_TOKEN`,
    `ANTHROPIC_API_KEY`, `apiKeyHelper`, `CLAUDE_CODE_OAUTH_TOKEN`, profiles,
    then `/login` subscription OAuth.
- [Anthropic: Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
  - unchanged R-023 boundary.

## Evidence Ledger

| ID | Claim | Class | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| E-01 | A clean Team login is rejected as API/gateway billing | Verified: source | `isAllowedClaudeRootAuthField` accepts only `pro`/`max`; `hasActiveMarker('team')` is true; branch at :500-508 | High |
| E-02 | The reported account was a first-party claude.ai Team login | Verified: user report | Issue #38 fields `authMethod: "claude.ai"`, `subscriptionType: "team"` | High |
| E-03 | 2.1.285 `auth status` emits only the fields listed above | Verified: binary inspection | Object literal in the 2.1.285 executable | High for 2.1.285 |
| E-04 | `team`/`enterprise` are the organization `subscriptionType` values | Verified: binary inspection | Organization-type mapping in 2.1.285 | High for 2.1.285 |
| E-05 | Team/Enterprise sessions can receive server-managed settings the plugin cannot read | Verified: first-party docs | Server-managed settings page | High |
| E-06 | `claude -p` applies approval-requiring delivered settings without a dialog | Verified: first-party docs | Server-managed settings page, approval section | High |
| E-07 | `system/init` reports `apiKeySource`, `tools`, `mcp_servers`, `model` | Verified: binary inspection | Init event builder in 2.1.285 | High for 2.1.285 |
| E-08 | `system/init` is printed before the first model request is sent | Inference | Event order in R-024 captures; not proven as a precondition | Medium |
| E-09 | A real Team login reaches Ready and answers after opt-in | Partially verified: live (owner, macOS only) | Owner's live test on 2026-10-14, see "Live validation (E-09)" below; Windows Team and any Enterprise login unverified | High for macOS Team; not applicable for Windows/Enterprise |

### Live validation (E-09), 2026-10-14

The product owner ran a sanitized live test, reported here without account
data:

- Device: MacBook (Apple M1), macOS.
- Build: CMDS Achmage built from the PR #45 head `b6b03b6` (1.4.0 candidate).
- Claude Team account:
  1. Signed out → card shows **Login required**.
  2. Team login → card shows **조직 계정 · 허용 필요** (organization account,
     consent required); requests stay blocked.
  3. Allow (device-local opt-in) → **Ready**, with
     **Team/Enterprise 계정으로 연결됨** (connected with a Team/Enterprise
     account).
  4. One chat request was sent and answered.
  5. Revoke the opt-in → blocked again.
- Personal Claude Max account on the same build: **Ready** (unchanged path).

Evidence: the owner's local screenshots `team-0-logged-out.png`,
`team-before-consent.png` and `team-final.png`. They are referenced by name
only and deliberately not committed, because they may show account details.

Scope: macOS only. A Windows Team login and any Enterprise login remain
unverified, so the Windows half of the release gate below is still open.

## Verified Findings

### 1. The reported message is a misclassification, not a login failure

The login succeeds. The plugin then refuses it with wording meant for API,
helper, gateway, and cloud-provider routes. R-027's own matrix asked for an
organization-policy explanation for this case; the shipped code never reached
one because the marker scan returned first.

### 2. Organization logins carry a real, different risk

Server-managed settings exist only for Teams and Enterprise. In a `claude -p`
run they apply without an approval dialog, and the plugin cannot see them.
They can add hooks, environment variables, telemetry, MCP servers, and
credential helpers. That is a policy question for the user and their
organization, not evidence of API billing.

### 3. Classification order matters

If the organization branch ran before the marker scan, a Team account that
also has an API-key helper would be told that opting in would help. Markers
must be checked first.

### 4. The init event can only stop a request, not prevent it

The CLI does not wait for the plugin after printing `system/init`. Stopping the
process on a bad session therefore limits but does not prevent a request, and
organization hooks may already have run.

## Inferences Requiring Validation

1. A real Team or Enterprise login reaches Ready after opt-in and answers.
   **macOS Team: verified live by the owner on 2026-10-14 (E-09).** Windows
   Team and Enterprise logins remain to be validated.
2. `allowedProviders: ["anthropic"]` and `forcedLoginMethod: "claudeai"`
   appear in `auth status` for organizations that set them. Validate with an
   organization that uses those policies.
3. `apiKeySource` covers every non-subscription credential route. A gateway
   or bearer-token route delivered by settings may not set it; this remains a
   documented residual risk.

## Decision And Implementation Contract

### Classification matrix (replaces the R-027 Team/Enterprise row)

| Evidence | Opt-in off | Opt-in on |
| --- | --- | --- |
| Explicit `loggedIn=false` or failing `auth status` | `login-required` | `login-required` |
| Clean `claude.ai` + `firstParty` + `pro`/`max` | Allow (`subscription`) | Allow (`subscription`) |
| Clean `claude.ai` + `firstParty` + `team`/`enterprise` | Block (`organization-opt-in-required`) | Allow (`organization-subscription`) |
| Any billing marker: `apiKeySource`, non-`firstParty`, Console, `forcedLoginMethod` other than `claudeai`, `allowedProviders` other than exactly `["anthropic"]`, unknown marker key | Block (`billing-marker`) | Block (`billing-marker`) |
| Blocked environment variable name | Block before `auth status` | Block before `auth status` |
| Endpoint-managed settings, personal or unidentified login | Block (`managed-settings`) | Block (`managed-settings`) |
| Endpoint-managed settings, organization login | Block (`organization-opt-in-required`, managed evidence attached) | Allow (`organization-subscription`, managed evidence attached) |
| Missing, malformed, or future schema | Block | Block |

### Required behavior

1. `auth status` now runs even when endpoint-managed settings exist. It makes
   no model request and reads no secret; it is the only way to tell an
   organization login from a personal one. A personal or unidentified login
   on a managed computer stays blocked.
2. The opt-in is device-local (`localStorage`, versioned value), never in
   synced vault settings, so it cannot follow the vault to a computer signed
   in to a different organization.
3. The guard runs at diagnosis and again before every request.
4. Every Plan request adds `--strict-mcp-config`.
5. The request-time `system/init` guard stops the process with a dedicated,
   non-cancel error when `apiKeySource` is not `none` (every plan). For an
   opted-in organization login it also stops on attached MCP servers or
   `mcp__` tools, and discards the answer if no `init` event arrived. A
   missing `init` does not block Pro/Max, so a future CLI change cannot repeat
   the R-027 false block.
6. The consent dialog states, in Korean, that organization-managed settings
   (hooks, environment variables, permissions, telemetry, MCP servers) may
   apply; that usage follows the organization seat and extra-usage policy
   (Team Standard runs Fable only on usage credits); that organization
   retention and audit policies may apply to vault content in requests; and
   that Claude Plan remains an experimental personal-use path.
7. The card, login modal, and install modal use one shared helper keyed on
   the decision `code`.

## Expected Change Surface

- `src/core/llm/native/NativeRuntimeAuth.ts`
- `src/core/llm/native/nativeRuntime.types.ts` (`RuntimeAuthDecisionCode`)
- `src/core/llm/native/NativeRuntimeConsentStore.ts` (new)
- `src/core/llm/native/ClaudeAgentProvider.ts`
- `src/core/llm/native/NativeRuntimeService.ts`
- `src/components/settings/nativeRuntimePolicy.ts` (new, shared copy)
- `src/components/settings/sections/PlanConnectionsSection.tsx`
- `src/components/settings/modals/NativeRuntimeLoginModal.tsx`
- `src/components/settings/modals/NativeRuntimeInstallModal.tsx`
- `styles.css`

No settings schema, migration, or runtime protocol change.

## Test And Release Gates

- Classifier matrix with 2.1.285-shaped fixtures and invented values:
  `NativeRuntimeAuth.organization.test.ts`, plus updated
  `NativeRuntimeAuth.test.ts`.
- Request path: `ClaudeAgentProvider.organization.test.ts` (opt-in,
  `apiKeySource`, MCP, missing `init`, user cancellation).
- Diagnosis: `NativeRuntimeService.organization.test.ts`.
- UI: `PlanConnectionsSection.organization.test.tsx`.
- `npm run type:check`, `npm run lint:check`, `npm test`, `npm run build`,
  and the community-review gate.
- Release gate: a sanitized real Team or Enterprise login on Windows and
  macOS reaches Ready after opt-in and completes one minimal request.

## Known Unknowns And Deferred Decisions

1. Organization behavior is verified by fixtures derived from the 2.1.285
   executable, plus one live macOS Team run by the owner (E-09). Windows Team
   and Enterprise logins have not been run live.
2. `claude doctor` reports remote-settings state as text only. Parsing it was
   rejected as fuzzy matching; a machine-readable field would allow showing
   whether an organization actually delivers settings.
3. Organization hooks can run before the `init` guard stops a session.
4. Future Claude Code versions may rename fields; unknown schema stays
   fail-closed.

## Security And Privacy

No access token, OAuth code, API key, account email, organization identifier,
environment-variable value, managed-setting content, credential-store item,
private vault content, prompt, or model response was recorded. Test fixtures
use invented values only. The consent value stored on the device is a version
marker, not account data.

## Change Log

- 2026-10-01: Initial report and implementation for issue #38. Partially
  supersedes the R-027 Team/Enterprise row; live Team/Enterprise validation
  pending.
- 2026-10-14: Recorded the owner's live macOS Team validation as E-09
  (logged out → Login required → consent required → Ready after opt-in → one
  answered chat → blocked after revoke; personal Max Ready). Windows Team and
  Enterprise remain unverified.
