# CMDS Achmage

A plugin for using AI agents as real working tools inside Obsidian. It is built by
CMDSPACE together with Professor Changhyun Ahn.

> **Desktop only.** CMDS Achmage relies on desktop-level capabilities (MCP
> connections, native runtimes, and shell execution), so it does not run on
> Obsidian Mobile.

## What it can do

- **Note-grounded AI chat** — mention notes and folders in the chat box to pull
  them into the conversation. Only the material you are actually discussing is
  sent, instead of scanning the whole vault.
- **Folder reading and search (RAG)** — mention a whole folder and it is read in
  one of three ways (automatic, focused, or exhaustive) depending on the
  situation. Embedding search and rerank search are combined, and **folder
  mentions work even without an embedding API key.**
- **Inline editing** — select just the part of a note you want to change and edit
  it in place, without rewriting the whole document.
- **Document-scale editing** — an editing mode that works over a long document as a
  whole, for when several places need to change at once.
- **Image generation** — create images inside the conversation and drop them
  straight into a note.
- **Plan connections** — an experimental feature that borrows the authentication
  of subscription accounts (Claude Pro/Max, Gemini, GPT-family) so you can use them
  without an API key, with a per-model reasoning-effort setting you can switch right
  from the chat input.
- **Research — built-in MCP tools** — the plugin calls academic and public
  databases directly. See below.
- **MCP tool connections** — beyond the built-in tools, connect your own external
  MCP servers. Only reviewed tools are exposed.
- **Background tasks** — push long-running work to the background and keep working.

## Built-in MCP research tools

The research feature is **a bundle of official databases connected over MCP**.
Rather than scraping the web, it calls each institution's official API, so it
returns metadata with a clear source. Turn on only what you need and provide each
service's own API key; keys are stored separately.

- **International academic**: Web of Science Starter, Crossref + Retraction Watch,
  OpenAlex, PubMed, Europe PMC
- **Korean academic**: KCI, ScienceON, RISS Linked Data
- **Korean public / legal**: Korean Law MCP, OpenDART, NTIS, KOSIS MCP
- **News / web**: NAVER API HUB Search

## Installation

### Community plugins

In Obsidian, go to **Settings → Community plugins → Browse**, search for
`CMDS Achmage`, install it, and enable it.

### Manual installation

Download `main.js`, `manifest.json`, and `styles.css` from the
[Releases page](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases), place them
in your vault's `.obsidian/plugins/cmds-achmage/` folder, and restart Obsidian.

## Usage

1. **Enable the plugin**, then open the chat view with the ribbon icon (wand) or
   the command **"CMDS Achmage: Open chat"**.
2. **Add a model**: open **Settings → CMDS Achmage**, add a provider with its API
   key, or set up Plan mode (see below). Optionally add an embedding model for
   vector search.
3. **Chat with your notes**: in the chat input, type `@` to mention a note or
   folder, write your question, and send. Mentioned files become the context for
   the answer.
4. **Add a selection**: with text selected in a note, run
   **"CMDS Achmage: Add selection to chat"**.
5. **Inline edit**: select text in a note and run
   **"CMDS Achmage: Inline edit selection"** to rewrite just that part.
6. **Index the vault** (for embedding search): run
   **"CMDS Achmage: Rebuild entire vault index"** once, then
   **"CMDS Achmage: Update index for modified files"** as your notes change.

All commands are available from the command palette (Ctrl/Cmd-P), prefixed with
"CMDS Achmage".

### Appearance

