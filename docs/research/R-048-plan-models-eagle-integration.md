# R-048: 1.3 후보 — Plan·모델 목록·Eagle 통합 검토

> [!NOTE] 2026-10-14 통합 결과
> 이 보고서가 제안한 통합은 1.3.0 배포 뒤에 1.3.1 후보로 다시 통합되었다(R-051).
> 본문의 R-044·R-045는 이미 배포된 같은 번호와 겹쳐 각각 **R-049**(조직 로그인)와
> **R-050**(모델 목록)으로 번호가 바뀌었고, 설정 이관은 31→32가 아니라 **32→33**으로
> 실행된다. 아래 본문은 작성 당시 기록으로 남긴다.

## 상태와 범위

- 2026-10-06, **소스 통합 및 로컬 자동검사 완료 / 실제 계정·앱 검증 일부 미완료**.
- 대상: `CMDSPACE-DEV/CMDS-Achmage`, `main` `d7eba16777e0577adb6b137e9aaa8dc6521bf053`.
- 제안 버전: **1.3.0**. 이 PR은 버전 번호를 확정하거나 배포하지 않는다.
- 질문: 이미 원격에 있던 두 수정과 다른 작업에서 검증한 Eagle 수정이 함께 작동하는가?
- 범위는 R-044, R-045, R-046의 통합이다. 새 아키텍처나 기능 확장은 포함하지 않는다.

## 포함한 수정과 출처

