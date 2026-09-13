# CMDS Achmage

[![English](https://img.shields.io/badge/🇬🇧_English-README.md-2ea44f)](README.md)
[![한국어](https://img.shields.io/badge/🇰🇷_한국어-current-blue)](README.ko.md)

옵시디언 안에서 AI 에이전트를 실제 작업 도구로 쓰기 위한 플러그인입니다.
[커맨드스페이스](https://cmdspace.work)와 안창현 교수가 함께 개발합니다.

> **데스크톱 전용입니다.** CMDS Achmage는 MCP 연결·네이티브 런타임·셸 실행·시스템 클립보드 등 데스크톱 기능을 사용하므로 옵시디언 모바일에서는 동작하지 않습니다.

## 테세우스의 배

낡은 배를 고쳐 쓰다 보면 널빤지를 하나씩 갈아 끼우게 됩니다. 돛대를 바꾸고, 갑판을 새로 깔고, 이물과 고물까지 손을 대고 나면 어느 순간 처음 그 배의 나무는 한 조각도 남아 있지 않습니다. 그래도 이것은 같은 배인가 — 오래된 질문입니다.

CMDS Achmage도 남의 배에서 출발했습니다. 잘 만들어진 옵시디언 AI 플러그인 하나를 가져다 쓰기 시작했고, 매일 쓰다 보니 더 나아갈 수 있는 자리가 보였습니다. 노트를 쓰고 자료를 찾고 글을 고치는 흐름을 더 매끄럽게 만들 수 있는 지점들이었습니다. 그래서 판자를 덧대고 갈아 끼웠습니다. 모델을 붙이는 방식을 넓히고, 폴더를 읽는 방식을 늘리고, 편집이 일어나는 자리를 옮겼습니다.

**이 배가 최종적으로 어떤 모습이 될지는 우리도 모릅니다.** 정해두지 않았기 때문입니다. 우리가 매일 옵시디언에서 일하면서 더 좋은 방법을 발견하면 그 자리의 판자를 갈아 끼울 것이고, 그 과정이 이 플러그인의 개발 계획 그 자체입니다. 로드맵이 먼저 있고 그대로 만드는 것이 아니라, 쓰면서 배가 바뀝니다.

그러니 이 저장소를 지켜보신다면 완성된 제품이 아니라 **항해 중인 배**를 보고 계신 것입니다.

## 무엇을 할 수 있나

- **노트에 근거한 AI 채팅** — 채팅창에서 노트·폴더를 멘션해 대화에 끌어옵니다. 볼트 전체를 훑지 않고 지금 다루는 자료만 보냅니다.
- **폴더 읽기와 검색(RAG)** — 폴더를 통째로 멘션하면 상황에 따라 자동·집중·전수 세 방식으로 읽습니다. 임베딩 검색과 리랭크 검색을 결합하며, **임베딩 API 키 없이도 폴더 멘션이 동작합니다.**
- **Edit note 모드와 결정론적 Apply** — 현재 노트의 수정을 요청하면 답변이 기존 문장에 앵커된 편집 카드로 옵니다. **Apply**(또는 **Apply all**)를 누르면 두 번째 모델 호출 없이 문자열 매칭으로 노트에 반영되고 ⌘Z로 되돌릴 수 있습니다.
- **인라인 편집** — 노트에서 바꾸고 싶은 부분만 선택해 그 자리에서 고칩니다. 같은 패널에서 텍스트 대신 이미지를 만들 수도 있습니다.
- **문서 단위 편집** — 긴 문서의 여러 곳을 한 번에 바꾸는, 재개 가능한 체크포인트 작업입니다.
- **이미지 생성, 다섯 개의 문** — 컴포저 이미지 모드, 텍스트→이미지, 선택→이미지, 노트→이미지(채팅 모델이 노트를 브리프로 요약, 수정 후 생성), 클립보드 이미지→이미지(image to image). GPT Plan(구독)과 Gemini·Grok(API 키). 용도별 프롬프트 템플릿 슬롯과 모든 이미지에 붙는 공통 지시문.
- **Eagle 라이브러리 전송** — 생성 이미지를 [Eagle](https://eagle.cool)의 원하는 라이브러리·폴더로 보내고 노트 링크 형식을 고릅니다. CMDS Eagle 플러그인이 있으면 그 라이브러리 목록과 클라우드 업로드를 재사용합니다.
- **클립보드 이미지 → 마크다운** — 스크린샷을 리스트·표·Mermaid 다이어그램으로 바꿔 커서 위치에 넣습니다.
- **텍스트 카드** — 선택한 텍스트를 CMDS 스타일 PNG(인용 카드)로 렌더링합니다. 모델 호출 없이 저장·클립보드 복사·임베드까지.
- **Plan 연결** — 구독 계정(Claude Pro/Max, Gemini, GPT 계열)의 인증을 빌려 API 키 없이 쓰는 실험 기능. 채팅 입력창에서 모델별 추론 강도를 바꿀 수 있습니다.
- **리서치 — 내장 MCP 도구** — 학술·공공 데이터베이스를 직접 호출합니다. 아래 참조.
- **MCP 도구 연결** — 외부 MCP 서버를 연결하되, 검토된 도구만 노출합니다.
- **백그라운드 작업** — 오래 걸리는 작업은 뒤에서 돌고, 그동안 계속 글을 씁니다.
- **외관** — 기본은 옵시디언 테마 추종. CMDS 룩을 원하면 프리셋, 액센트·발광 조절, Style Settings 세부 조정.

## 내장 MCP 리서치 도구

리서치 기능은 **MCP로 연결한 공식 데이터베이스 묶음**입니다. 웹을 긁는 대신 각 기관의 공식 API를 호출하므로 출처가 분명한 메타데이터를 돌려줍니다. 필요한 것만 켜고 서비스별 API 키를 넣으세요. 키는 따로 저장됩니다.

- **해외 학술**: Web of Science Starter, Crossref + Retraction Watch, OpenAlex, PubMed, Europe PMC
- **국내 학술**: KCI, ScienceON, RISS Linked Data
- **국내 공공·법령**: Korean Law MCP, OpenDART, NTIS, KOSIS MCP
- **뉴스·웹**: NAVER API HUB Search

## 설치

### 커뮤니티 플러그인

옵시디언 **설정 → 커뮤니티 플러그인 → 탐색**에서 `CMDS Achmage`를 검색해 설치하고 활성화합니다.

### 수동 설치

[릴리스 페이지](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases)에서 `main.js`, `manifest.json`, `styles.css` 세 파일을 받아 볼트의 `.obsidian/plugins/cmds-achmage/` 폴더에 넣고 옵시디언을 다시 시작합니다.

## 사용법

1. 플러그인을 켜고 리본 아이콘(지팡이)이나 **"CMDS Achmage: Open chat"** 커맨드로 채팅 뷰를 엽니다.
2. **설정 → CMDS Achmage**에서 제공자와 API 키를 추가하거나 Plan 모드를 설정합니다. 벡터 검색을 쓰려면 임베딩 모델도 추가합니다.
3. 채팅 입력창에서 `@`로 노트·폴더를 멘션하고 질문을 적어 보냅니다. 멘션한 파일이 답변의 맥락이 됩니다.
4. **현재 노트 수정**: 컴포저의 펜 아이콘(**Edit note**)을 켜고 바꿀 내용을 말합니다. 답변 카드마다 **Apply**가 있고, 카드가 두 장 이상이면 **Apply all**이 생깁니다. 노트를 통째로 다시 쓴 블록에도 **Apply changes**가 붙어 달라진 문단만 반영합니다.
5. **인라인 편집**: 텍스트를 선택하고 ⇧⌘K. **Output: Text edit**은 선택 부분을 고쳐 쓰고, **Output: Image**는 프롬프트(비어 있으면 선택 텍스트)로 이미지를 만들어 진행 상황·미리보기·Insert / Send to Eagle / Copy / Keep을 패널 안에서 바로 보여 줍니다.
6. 임베딩 검색을 쓰려면 **"CMDS Achmage: Rebuild entire vault index"**를 한 번 실행하고, 이후 **"CMDS Achmage: Update index for modified files"**로 갱신합니다.

모든 커맨드는 명령 팔레트(Ctrl/Cmd-P)에서 "CMDS Achmage" 접두어로 찾을 수 있습니다.

### 커맨드

| 커맨드 | 하는 일 |
| --- | --- |
| Open chat | 채팅 패널 열기 |
| Add selection to chat | 선택 블록을 컨텍스트로 추가 |
| Inline edit selection (⇧⌘K) | 선택 부분 인라인 편집, Output 스위치로 이미지 생성 |
| Generate image (text to image)… | 모달: 브리프·템플릿·모델·장수·참조 이미지 |
| Generate image from selection | 선택 텍스트를 브리프로(길면 먼저 요약) |
| Generate image from current note | 노트를 브리프로 요약, 수정 후 생성 |
| Generate image from clipboard image (image to image)… | 클립보드 이미지를 참조로 첨부 |
| Render selection as image card (text as image) | PNG 인용 카드, 저장 + 복사 + 임베드 |
| Convert clipboard image to Markdown (auto structure) / list / table / Mermaid diagram | 비전 → 마크다운을 커서 위치에 |
| Review document edit jobs | 문서 단위 작업 재개·검토 |
| Rebuild entire vault index / Update index for modified files | 임베딩 인덱스 |

에디터 우클릭 메뉴에서 인라인 편집, 선택/노트→이미지, 텍스트 카드를 바로 실행할 수 있습니다.

### 이미지 생성

생성된 이미지는 항상 볼트 출력 폴더에 먼저 저장됩니다. 나머지는 **설정 → CMDS Achmage → Writing**에서 정합니다.

- **Image model** — GPT Plan 모델은 구독으로, Gemini·Grok 이미지 모델은 해당 제공자의 API 키로 동작합니다. 이미지 전용 모델은 채팅 모델 목록에 나타나지 않습니다.
- **Image destination** — 태스크 카드에서 매번 선택, 볼트 보관, Eagle 라이브러리 전송, CMDS Eagle 클라우드 업로드. Eagle은 라이브러리(Eagle 열람 이력 + CMDS Eagle이 기억하는 라이브러리), 폴더, 노트 링크 형식(볼트 임베드 / Eagle 원본 파일 / 딥링크), 태그, 볼트 복사본 삭제 여부를 정합니다.
- **Image prompt templates** — 이미지 모드에서 고르는 슬롯(CMDS 일러스트, 인포그래픽, 개념도, 아이콘 세트, 실사, 직접 추가). **Default template per purpose**로 진입점마다 기본값을 둡니다.
- **Always-on image instructions** — 모든 진입점의 모든 이미지 프롬프트 끝에 붙는 공통 지시문(예: "이미지 안에 한글이나 글자를 넣지 말 것").
- **Copy generated images to the clipboard**, **Text card** 스타일·폭·브랜드 마크, **Clipboard image analysis model**.

GPT Plan과 Gemini 이미지 모델은 참조 이미지(image to image)를 받고, grok-imagine은 텍스트 전용입니다.

### 외관

**설정 → CMDS Achmage → Appearance**에서 원클릭 프리셋(Follow Obsidian theme, CMDS Studio / Console, CMDS Operator Console, Neon Lime Console, Hallym Conversation Studio, Theme colors with neon glow)을 고르거나 **Base skin**·**Accent**·**Glow** 세 항목을 따로 조합합니다. 정확한 색과 크기는 [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) 플러그인의 **CMDS Achmage** 섹션에서 조정합니다. 에디터나 다른 패널, 다른 플러그인은 건드리지 않습니다.

## Plan 모드를 쓰기 전에

- Plan 연결은 **구독 인증과 비공개 백엔드를 사용하는 실험 기능**입니다. 제공자의 정책이나 백엔드가 바뀌면 예고 없이 멈출 수 있고, 그때 다른 모델로 자동 대체하지 않습니다.
- 각 제공자는 제3자 도구에 API 인증을 쓰도록 권장합니다. 연결 전에 본인 계정의 정책과 위험 안내를 확인하세요.
- 업데이트 전에는 플러그인 폴더와 `data.json`을 백업해 두세요.
- API 키로 쓰는 일반 모델은 이 기능과 무관하게 그대로 동작합니다.

## 만드는 사람들

구요한([커맨드스페이스](https://cmdspace.work), [CMDSPACE-DEV](https://github.com/CMDSPACE-DEV))과 안창현 교수가 공동 개발합니다. 협업 방식은 [docs/CMDS-COLLABORATION.md](docs/CMDS-COLLABORATION.md)에 정리돼 있습니다.

## 출처

이 플러그인은 옵시디언 커뮤니티 플러그인 [Smart Composer](https://github.com/glowingjade/obsidian-smart-composer)를 포크한 것에서 시작되었습니다. 이어받아 온 이름과 버전의 변천은 [LINEAGE.md](LINEAGE.md)에, 설계 결정은 `docs/research/`의 번호 붙은 보고서(R-001 …)에 기록해 두었습니다.

## 라이선스

MIT