The Chat pane and the Inline edit panel follow your Obsidian theme by default.
**Settings → CMDS Achmage → Appearance** offers one-click presets (Follow
Obsidian theme, CMDS Studio / Console, CMDS Operator Console, Neon Lime Console,
Hallym Conversation Studio, Theme colors with neon glow) and three independent
dials underneath: **Base skin**, **Accent**, and **Glow**. Exact colors and sizes
(accent, text on accent, heading color, motion color, glow strength, corner
radius, UI text sizes, line height) are in the
[Style Settings](https://github.com/mgmeyers/obsidian-style-settings) plugin
under the **CMDS Achmage** section and apply on top of the chosen preset.
Nothing here restyles the editor, other panes, or other plugins.

### Generated images and Eagle

Every generated image is saved to the vault output folder first. **Settings →
CMDS Achmage → Image destination** decides what happens next: ask on the task
card, keep in the vault, send to an [Eagle](https://eagle.cool) library, or
upload through the CMDS Eagle plugin's cloud provider. For Eagle you pick the
library (Eagle's own history plus CMDS Eagle's remembered libraries), the
folder, the link style the note receives (vault embed, Eagle original file, or
deep link), tags, and whether to drop the vault copy afterwards.

Image generation runs on the GPT Plan models (subscription) or on Gemini and
Grok image models with an API key. **Settings → CMDS Achmage → Image model**
picks the model; image mode in the composer offers **prompt template slots**
(CMDS illustration, infographic, concept diagram, icon set, photorealistic,
plus your own). Four commands turn a copied screenshot into note content:
**Convert clipboard image to Markdown (auto structure)**, **… to Markdown
list**, **… to Markdown table**, **… to Mermaid diagram**.

Image generation has four doors besides the composer's wand icon: **Generate
image (text to image)…**, **Generate image from selection**, **Generate image
from current note** (the chat model condenses the note into a brief you can
edit), and **Generate image from clipboard image (image to image)…**. The
editor context menu offers the selection / note variants. The modal takes a
template, model, count, and reference images (clipboard or any vault image);
GPT Plan and Gemini image models use references, grok-imagine is text-only.
**Edit note** (pen icon in the composer) asks for changes to the current
note; the reply comes back as edit cards anchored to existing sentences and
**Apply** patches the note in place, deterministically, with no second model
call.

The inline edit panel (⇧⌘K) has an **Output** switch: *Image* sends the
prompt, or the selected text when the prompt is empty, to the image queue with
a guide template of your choice.

## Before using Plan mode

- Plan connections are **an experimental feature that uses subscription
  authentication and a private backend.** If a provider's policy or backend
  changes, it may stop without notice, and it will not automatically fall back to
  another model.
- Each provider recommends using API authentication with third-party tools. Check
  your own account's policy and risk guidance before connecting.
- Back up your plugin folder and `data.json` before updating.
- Regular models used with an API key keep working independently of this feature.

## Credits

Developed by CMDSPACE ([CMDSPACE-DEV](https://github.com/CMDSPACE-DEV)) together with
Professor Changhyun Ahn. The collaboration model is described in
[docs/CMDS-COLLABORATION.md](docs/CMDS-COLLABORATION.md).

## Provenance

This plugin started as a fork of the Obsidian community plugin
[Smart Composer](https://github.com/glowingjade/obsidian-smart-composer). The
lineage of the names and versions it inherited is recorded in
[LINEAGE.md](LINEAGE.md).

## License

MIT

---

# 한국어

옵시디언 안에서 AI 에이전트를 실제 작업 도구로 쓰기 위한 플러그인입니다.
커맨드스페이스와 안창현 교수가 함께 개발하고 있습니다.

> **데스크톱 전용입니다.** CMDS Achmage는 MCP 연결·네이티브 런타임·셸 실행 등
> 데스크톱 기능을 사용하므로 옵시디언 모바일에서는 동작하지 않습니다.

## 테세우스의 배

낡은 배를 고쳐 쓰다 보면 널빤지를 하나씩 갈아 끼우게 됩니다. 돛대를 바꾸고, 갑판을 새로 깔고, 이물과 고물까지 손을 대고 나면 어느 순간 처음 그 배의 나무는 한 조각도 남아 있지 않습니다. 그래도 이것은 같은 배인가 — 오래된 질문입니다.

CMDS Achmage도 남의 배에서 출발했습니다. 잘 만들어진 옵시디언 AI 플러그인 하나를 가져다 쓰기 시작했고, 매일 쓰다 보니 더 나아갈 수 있는 자리가 보였습니다. 노트를 쓰고 자료를 찾고 글을 고치는 흐름을 더 매끄럽게 만들 수 있는 지점들이었습니다. 그래서 판자를 덧대고 갈아 끼웠습니다. 모델을 붙이는 방식을 넓히고, 폴더를 읽는 방식을 늘리고, 편집이 일어나는 자리를 옮겼습니다.

**이 배가 최종적으로 어떤 모습이 될지는 우리도 모릅니다.** 정해두지 않았기 때문입니다. 우리가 매일 옵시디언에서 일하면서 더 좋은 방법을 발견하면 그 자리의 판자를 갈아 끼울 것이고, 그 과정이 이 플러그인의 개발 계획 그 자체입니다. 로드맵이 먼저 있고 그대로 만드는 것이 아니라, 쓰면서 배가 바뀝니다.

그러니 이 저장소를 지켜보신다면 완성된 제품이 아니라 **항해 중인 배**를 보고 계신 것입니다.

## 무엇을 할 수 있나

- **노트를 맥락으로 삼는 AI 대화** — 채팅창에서 노트와 폴더를 멘션해 대화에 끌어옵니다. 볼트 전체를 뒤지지 않고 지금 이야기 중인 자료만 정확히 올립니다.
- **폴더 읽기와 검색(RAG)** — 폴더를 통째로 멘션하면 자동·집중·전수 세 방식 중 상황에 맞게 읽습니다. 임베딩 검색과 재순위 검색을 함께 쓰며, **임베딩용 API 키가 없어도 폴더 멘션이 동작합니다.**
- **인라인 편집** — 노트 안에서 고칠 부분만 선택해 그 자리에서 수정합니다. 문서 전체를 다시 쓰지 않습니다.
- **문서 단위 편집** — 긴 문서를 통째로 다루는 편집 모드입니다. 여러 곳을 동시에 손봐야 할 때 씁니다.
- **이미지 생성** — 대화 안에서 이미지를 만들어 노트에 바로 넣습니다.
- **Plan 연결** — Claude Pro/Max, Gemini, GPT 계열 구독 계정의 인증을 그대로 빌려 쓰는 실험 기능입니다. API 키 없이 쓸 수 있고, 모델별 추론 강도(reasoning effort)를 따로 설정해 채팅 입력창에서 바로 바꿉니다.
- **리서치 — 내장 MCP 도구** — 학술·공공 데이터베이스를 플러그인이 직접 호출합니다. 아래 참고.
- **MCP 도구 연결** — 위 내장 도구 외에 원하는 외부 MCP 서버를 직접 붙입니다. 검토된 도구만 노출되도록 제한합니다.
- **백그라운드 작업** — 오래 걸리는 작업을 뒤로 돌리고 하던 일을 계속합니다.

## 내장 MCP 리서치 도구

리서치 기능은 **MCP로 연결된 공식 데이터베이스 묶음**입니다. 웹을 긁어오는 것이 아니라 각 기관이 제공하는 공식 API를 호출하므로, 출처가 분명한 메타데이터가 돌아옵니다. 필요한 것만 켜고 각자의 API 키를 넣어 쓰며, 키는 분리 보관됩니다.

**해외 학술**

- **Web of Science Starter** — Web of Science 코어 컬렉션(SSCI 포함) 검색
- **Crossref + Retraction Watch** — DOI 메타데이터와 정정·철회 이력 검증
- **OpenAlex** — 논문·저자·기관·인용 관계와 오픈액세스 위치 탐색
- **PubMed** — 생의학 문헌 메타데이터 검색
- **Europe PMC** — 생명과학 문헌·인용·연구비·오픈액세스 검색

**국내 학술**

- **KCI** — 한국학술지인용색인 논문 메타데이터
- **ScienceON** — 국내 과학기술 문헌 메타데이터
- **RISS Linked Data** — 국내 학위논문·서지 링크드데이터 조회

**국내 공공·법령**

- **Korean Law MCP** — 법령과 조문 조회
- **OpenDART** — 기업 공시 검색
- **NTIS** — 국가 R&D 과제 정보 검색
- **KOSIS MCP** — 국가통계 표와 메타데이터 조회

**뉴스·웹**

- **NAVER API HUB Search** — 국내 뉴스·웹·블로그 검색(본문이 아닌 스니펫)

## 설치

**커뮤니티 플러그인**
옵시디언 설정 → 커뮤니티 플러그인 → 찾아보기에서 `CMDS Achmage`를 검색해 설치합니다.

**수동 설치**
[릴리스 페이지](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases)에서 `main.js`, `manifest.json`, `styles.css` 세 파일을 받아 볼트의 `.obsidian/plugins/cmds-achmage/` 폴더에 넣고 옵시디언을 다시 시작합니다.

## 사용법

1. 플러그인을 켜고 리본 아이콘(지팡이)이나 **"CMDS Achmage: Open chat"** 커맨드로 채팅 뷰를 엽니다.
2. **설정 → CMDS Achmage**에서 제공자와 API 키를 추가하거나 Plan 모드를 설정합니다. 벡터 검색을 쓰려면 임베딩 모델도 추가합니다.
3. 채팅 입력창에서 `@`로 노트·폴더를 멘션하고 질문을 적어 보냅니다. 멘션한 파일이 답변의 맥락이 됩니다.
4. 노트에서 텍스트를 선택한 뒤 **"CMDS Achmage: Add selection to chat"**으로 선택 영역을 대화에 넣습니다.
5. 텍스트를 선택하고 **"CMDS Achmage: Inline edit selection"**으로 그 부분만 고쳐 씁니다.
6. 임베딩 검색을 쓰려면 **"CMDS Achmage: Rebuild entire vault index"**를 한 번 실행하고, 이후 **"CMDS Achmage: Update index for modified files"**로 갱신합니다.

모든 커맨드는 명령 팔레트(Ctrl/Cmd-P)에서 "CMDS Achmage" 접두어로 찾을 수 있습니다.

### 외관

채팅 패널과 인라인 편집 패널은 기본적으로 옵시디언 테마를 따릅니다. **설정 → CMDS Achmage → Appearance**에서 원클릭 프리셋(Follow Obsidian theme, CMDS Studio / Console, CMDS Operator Console, Neon Lime Console, Hallym Conversation Studio, Theme colors with neon glow)을 고르거나, 그 아래 **Base skin**·**Accent**·**Glow** 세 항목을 따로 조합할 수 있습니다. 정확한 색과 크기(액센트, 액센트 위 글자색, 제목색, 모션색, 발광 강도, 모서리 반경, UI 글자 크기, 줄 간격)는 [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) 플러그인의 **CMDS Achmage** 섹션에서 조정하며, 선택한 프리셋 위에 덧씌워집니다. 에디터나 다른 패널, 다른 플러그인은 건드리지 않습니다.

### 생성 이미지와 Eagle

생성된 이미지는 항상 볼트 출력 폴더에 먼저 저장됩니다. **설정 → CMDS Achmage → Image destination**에서 그 다음을 정합니다: 태스크 카드에서 매번 선택, 볼트에 보관, [Eagle](https://eagle.cool) 라이브러리로 전송, CMDS Eagle 플러그인의 클라우드 업로드. Eagle을 고르면 라이브러리(Eagle 열람 이력 + CMDS Eagle이 기억하는 라이브러리), 폴더, 노트에 들어갈 링크 형식(볼트 임베드 / Eagle 원본 파일 / 딥링크), 태그, 볼트 복사본 삭제 여부를 정할 수 있습니다.

이미지 생성은 GPT Plan 모델(구독) 또는 API 키를 넣은 Gemini·Grok 이미지 모델로 동작합니다. **설정 → CMDS Achmage → Image model**에서 모델을 고르고, 컴포저의 이미지 모드에서 **프롬프트 템플릿 슬롯**(CMDS 일러스트, 인포그래픽, 개념도, 아이콘 세트, 실사, 직접 추가)을 선택할 수 있습니다. 복사한 스크린샷을 노트 내용으로 바꾸는 명령 4개: **Convert clipboard image to Markdown (auto structure)**, **… to Markdown list**, **… to Markdown table**, **… to Mermaid diagram**.

이미지 생성 진입점은 컴포저 지팡이 아이콘 외에 네 가지입니다: **Generate image (text to image)…**, **Generate image from selection**, **Generate image from current note**(채팅 모델이 노트를 브리프로 요약해 주고 수정 후 생성), **Generate image from clipboard image (image to image)…**. 에디터 우클릭 메뉴에서도 선택/노트 버전을 실행할 수 있습니다. 모달에서 템플릿·모델·장수·참조 이미지(클립보드 또는 볼트 이미지)를 정하며, GPT Plan과 Gemini 이미지 모델은 참조 이미지를 쓰고 grok-imagine은 텍스트 전용입니다.
컴포저의 **Edit note**(펜 아이콘)로 현재 노트의 수정을 요청하면, 답변이 기존 문장에 앵커된 편집 카드로 오고 **Apply**를 누르면 두 번째 모델 호출 없이 결정론적으로 노트에 반영됩니다.

인라인 편집 패널(⇧⌘K)에는 **Output** 스위치가 있어, *Image*를 고르면 프롬프트(비어 있으면 선택한 텍스트)를 가이드 템플릿과 함께 이미지 큐로 보냅니다.

## Plan 모드를 쓰기 전에

- Plan 연결은 **구독 인증과 비공개 백엔드를 사용하는 실험 기능**입니다. 제공자의 정책이나 백엔드가 바뀌면 예고 없이 멈출 수 있고, 그때 다른 모델로 자동 대체하지 않습니다.
- 각 제공자는 제3자 도구에 API 인증을 쓰도록 권장합니다. 연결 전에 본인 계정의 정책과 위험 안내를 확인하세요.
- 업데이트 전에는 플러그인 폴더와 `data.json`을 백업해 두세요.
- API 키로 쓰는 일반 모델은 이 기능과 무관하게 그대로 동작합니다.

## 만드는 사람들

커맨드스페이스([CMDSPACE-DEV](https://github.com/CMDSPACE-DEV))와 안창현 교수가 공동 개발합니다. 협업 방식은 [docs/CMDS-COLLABORATION.md](docs/CMDS-COLLABORATION.md)에 정리돼 있습니다.

## 출처

이 플러그인은 옵시디언 커뮤니티 플러그인 [Smart Composer](https://github.com/glowingjade/obsidian-smart-composer)를 포크한 것에서 시작되었습니다. 이어받아 온 이름과 버전의 변천은 [LINEAGE.md](LINEAGE.md)에 기록해 두었습니다.

## 라이선스

MIT
