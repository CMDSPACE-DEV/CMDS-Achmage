# CMDS Achmage 사용설명서
Obsidian의 노트를 AI 채팅, 검토 가능한 편집, 자료 조사, 이미지 제작의 작업 맥락으로 사용합니다.

## 배포 상태, 준비물, 비용
**2026-09-14**에 확인한 **CMDS Achmage 1.1.0** 기준입니다. 파일 3종을 갖춘 공개 안정 릴리스이며 Community Plugins 목록에도 등록되었습니다. 목록에는 Obsidian 직원의 수동 검토를 받지 않았다는 고지가 있습니다. 연구 보고서의 과거 2.x 번호는 계승한 개발 계보의 버전이지 더 최신 CMDS 릴리스가 아닙니다.
- **Obsidian 데스크톱 1.11.4 이상**. 네이티브 프로세스, 클립보드, MCP 연결을 사용하며 모바일은 지원하지 않습니다.
- 첫 사용에는 API 제공업체의 계정/키와 사용 가능한 크레딧을 권장합니다. 채팅 서비스 구독료와 API 잔액은 다릅니다.
- 벡터 검색에는 선택적 임베딩 제공업체가 필요합니다. 노트/폴더 참조는 읽기/재순위화 경로로 임베딩 키 없이도 가능하지만 모델 사용량까지 없어지는 것은 아닙니다.
- Eagle/CMDS Eagle, 외부 MCP, 리서치 서비스 계정, 이미지 모델 인증은 각 기능을 사용할 때만 준비합니다.
- 플러그인은 MIT 라이선스입니다. 모델, 리서치 API, 저장소, 외부 유료 앱의 요금과 조건은 별도입니다. 메뉴에 모델 이름이 있다고 모든 계정의 이용 가능성과 현재 요금을 보장하지 않습니다.

## 설치와 안전한 준비
1. **설정 → 커뮤니티 플러그인 → 탐색**에서 **CMDS Achmage**를 찾아 설치하고 활성화합니다.
2. 수동 설치는 [1.1.0 릴리스](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases/tag/1.1.0)의 `main.js`, `manifest.json`, `styles.css`를 `<vault>/.obsidian/plugins/cmds-achmage/`에 넣고 Obsidian을 다시 로드합니다. 설정과 채팅 데이터를 백업하고 타인의 `data.json`은 가져오지 않습니다.
3. 선택한 제공업체에 보내도 되는 테스트 볼트 또는 비민감 노트를 엽니다.
4. **설정 → CMDS Achmage → Advanced → Providers**에서 API 제공업체와 키를 추가/편집합니다. [API 키 안내](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/docs/getting-api-keys.md)와 제공업체의 현재 공식 콘솔을 참고합니다.
5. **Advanced → Models**에서 해당 제공업체의 활성 채팅 모델을 설정하고 **Plan → Chat model** 또는 컴포저에서 선택합니다. 탭 이름이 Plan이지만 채팅 모델 선택 자체가 구독 모델 전용은 아닙니다.
6. MCP를 연결하기 전에 **MCP → Tool execution → Per-tool approvals**로 바꿉니다. 출고 기본값은 매번 승인이 아니라 **Full auto**입니다.
7. **Writing**에서 **Include current file**(기본 켜짐), **Enable tools**를 확인합니다. 직접 멘션한 자료만 맥락으로 주려면 현재 파일 자동 포함을 끕니다. 첫 채팅에서는 외부 도구를 연결하지 않습니다.

## 첫 성공: 노트 하나에 질문 하나
1. 가상의 워크숍 일정처럼 사실 3개가 담긴 짧은 예제 노트를 만듭니다.
2. Ctrl/Cmd+P의 **Open chat** 또는 지팡이 리본 아이콘으로 채팅창을 엽니다.
3. `@`를 입력해 예제 노트를 선택하고 “이 노트만 근거로 일정 세 개를 정리하고, 없는 정보는 모른다고 표시해줘”라고 요청합니다.
4. 보내기 전에 맥락 칩과 현재 열린 노트를 확인합니다. 현재 파일 자동 포함이 켜져 있으면 멘션 외의 내용도 들어갈 수 있습니다.
5. 한 번 전송하고 답변을 원문과 비교합니다. 그럴듯한 답변이 정확한 파일을 읽었다는 증거는 아닙니다.
첫 성공은 의도한 제공업체가 의도한 노트를 근거로 답하는 것입니다. 연결 상태나 모델 목록만으로 실제 채팅 성공을 판정하지 않습니다.

