# CMDS Achmage 1.3.3

## Mermaid diagrams with Pele, and Windows npm Claude Code

**Requires Obsidian desktop 1.13.0 or later.**

- **New diagrams are Mermaid source with a Pele preview.** New diagram requests no longer require Excalidraw. The note stores readable Mermaid text; Pele renders the preview. Existing Excalidraw files are kept as they are and are not converted.
- **AI drafts a diagram and you accept it before it is saved.** Revisions are previewed first, and saving checks for conflicting edits.
- **Authoring board with undo.** Each supported diagram type has a bounded source-mapped editor. Full direct manipulation of the rendered SVG is not complete.
- **Windows finds an npm-installed Claude Code** (#103). The plugin now uses the real `claude.exe` inside the npm package instead of npm's `claude.cmd` launcher. Press **Diagnose** again after updating. npm installations are not updated by the **Update** button; run `npm update -g @anthropic-ai/claude-code`.
- **`main.js` is now above 5 MB.** Obsidian Sync Standard (5 MB file limit) cannot sync this plugin file; Sync Plus (200 MB) can.

### Verification limits

Automated tests, type checks and the diagram adapter checks pass. Pending: real Obsidian checks of preview, editing, AI generation and the new creation menu; a Windows device with only an npm Claude Code installation.

---

## 한국어

## Pele 기반 Mermaid 다이어그램, Windows npm Claude Code 인식

**Obsidian 데스크톱 1.13.0 이상이 필요합니다.**

- **새 다이어그램은 Mermaid 원문 + Pele 미리보기로 만듭니다.** 새 다이어그램을 만들 때 Excalidraw가 필요 없습니다. 노트에는 읽을 수 있는 Mermaid 글이 저장되고, 미리보기는 Pele가 그립니다. 기존 Excalidraw 파일은 그대로 두며 변환하지 않습니다.
- **AI가 만든 다이어그램은 수락해야 저장됩니다.** 수정안도 먼저 미리 보여 주며, 저장할 때 다른 편집과 충돌하는지 확인합니다.
- **편집 보드와 되돌리기.** 지원하는 다이어그램 유형마다 원문과 연결된 편집기가 있습니다. 그려진 그림을 직접 자유롭게 조작하는 기능은 아직 완성되지 않았습니다.
- **Windows에서 npm으로 설치한 Claude Code를 인식합니다** (#103). npm 실행 도우미(`claude.cmd`) 대신 npm 패키지 안의 실제 `claude.exe`를 사용합니다. 업데이트 후 **Diagnose**를 다시 누르세요. npm 설치본은 **Update** 버튼으로 업데이트되지 않으니 `npm update -g @anthropic-ai/claude-code`를 실행하세요.
- **`main.js`가 5MB를 넘습니다.** Obsidian Sync Standard(파일당 5MB 제한)에서는 이 플러그인 파일이 동기화되지 않고, Sync Plus(200MB)에서는 동기화됩니다.

### 검증 범위

자동 테스트, 타입 검사, 다이어그램 유형별 검사를 통과했습니다. 실제 Obsidian에서의 미리보기·편집·AI 생성·새 생성 메뉴 확인, npm으로만 Claude Code를 설치한 Windows PC 확인은 남아 있습니다.
