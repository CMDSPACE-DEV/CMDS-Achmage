# Version numbers

CMDS Achmage versions are `MAJOR.MINOR.PATCH` with no `v` prefix. The git tag,
`manifest.json`, `package.json`, `package-lock.json`, and `versions.json` carry
the same number, and the tag is annotated. The release procedure is in
[obsidian-community-review.md](obsidian-community-review.md).

## Which part to raise

| Part | Raise it when the release | Examples |
| --- | --- | --- |
| PATCH `1.3.x` | only fixes behavior, review findings, or docs, with no settings schema change | 1.3.1 review fixes, 1.3.2 inline styles |
| MINOR `1.x.0` | adds a feature, refreshes the model catalog, or adds a settings migration | 1.3.0 model catalog (schema 32) |
| MAJOR | removes a feature or setting that users rely on, or needs users to act to keep working | none yet |

Raising `minAppVersion` alone is not a major change. Say it in the release
notes, as 1.3.1 did when it moved to Obsidian 1.13.0.

Pull requests do not change the version. A PR title may name the number it is
proposed for. The number is set when the release is cut, after the official
review scan passes.

## Numbers already taken

The repository keeps the tags from before the rebrand to CMDS Achmage
(2026-09-05). They point at Smart Composer Achmage code, so a release cannot
reuse them:

- `1.4.0` (Smart_composer_Achmage v1.4.0, 2026-07-20)
- `2.0.0`–`2.0.14`, `2.1.1`, `2.4.0`, `2.5.0`, `2.5.5`, `2.6.1`–`2.6.5`, and
  `2.6.6-test.1`–`2.6.6-test.3`

Therefore:

- The minor after 1.3.x is **1.5.0**. All of `1.4.x` is skipped, so that no
  `1.4.1` looks like a patch of a release that never existed.
- The next major is **3.0.0**. All of `2.x` is skipped, because `2.x` already
  means Smart Composer Achmage in old tags and release notes.
- `docs/releases/RELEASE_NOTES_1.4.0.md` and `RELEASE_NOTES_2.6.*.md` are those
  releases' notes. Do not overwrite them.
- The old tags stay where they are. See
  [lineage-identifiers.md](lineage-identifiers.md#pre-rebrand-git-tags).

Before cutting `X.Y.Z`, confirm that the tag is free:
`git ls-remote --tags origin X.Y.Z` must print nothing. Once PR #43 is merged,
`npm run release:preflight -- X.Y.Z` fails on a taken tag.

## Plan as of 2026-10-23 (proposal)

Numbers follow merge order. If a later row ships first, it takes the next free
number and the rows below it move up.

| Version | Pull requests | State on 2026-10-23 |
| --- | --- | --- |
| 1.3.3 | #103 Windows npm Claude Code (issue #102), #60 OpenAI Plan "인증 대기" field report, #105 PR scope guidance | `review/1.3.3` prepared on 2026-10-21; final review scan and the merge PR pending |
| 1.4.x | none | Skipped (pre-rebrand tag) |
| 1.5.0 | #43: model catalog refresh (issue #39, schema 33), Eagle 1.8+ uploads, release preflight; includes #55 | Ready for review |
| 1.6.0 | #101: Pele Mermaid diagrams | Draft. Raises the bundle budget to 8 MB for Obsidian Sync Plus (R-062), above Sync Standard's 5 MB file limit; call this out in the release notes |
| no number | #107, #109 (docs only) | Ship with whichever release round includes them |
| close | #41 | Superseded by #56 (1.3.1) and #43 |

---

## 한국어

**규칙.** 버전은 `MAJOR.MINOR.PATCH`이고 `v`를 붙이지 않습니다.

- **PATCH(1.3.x)**: 버그·심사 지적·문서 수정만 있고 설정 스키마가 바뀌지 않을 때 올립니다.
- **MINOR(1.x.0)**: 기능 추가, 모델 카탈로그 갱신, 설정 마이그레이션이 있을 때 올립니다.
- **MAJOR**: 사용자가 쓰던 기능이나 설정을 없애거나, 사용자가 무언가를 해야 계속 쓸 수 있을 때 올립니다.
- `minAppVersion`을 올리는 것만으로는 MAJOR가 아닙니다. 릴리스 노트에 적습니다.
- PR은 버전을 바꾸지 않습니다. 제목에 제안 번호를 적을 수는 있습니다. 실제 번호는 공식 심사를 통과한 뒤 릴리스할 때 정합니다.

**이미 쓰인 번호.** 이름을 CMDS Achmage로 바꾸기 전(2026-09-05)의 Smart Composer Achmage 태그가 저장소에 남아 있습니다. `1.4.0`, `2.0.0`~`2.6.6-test.3`이 그렇습니다. 그래서:

- 1.3.x 다음 minor는 **1.5.0**입니다. 1.4.x 전체를 건너뜁니다.
- 다음 major는 **3.0.0**입니다. 2.x 전체를 건너뜁니다.
- `RELEASE_NOTES_1.4.0.md`와 `RELEASE_NOTES_2.6.*.md`는 옛 릴리스의 기록이므로 덮어쓰지 않습니다.
- 옛 태그는 지우거나 옮기지 않습니다.
- 릴리스 전에 `git ls-remote --tags origin X.Y.Z` 결과가 비어 있는지 확인합니다. #43이 병합되면 `npm run release:preflight -- X.Y.Z`가 대신 검사합니다.

**2026-10-23 기준 계획(제안).** 병합 순서대로 번호를 붙입니다. 뒤쪽 PR이 먼저 나가면 그 PR이 다음 빈 번호를 가져갑니다.

| 버전 | PR | 상태 |
| --- | --- | --- |
| 1.3.3 | #103 Windows npm Claude Code, #60 OpenAI Plan '인증 대기' 기록, #105 PR 크기 원칙 | `review/1.3.3` 준비됨(10/21). 최종 심사와 병합 PR 남음 |
| 1.4.x | 없음 | 건너뜀(옛 태그) |
| 1.5.0 | #43 모델 카탈로그 갱신(스키마 33), Eagle 1.8 업로드, 릴리스 사전 점검(#55 포함) | 리뷰 가능 |
| 1.6.0 | #101 Pele 다이어그램 | Draft. 번들 기준을 Sync Plus 기준 8 MB로 올림(R-062). Sync Standard의 5 MB 파일 한도를 넘으므로 릴리스 노트에 알림 |
| 번호 없음 | #107, #109 (문서) | 해당 릴리스 라운드에 함께 |
| 닫기 | #41 | #56(1.3.1)과 #43으로 대체됨 |