| 변경 | 원본 | 반영 내용 |
| --- | --- | --- |
| Claude Team/Enterprise | `fix/claude-organization-plan-opt-in`, `2d3ee868546d5fb4fe7568cfce45891d084addf7`, [#38](https://github.com/CMDSPACE-DEV/CMDS-Achmage/issues/38), [R-044](R-044-claude-organization-plan-opt-in.md) | 조직 구독을 API 결제로 잘못 분류하는 문제를 수정하고 컴퓨터별 명시적 동의와 세션 검사를 추가 |
| 모델 목록·요청 호환성 | `feat/model-catalog-2026-10`, `df6c3b48bdce6dfe715a55004bfc4b5e7b42a401`, [#39](https://github.com/CMDSPACE-DEV/CMDS-Achmage/issues/39), [R-045](R-045-model-catalog-refresh-2026-10.md) | Claude 고정 모델/추론 강도, GPT Plan 기능표, Antigravity 목록, Anthropic 요청 형식, 설정 스키마 31→32 |
| Eagle 클라우드 업로드 | 다른 작업의 소스 수정과 12개 회귀 테스트, [R-046](R-046-eagle-cloud-api-version-compatibility.md) | `startsWith('1.7.')` 제한을 실제 업로드 API 확인으로 교체. 1.8.4를 미설치로 오인하던 문제 해결 |

두 원격 커밋을 merge하여 기존 커밋과 작성자 이력을 유지했다.
`docs/research/00-research-register.md`만 충돌했고 R-044/R-045를 모두 보존했다.
Eagle 변경은 원래 작업의 미커밋 소스를 별도 checkout으로 복사했다.
원래 작업 디렉터리와 설치된 볼트는 이번 통합에서 변경하지 않았다.

## Eagle의 구체적인 동작

이전에는 Eagle 1.8.4가 정상 설치되어 있어도 1.7 접두사가 아니어서 업로드 전에 거부했다.
현재는 플러그인 존재, 호출 가능한 `getActiveCloudProvider()`,
활성 provider의 `upload()`를 검사한다.
미설치 / 호환 API 없음 / 활성 provider 없음 오류가 구별된다.

`PlanImageTaskAdapter.preDeliver`의 자동 전송과
`BackgroundTaskCards.uploadR2`의 수동 업로드가 같은 함수를 사용한다.
데스크톱 제한, 반환 URL 확인, 업로드 실패 시 로컬 이미지 보존은 유지된다.
버전 2.0.0 단위 테스트는 번호 독립성을 검사하는 가상 fixture이며 실제 미래 버전의 호환 보증이 아니다.

## 이번 통합본 검증

환경: Windows, Node 25.9.0. 잠금 파일이 동일한 기존 의존성을 사용했다.
아래 수치는 각 원본 브랜치의 과거 검사 수치와 구별되는 **이번 통합본 실행 결과**다.

| 검사 | 결과 |
| --- | --- |
| 전체 Jest | **125 suites / 894 tests 통과** |
| Eagle 전용 회귀 | 전체 실행에 포함된 **12개 통과** |
| TypeScript | `tsc --noEmit` 통과 |
| 프로덕션 빌드 | 통과 |
| 번들 크기 | 5,416,885 / 6,815,744 bytes |
| ESLint | 오류 0, 변경하지 않은 ResearchAdapters/ResearchSecretStore의 경고 10 |
| Obsidian Error-tier 검사 | 동일 review config를 ESLint Node 진입점으로 실행, 통과 |
| 버전 일치 | manifest/package/lock/versions 모두 **1.2.0** |
| 빌드 산출물 | `main.js`/`meta.json`을 커밋하지 않음 |

Windows의 `.cmd` 실행 차이를 피하려고 review tooling을 아래처럼 직접 호출했다.
GitHub CI에서는 저장소의 기존 gate를 그대로 사용한다.

```text
node node_modules/jest/bin/jest.js --runInBand
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js .
node esbuild.config.mjs production
node scripts/check-bundle-budget.mjs
node scripts/check-version-parity.mjs
node tools/obsidian-review/node_modules/eslint/bin/eslint.js --config tools/obsidian-review/eslint.config.mjs src
```

## 공동개발진 검토·출시 요청

세 변경을 다음 통합 업데이트 후보로 검토해 주세요. 1.3.0은 제안이며 최종 번호는 유지관리자가 정합니다.

1. 이 PR의 최종 SHA에 대한 저장소 CI 결과와 세 변경을 검토한다.
2. 실제 Team/Enterprise 계정의 동의 전 차단·동의 후 로그인/요청·동의 철회를 확인한다.
3. Eagle 1.8.4 이상 호환 설치에서 inline 이미지 자동 업로드와 채팅 이미지의 CMDS R2 버튼을 각각 확인한다. 업로드 실패 시 로컬 이미지가 남는지도 확인한다.
4. R-045의 실제 API 계정 요청, GPT Plan 신규 모델 경로 및 설정 31→32 이관 미검증 항목을 확인한다. 모델/가격의 최신성도 출시 시점에 다시 확인한다.
5. 승인 후 별도 릴리즈 작업에서 버전 4개 파일을 함께 변경하고 최종 CI를 거친다. [릴리즈 절차](../obsidian-community-review.md)에 따라 main 병합 → 태그 → 3개 asset 배포를 진행한다.

이번 작업에서 Obsidian 실행, 실제 이미지 생성/R2 업로드, 조직 계정 로그인 또는 API 과금 요청은 하지 않았다.
R-046의 실제 설치 Eagle 코드를 사용한 검증은 모의 네트워크 기반이며 클라우드 실사용 검증과 다르다.
로컬 검사 통과가 릴리즈 완료를 뜻하지 않는다.

## 연구 연결

- R-044: `research:rr-e930957413fcd9d218593b4953bf099b:2cc90b4fd6bb671c5c3809da827aeabceff2fb964155390ece0b66ff803f2fe4`
- R-045: `research:rr-6010b3c396c2ed11a870b5d2fb0936c7:adc1d75c4762f735177ba55fca6678d9e864e51f04abd0839608aa4e8f841ff6`
- R-046: `research:rr-de12fa92f44c5a2183cb5961e12f99d2:0f9521a7d7f1450ca6d33cb50e8e821d1f0e40acd75deadaea130561b9b40c3b`
- R-047 PR·배포 감사는 라이브러리 기록이며 이 저장소에는 새 파일로 복제하지 않았다.
- 통합 준비 revision: `research:rr-a12c046b1b8529dce24f7b82299d72c6:ed8ba5a0fbc2009e7e2c1ff4adfb9d83e9da0434cc26c47beabbf6ff637c5429`

## 개인정보와 기록

새 문서·테스트에는 자격증명, 계정 식별자, 실제 개인 노트, R2 비밀키를 포함하지 않았다.
기존 사용자 설정이나 OAuth 데이터도 수정하지 않았다.

- 2026-10-06: 기존 두 브랜치 통합, Eagle 수정 이관, 통합본 자동검사 및 공동개발진 인수 항목 작성.