## 편집: 생성과 적용은 다릅니다
### 채팅의 Edit note
대상 노트를 열고 컴포저의 펜 아이콘 **Edit note**를 켠 다음 작은 변경을 요청합니다. 기존 문장에 연결된 편집 카드가 나타납니다. 각 카드를 검토해 **Apply**, 여러 카드에는 **Apply all**을 사용할 수 있습니다. 전체 문서 제안에는 바뀐 문단을 적용하는 **Apply changes**가 제공될 수 있습니다.
이 경로는 두 번째 모델 호출 없이 텍스트를 일치시켜 적용합니다. 원문이 바뀌거나 기준 문장이 모호하면 무리하게 덮어쓰지 말고 작은 변경으로 다시 생성합니다. 원치 않는 적용은 편집기의 실행취소로 즉시 되돌리고 큰 변경에는 백업을 유지합니다.
### 인라인 편집
텍스트를 선택하고 **Inline edit selection**을 실행합니다. 기본 단축키는 Mod+Shift+K이며 macOS에서는 Cmd+Shift+K입니다. 패널의 **Output: Text edit**이 선택 영역을 고칩니다. 제안을 검토한 뒤 적용합니다. 다른 노트/폴더를 참고 맥락으로 주는 것은 그 노트의 수정 권한까지 주는 것과 다릅니다.
### 긴 문서
큰 편집은 체크포인트와 가시적 초안이 있는 문서 작업으로 전환될 수 있습니다. **Review document edit jobs**에서 검토/재개합니다. 원본, 대상, 성공/실패 구간, 생성 초안을 확인한 뒤 작업 문서로 채택합니다. 취소는 남은 작업을 멈출 수 있지만 이미 쓴 사용량이나 생성 파일을 모두 되돌리지는 않습니다.
초안 기본 위치는 `CMDS Achmage/Document Drafts`입니다. `achmage-source`, `achmage-generated`, `achmage-model`로 출처를 기록하되 사용자의 저자 스키마를 덮어쓰지 않습니다. 이 설명서가 과거 작업 스냅샷을 자동 정리하지는 않습니다.

## 노트, 폴더, 검색
RAG는 관련 원문 구간을 검색한 뒤 모델에 답변을 요청하는 방식입니다. 모든 노트를 전수 검토했다는 보장이 아닙니다.
- `@`로 노트/폴더를 선택하고 **Add selection to chat**으로 선택 구간을 넣습니다.
- **Writing → Vault search**에는 **Retrieval mode**, **Folder mention scope**, **Embedding model**, 포함/제외 패턴, 청크 크기, 토큰 기준, 유사도, 제한, DB 관리가 있습니다.
- 자동/집중/전수 폴더 읽기는 범위와 대기 시간, 토큰 사용량의 균형이 다릅니다. 전수 요청은 짧은 노트 멘션보다 훨씬 클 수 있습니다.
- 임베딩 모델을 설정한 뒤 **Rebuild entire vault index**를 실행하면 대상 텍스트가 임베딩 제공업체로 전송될 수 있습니다. 이후 **Update index for modified files**로 갱신합니다. 재구축 **전에** 포함/제외 범위를 확인합니다.
- **Respect Obsidian's excluded files**는 볼트 검색 경로에서 기본 켜짐입니다. 모든 명시 첨부나 외부 도구에 통용되는 권한 경계는 아닙니다.
- 현재 노트, 멘션, 검색 결과, 이전 대화, 이미지 참조, 도구 결과가 모델 맥락에 포함될 수 있습니다. 직접 멘션한 파일만 전송한다고 설명하면 안 됩니다.

