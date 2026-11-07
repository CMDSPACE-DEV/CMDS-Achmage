# R-046: Eagle cloud upload API compatibility after 1.7

## Status

- Evidence: **Verified source, regression tests and offline integration; live UI/network untested**.
- Planning use: **Mandatory for Eagle cloud bridge changes**.
- Investigation date: 2026-10-06.
- Baseline: CMDS Achmage 1.2.0, commit `df6c3b48bdce6dfe715a55004bfc4b5e7b42a401`; installed CMDS Eagle 1.8.4.
- Scope: a local compatibility fix, without an upstream release or version bump.

## Executive Summary

The cloud bridge required `manifest.version.startsWith('1.7.')`. This rejects
Eagle 1.8.4 before any upload and incorrectly reports that Eagle is not installed.
Eagle 1.8.4 retains the required `getActiveCloudProvider()` and
`provider.upload(filePath, filename, mimeType)` methods. Check these capabilities
instead of treating a previously tested minor version as a compatibility ceiling.

## Research Question And Sources

Why do Inline edit and side-chat image uploads fail with an installed Eagle 1.8.4?

- `src/core/image/CmdsEagleBridge.ts`: shared cloud bridge.
- `src/core/image/PlanImageTaskAdapter.ts`: automatic delivery and local preservation.
- `src/components/chat-view/BackgroundTaskCards.tsx`: explicit cloud upload action.
- Installed Eagle 1.8.4 `main.js`: active provider getter and `R2Provider.upload`.
- [R-001](R-001-gpt-plan-native-image-cmds-eagle-r2.md): historical 1.7.0 protocol verification, not an exclusive supported-version claim.
- [R-034](R-034-image-destinations-eagle-library-delivery.md): destination routing and local image preservation.
- Historical research revision: `research:rr-a05a8a20679fc77cb2cbbcbf9ad7b5f7:ad7bd80a72bf46ac4135a8f9d774529bd82ebf8924f4b3284ebaeb4be2019e46`.
- This investigation, final revision: `research:rr-de12fa92f44c5a2183cb5961e12f99d2:0f9521a7d7f1450ca6d33cb50e8e821d1f0e40acd75deadaea130561b9b40c3b`.

## Evidence And Verification

| Check | Observed result |
| --- | --- |
| Installed manifests and enabled-plugin list | Achmage 1.2.0 and Eagle 1.8.4 present and enabled |
| Configuration presence only | R2 active and enabled; required fields populated |
| Baseline regression | 1.7.0 fixture passed; 1.8.4 rejected with the reported error |
| Original installed bundle with actual Eagle definitions | Same rejection before any network request |
| Bridge regression after fix | 12 tests passed, including version-independent capability checks, receiver binding, missing API/provider, desktop adapter and upload errors |
| Full test suite | 121 suites, 850 tests passed |
| Build | TypeScript and production bundle passed; 5,408,373 / 6,815,744 byte budget |
| Changed-file lint | Passed after explicitly typing the test's `requireActual` mock |
| Installed patched bundle integration | Actual Eagle 1.8.4 getter and R2 provider reached mocked multipart upload and returned the expected public URL |

The offline integration harness evaluates only the bridge, provider getter and
R2 provider definitions. File reads and network requests use synthetic data.
It verifies the upload path, bearer header, multipart fields, MIME type, bytes
and public URL without loading Obsidian or either plugin as an application.
The synthetic 2.0.0 unit fixture checks version independence; it is not evidence
of compatibility with an actual future Eagle release.

## Implemented Change And Local Deployment

Missing plugin, missing callable cloud API and missing active provider now have
separate checks. Provider invocation and its receiver, desktop restriction,
upload result handling and local-image preservation remain in place.

Only the compatibility guard in the existing vault `cmds-achmage/main.js` was
replaced. The newer repository's unrelated model-catalog changes were not deployed.
The bundle is byte-for-byte reversible by replacing the new guard with the old
one. Deployment checked the original hash before replacing the file and verified
that both plugins' settings/manifests and Eagle's code stayed unchanged.

- Original SHA-256: `a23d06c81a2bdfaf3da8ae04507bf98c6e4316117fc3123aeb59a12350ebf075`.
- Patched SHA-256: `5f69061e85896b1b935f4a2610c3296ac9d6f4b9f87dd83b0abda3dfab791f9a`.
- Local backup, deployment record and harness: `node_modules/.cache/eagle-compat-20261006/`.
- Source regression command: `node node_modules/jest/bin/jest.js --runInBand --runTestsByPath src/core/image/CmdsEagleBridge.test.ts`.

## Remaining Boundary

Obsidian was not launched, as requested. The other laptop's Dropbox synchronization,
plugin reload, live UI and current R2 service were not exercised. After synchronization,
reloading CMDS Achmage loads the corrected code. A future official plugin update may
overwrite a local bundle patch until the source change is included upstream.

## Security And Privacy

No credentials, tokens, account identifiers or private note content are recorded.
No generated image was published, no cloud configuration was changed, and no image
generation quota was consumed.

## Change Log

- 2026-10-06: Reproduced the version guard failure, fixed source, added regression coverage,
  verified production and installed bundles offline, and deployed the minimal local fix.
