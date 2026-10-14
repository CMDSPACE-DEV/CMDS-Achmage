# CMDS Achmage 1.4.0

## Team and Enterprise Claude logins, pinned Claude models, current model requests, and Eagle 1.8 uploads

This release integrates work by **@laguna821** (PR #41, issues #38 and #39) on top of 1.3.0.

### Claude Plan

- **Team and Enterprise logins.** Claude Plan used to report a Team or Enterprise login as API billing and block it. It is now recognised as an organisation login. It works after you allow it on this computer. You can revoke that at any time from Plan connections. The setting is stored only on this computer and is not synced with the vault. API-key, gateway, and cloud-billing paths stay blocked whether or not you allow it. Settings your organisation manages may also apply to these requests.
- **Pinned Claude models.** Before, an entry such as `claude-opus-4.8 (plan)` ran the newest model of that family. Full model IDs are now sent as written. New pinned entries for Opus 5.5, Sonnet 5.5, and Fable 5.1 check your Claude Code version first. The `opus`, `sonnet`, `haiku`, and `fable` entries still follow the newest model.
- **Thinking "off" lowers effort.** Internal retrieval calls ran at high effort even with thinking turned off. They now run at low effort.

### Models

- **GPT Plan.** Each GPT Plan model now offers only the reasoning levels it accepts. GPT-6 models do not offer `none`. New models found by the startup catalog sync get their family's levels.
- **Anthropic API.** Requests to Claude 4.7 and later, 5.x, and Fable now use the parameters those models accept. Earlier turns' thinking blocks are no longer replayed.
- **Antigravity 1.2.** The Gemini Plan model list reads Antigravity 1.2's new output format. A custom `GOOGLE_GEMINI_BASE_URL` endpoint is blocked as a billing route.
- **Retired models.** Retired or shut-down models are replaced in existing vaults: o4-mini, Grok 4.1 Fast, DeepSeek chat/reasoner, `text-embedding-004`, and Gemini 2.5 Flash Image. A replacement happens only when the successor is present.

### Images

- **CMDS Eagle 1.8 and later.** Uploads were rejected by a check that accepted only Eagle 1.7. The plugin now checks for the upload API itself. It tells "not installed" apart from "no compatible API", and keeps the local image when an upload fails.

### Maintenance

- Settings schema 33. The migration changes only entries it recognises by id and provider type.
- A release preflight now runs before each version bump. It checks for open pull requests, unmerged branches, and research report numbering conflicts.

### Verification

- 941 unit tests, type checks, lint, bundle budget, and the community-review Error gate pass.
- A live Claude Plan session confirmed that personal subscriptions pass the new session check.
- The settings migration was rehearsed on a real vault.

---

## 한국어

이번 릴리스는 1.3.0 위에 **@laguna821**의 작업(PR #41, 이슈 #38·#39)을 통합했습니다.

- **Claude Team·Enterprise 로그인 지원**: 조직 계정 로그인이 API 과금으로 잘못 분류돼 막히던 문제를 고쳤습니다.
  - 이 컴퓨터에서 허용하면 사용할 수 있고, Plan 연결에서 언제든 해제할 수 있습니다.
  - 허용 여부는 이 컴퓨터에만 저장되고 볼트와 동기화되지 않습니다.
  - API 키·게이트웨이·클라우드 과금 경로는 허용하더라도 계속 차단됩니다.
- **Claude 고정 모델**: `claude-opus-4.8 (plan)`처럼 버전을 지정한 모델이 실제로는 해당 계열의 최신 모델로 실행되던 문제를 고쳤습니다. Opus 5.5·Sonnet 5.5·Fable 5.1 고정 항목이 추가되며, 사용 전에 Claude Code 버전을 확인합니다.
- **생각(thinking) 끔이 실제로 반영**: 생각을 꺼도 내부 검색 호출이 high로 실행되던 문제를 고쳐 low로 실행합니다.
- **GPT Plan 추론 단계**: 모델마다 실제로 받는 추론 단계만 보여 줍니다. GPT-6 계열에는 `none`이 없습니다.
- **Anthropic API 요청 형식 갱신**: Claude 4.7 이후·5.x·Fable 모델이 받는 매개변수로 요청을 보냅니다.
- **Antigravity 1.2 대응**: 새 모델 목록 형식을 읽고, 사용자 지정 엔드포인트(`GOOGLE_GEMINI_BASE_URL`)를 과금 경로로 보고 차단합니다.
- **종료된 모델 교체**: o4-mini, Grok 4.1 Fast, DeepSeek chat·reasoner, `text-embedding-004`, Gemini 2.5 Flash Image를 후속 모델로 바꿉니다. 후속 모델이 있을 때만 바꿉니다.
- **CMDS Eagle 1.8 이상 업로드 지원**: Eagle 1.7만 받던 검사를 업로드 API 확인으로 바꿨습니다. 업로드가 실패해도 로컬 이미지는 남습니다.
- **설정 스키마 33**: 마이그레이션은 ID와 provider 유형으로 알아볼 수 있는 항목만 바꿉니다.
- **릴리스 전 점검 추가**: 버전을 올리기 전에 열린 PR, 병합되지 않은 브랜치, 연구 보고서 번호 충돌을 확인합니다.