## 이미지와 텍스트 카드
컴포저 이미지 모드, 텍스트, 선택 영역, 현재 노트, 클립보드 참조 이미지의 다섯 경로를 제공합니다. 긴 선택/노트는 채팅 모델이 먼저 수정 가능한 제작 설명으로 요약할 수 있으며 이 과정도 AI 요청입니다.
**Writing**에서 Image model, Image output folder, 화질, 목적지, 프롬프트 템플릿, 용도별 기본값, 공통 지시, 클립보드 복사, 텍스트 카드/비전 설정을 조절합니다. 이미지 전용 모델은 채팅 선택기와 구분됩니다.
- GPT Plan 이미지 생성은 구독 인증을 활용하는 실험 경로이고 Gemini/Grok 이미지 경로는 API 인증을 사용합니다.
- GPT Plan/Gemini는 참조 이미지를 받을 수 있습니다. 구현된 Grok 경로는 텍스트에서 이미지 생성만 지원합니다.
- 이미지는 먼저 볼트에 저장합니다. Image output folder가 비어 있으면 저장 시점에 Obsidian 첨부 폴더 설정을 따르며, 저장하지 않는다는 뜻이 아닙니다.
- 볼트에 유지, 작업 카드에서 묻기, Eagle 전송, CMDS Eagle 클라우드 업로드를 고를 수 있습니다. 라이브러리/폴더, 링크 형식, 태그, 볼트 사본 삭제는 의도적으로 선택합니다. 로컬 사본을 지우면 복구 조건도 달라집니다.
- **Render selection as image card (text as image)**는 모델 호출 없이 PNG 텍스트 카드를 만듭니다. 생성형 일러스트와 다릅니다.
- 클립보드 이미지 변환은 비전 모델을 사용합니다. 명령 실행 전 클립보드가 의도한 비민감 이미지인지 확인합니다.
- 생성한 글자, 인용, 배치, 다이어그램은 검토해야 합니다. 보기 좋은 출력은 검증된 출처가 아닙니다.

## 리서치 연결과 출처의 한계
**Research**에는 Web of Science Starter, Crossref/Retraction Watch, OpenAlex, PubMed, Europe PMC, KCI, ScienceON, RISS Linked Data, Korean Law, OpenDART, NTIS, KOSIS, NAVER 검색 등이 있습니다. 채팅 도구에 연결한 내장 API 어댑터이며 모든 항목이 별도 설치하는 원격 MCP 서버인 것은 아닙니다.
1. 필요한 출처만 켜고 해당 서비스의 인증/옵션을 입력합니다. 키가 필요한 출처와 필요 없는 출처가 있습니다.
2. 출처별 연결/시험 제어를 사용합니다. 실제 시험 요청은 서비스 사용량을 소모할 수 있습니다.
3. **Source routing**, **Maximum Auto sources**를 정하거나 채팅에서 원하는 출처를 명시/멘션합니다.
4. 제목, 식별자, 출처 URL, 조회 한계를 포함한 좁은 결과를 요청합니다.
5. 인용 전에 원문 레코드를 엽니다. 초록/메타데이터 조회가 전문 접근, Scopus/SSCI 수록, 논문 속 주장 검증까지 증명하지는 않습니다.
[리서치 설정 참고](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/docs/research/R-017-power-7-research-connections-setup-and-usage-guide.md)에 인증과 출처별 범위가 기록되어 있습니다. 과거 조사 날짜를 현재 서비스 보장으로 읽지 말고 가입 시 공식 문서를 확인합니다.

## MCP 권한: 기본값을 확인하세요
MCP는 모델이 외부 도구를 호출하는 연결 규약입니다. 결과가 현재 채팅 모델로 보내지므로 사용량과 정보 노출 범위가 늘 수 있습니다.

| MCP → Tool execution | 실제 동작 |
|---|---|
| **Full auto 기본값** | 수동 연결/재검색에서 현재 도구 스키마를 자동 신뢰하며, 활성 읽기/쓰기/삭제 도구가 Allow 질문 없이 실행될 수 있음 |
| Safe auto: read only | 읽기 전용은 자동, 쓰기/삭제/분류 불명은 승인 필요 |
| Per-tool approvals | 명시 승인 중심; 처음 사용하거나 낯선 연결을 추가할 때 권장 |

스키마는 도구 이름, 입력 형식, 설명 등 선언된 계약입니다. 신뢰 처리는 서버 보안 감사가 아닙니다. 재검색으로 신뢰/활성 도구가 바뀔 수 있습니다. 인증, 도구 이름과 부작용, 실행 정책을 확인하고 안 쓰는 연결은 해제합니다. full-auto 쓰기/삭제 도구가 있는 상태에서 “전부 정리해”처럼 광범위한 지시를 주지 않습니다.
**Tool routing**은 자동 선택과 요청 시 노출을 구분합니다. **Writing → Maximum automatic tool rounds**는 연속 도구 회차를 제한하며 UI 범위는 1–50입니다. 금액 한도나 무해함의 보장이 아닙니다. 요청 중단만으로 이미 완료한 외부 변경을 취소할 수는 없습니다.

## Plan 연결은 실험 기능입니다
**Plan** 탭은 구독 인증을 활용하는 호환 경로를 제공합니다. **공식적으로 보장된 서드파티 구독 권한이 아닙니다.** ready가 무료 요청이나 모든 모델 접근을 보증하지 않습니다. 일반적인 제공업체 연결은 API 인증을 사용하고 Plan 선택 전 현재 약관을 확인합니다.
네이티브 Claude/Gemini는 플러그인의 운영체제별 설치 안내와 눈에 보이는 터미널을 사용합니다. **설치 → 설치 확인 → 로그인 → 연결 확인 → 짧은 실제 채팅 시험** 순서입니다. 명령 복사, 터미널 열기, 안내 닫기만으로 설치/로그인이 끝나지 않습니다. 설치와 인증은 기기별이므로 설정 동기화가 다른 컴퓨터에 CLI를 설치해 주지 않습니다.
- Claude는 설치된 공식 Claude Code CLI에 위임합니다. API/클라우드 과금 우선값, 지원하지 않는 계정 분류, 잘못된 인증 정보 형식은 차단될 수 있습니다. 초록 상태를 만들기 위해 조직 정책을 제거하지 않습니다.
- Gemini Plan 구현은 별도 `gemini`가 아니라 Antigravity CLI(`agy`)를 사용합니다. 모델 목록은 연결 가능성을 보여주지만 개인 구독 할당량을 기계적으로 입증하지는 않습니다. 명시적 클라우드/API 과금 신호는 차단될 수 있습니다.
- 네이티브 인증은 런타임 로그인과 보호 저장소가 관리합니다. OAuth 코드나 토큰 파일을 플러그인 설정/이슈에 붙이지 않습니다.
- GPT 계열 Plan은 별도 연결 흐름입니다. Claude/Gemini 설치 절차를 그대로 적용하지 않습니다.
- 선택한 런타임의 진단/업데이트 흐름과 최신 공식 설치 안내를 사용합니다. 업데이트 명령을 추측하거나 버튼만 보고 설치 완료로 간주하지 않습니다.
- 정책, 계정, 모델, 백엔드 변화로 예고 없이 중단될 수 있으며 다른 유료 모델로 자동 대체한다고 보장하지 않습니다.
R-023부터 R-029까지는 과거 실측, 구현 변경, 미검증 환경을 구분합니다. 이 설명서 작업에서는 새 네이티브 로그인, 유료 추론, 새 컴퓨터 검증을 수행하지 않았습니다.

## 설정 지도
실제 최상위 탭은 **Plan, Research, Writing, MCP, Advanced**입니다.

| 탭 | 주요 설정 |
|---|---|
| Plan | 구독/네이티브 연결 카드, Chat model, Inline edit model |
| Research | 출처 라우팅과 개수 제한, 출처별 인증/옵션과 실제 시험 |
| Writing | 인라인 주변 맥락, Large inline edits, 초안 폴더, frontmatter 보존, 동시성/재시도, 이미지/아티팩트 출력과 템플릿, System prompt, Include current file, Enable tools, 도구 회차 제한 |
| Writing의 Appearance | 기본 테마 추종, 프리셋, Base skin, Accent, Glow, 선택적 Style Settings |
| Writing의 Vault search | 검색/폴더 모드, 임베딩 선택, 포함/제외 범위, 인덱싱 파라미터 |
| MCP | Tool execution, Tool routing, 서버 연결/인증/탐색/도구 제어 |
| Advanced | API Providers, 임베딩을 포함한 Models, 기타 유틸리티 |

아티팩트 초안 기본 위치는 `CMDS Achmage/Artifacts`입니다. API 제공업체 삭제는 확인 후 관련 모델과 임베딩까지 제거할 수 있으므로 메뉴 하나를 숨기는 동작으로 생각하지 않습니다. 제공업체/모델 구조 변경 전에 백업합니다.

## 명령어 사전

| 실제 명령 이름 | 용도 |
|---|---|
| Open chat | 채팅 패널 열기 |
| Add selection to chat | 선택 텍스트를 맥락으로 첨부 |
| Inline edit selection | 선택 영역 편집; 이미지 출력도 가능 |
| Generate image (text to image)… | 이미지 생성 프롬프트 제어 |
| Generate image from selection | 선택 영역을 이미지 제작 설명으로 사용 |
| Generate image from current note | 노트를 수정 가능한 제작 설명으로 요약 |
| Generate image from clipboard image (image to image)… | 클립보드 이미지를 참조로 사용 |
| Render selection as image card (text as image) | 모델 없이 로컬 PNG 텍스트 카드 생성 |
| Convert clipboard image to Markdown (auto structure) | 클립보드 이미지 구조를 추론해 Markdown 생성 |
| Convert clipboard image to Markdown list | 이미지를 목록으로 변환 |
| Convert clipboard image to Markdown table | 이미지를 표로 변환 |
| Convert clipboard image to Mermaid diagram | 이미지를 다이어그램으로 변환; 문법과 내용 검토 필요 |
| Review document edit jobs | 긴 편집 작업 검토/재개 |
| Rebuild entire vault index | 대상 임베딩 인덱스 재구축; 제공업체 사용량 발생 가능 |
| Update index for modified files | 변경 파일 인덱스 갱신 |

## 데이터, 개인정보, 복구
채팅과 검색 저장소에는 `.smtcmp_*` 계승 이름이 남아 있으며 채팅 이력, JSON 데이터, 벡터 저장소가 포함됩니다. 옛 이름만 보고 다른 플러그인이 중복 설치됐다고 판단하거나 삭제하지 않습니다. `data.json`과 함께 비공개로 보관합니다. 대화, 맥락, 모델 설정, 인증 또는 노트의 검색용 파생물이 포함될 수 있습니다.
MCP와 리서치 인증은 일반 설정과 별도로 Obsidian secretStorage를 사용합니다. 그렇다고 모든 제공업체 설정, 대화 저장소, 백업에서 비밀정보가 사라지는 것은 아닙니다.
선택한 모델, 임베딩 제공업체, 리서치 API, MCP 서버, 이미지/클라우드 경로로 데이터가 외부에 나갈 수 있습니다. 로컬 CLI도 제공업체에 접속합니다. API 키 표시가 가려져 있다고 모든 설정이 암호화 저장된다는 뜻은 아닙니다. 볼트 동기화와 백업 범위를 확인합니다.
원치 않는 노트 편집은 실행취소 또는 검증한 백업으로 복구합니다. 외부 도구 호출/이미지 업로드는 해당 서비스 상태도 별도로 확인합니다. Markdown 복원만으로 외부 쓰기가 되돌아가지는 않습니다. 작업이 멈추고 복구가 불필요해지기 전에는 체크포인트를 삭제하지 않습니다.

## 문제 해결

| 증상 | 다음 확인 |
|---|---|
| 응답 없음/인증 실패 | API 제공업체/키/모델, 할당량, 연결; Plan은 별도 경로 |
| 엉뚱한 자료를 근거로 답함 | 맥락 칩, Include current file, 폴더 범위, 검색 결과, 이전 대화 |
| Apply가 텍스트를 못 찾음 | 바뀐 원문이나 모호한 기준 문장 확인 후 작은 변경으로 재생성 |
| 폴더 검색이 불완전함 | 포함/제외, Obsidian 제외 파일, 검색 모드, 인덱스 갱신 |
| 사용량이 예상보다 많음 | 임베딩, 긴 폴더 읽기, 이미지 제작 설명 요약, 도구 결과와 자동 회차 |
| MCP가 묻지 않고 실행됨 | 기본 Full auto 확인; 연결/시험 전 정책 변경 |
| 설치했지만 런타임을 못 찾음 | 설치 완료, 로컬 진단, 현재 기기 실행파일 확인; 다른 기기 ready 복사 금지 |
| Plan 과금/인증 차단 | 비밀정보를 제거한 진단을 읽고 지원하는 API 경로 사용; 보호장치 우회 금지 |
| 생성 이미지가 안 보임 | 작업 상태, 출력/첨부 폴더, 참조 이미지 지원, Eagle/클라우드 목적지 |
| 테마가 다르게 보임 | Writing → Appearance의 Follow Obsidian theme부터 확인 |

## 지원, 계보, 라이선스
[웹 설명서](https://apps.cmdspace.work/plugins/cmds-achmage/) | [릴리스](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases) | [문제 신고](https://github.com/CMDSPACE-DEV/CMDS-Achmage/issues).
버전, OS, 제공업체 **종류**, 명령, 비밀정보를 지운 오류, 가상 노트를 제공합니다. 키, 전체 환경 출력, 개인 프롬프트, OAuth 코드, 실제 계정 정보를 올리지 않습니다.
**Yohan Koo (CMDSPACE)**, https://cmdspace.work, **안창현 교수**가 함께 개발합니다. [협업 문서](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/docs/CMDS-COLLABORATION.md).
[Smart Composer](https://github.com/glowingjade/obsidian-smart-composer)에서 출발한 포크입니다. [LINEAGE.md](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/LINEAGE.md), [LICENSE](https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/LICENSE)를 보존합니다. MIT 라이선스의 **Copyright (c) 2024 Heesu Suh**는 유지되며 리브랜딩으로 원저자 표기를 대체하지 않습니다.

## 검증 범위
1.1.0의 `manifest.json`, 명령 등록, `SettingsTabRoot.tsx`, `ChatSection.tsx`, `RAGSection.tsx`, `McpSection.tsx`, 설정 스키마, 연구 등록부, 관련 런타임/출처 보고서를 확인했습니다. 소스 근거는 모든 제공업체/도구/OS의 새 실기 시험을 뜻하지 않습니다. 현재 UI 스크린샷을 꾸며내지 않았고 런타임 코드를 수정하거나 인증/개인 노트를 외부 검증에 보내지 않았습니다.

## 부록: 테세우스의 배
낡은 배를 고쳐 쓰다 보면 널빤지를 하나씩 갈아 끼우게 됩니다. 돛대를 바꾸고, 갑판을 새로 깔고, 이물과 고물까지 손을 대고 나면 어느 순간 처음 그 배의 나무는 한 조각도 남아 있지 않습니다. 그래도 이것은 같은 배인가 — 오래된 질문입니다.

CMDS Achmage도 남의 배에서 출발했습니다. 잘 만들어진 옵시디언 AI 플러그인 하나를 가져다 쓰기 시작했고, 매일 쓰다 보니 더 나아갈 수 있는 자리가 보였습니다. 노트를 쓰고 자료를 찾고 글을 고치는 흐름을 더 매끄럽게 만들 수 있는 지점들이었습니다. 그래서 판자를 덧대고 갈아 끼웠습니다. 모델을 붙이는 방식을 넓히고, 폴더를 읽는 방식을 늘리고, 편집이 일어나는 자리를 옮겼습니다.

**이 배가 최종적으로 어떤 모습이 될지는 우리도 모릅니다.** 정해두지 않았기 때문입니다. 우리가 매일 옵시디언에서 일하면서 더 좋은 방법을 발견하면 그 자리의 판자를 갈아 끼울 것이고, 그 과정이 이 플러그인의 개발 계획 그 자체입니다. 로드맵이 먼저 있고 그대로 만드는 것이 아니라, 쓰면서 배가 바뀝니다.

그러니 이 저장소를 지켜보신다면 완성된 제품이 아니라 **항해 중인 배**를 보고 계신 것입니다.
