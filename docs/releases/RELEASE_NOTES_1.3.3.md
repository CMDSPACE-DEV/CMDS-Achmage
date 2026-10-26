# CMDS Achmage 1.3.3

## Inline edit input back in place, and npm-installed Claude Code on Windows

**Requires Obsidian desktop 1.13.0 or later.**

- **The inline edit input stays in its panel again.** In 1.3.2 the box where you describe an inline edit floated below the panel and covered the option rows and the Cancel and Generate buttons. Obsidian's own styles for its pop-up windows were reaching it. The input now uses a name those styles do not touch.
- **Windows finds an npm-installed Claude Code.** If you installed Claude Code with `npm install -g @anthropic-ai/claude-code`, the Claude Plan card previously failed with "Native runtime diagnosis failed" because it picked npm's `claude.cmd` launcher, which the plugin cannot start. The plugin now uses the real `claude.exe` inside the npm package. Update the plugin and press **Diagnose** again; no executable path setting is needed. If you had entered that path manually, you can keep it or clear it.
- Native installer, WinGet, and a custom path still take priority when present.
- npm installations are not updated by the **Update** button. Run `npm update -g @anthropic-ai/claude-code` in a terminal.

### Verification limits

The inline edit fix was checked in a real vault on Obsidian 1.15.0 with a community theme; the default theme and a popout window are pending. Automated tests cover the npm layout. A run of this build on a real Windows device that has only an npm installation is pending. Claude Code npm versions older than 2.1.120 ship no `claude.exe` and are still not detected; install the current version or use the native installer.

---

## 한국어

## 인라인 편집 입력창 위치 복구, Windows npm 설치 Claude Code 인식

**Obsidian 데스크톱 1.13.0 이상이 필요합니다.**

- **인라인 편집 입력창이 다시 제자리에 있습니다**: 1.3.2에서는 편집 지시를 적는 입력창이 패널 아래로 떠서 옵션 줄과 Cancel·Generate 버튼을 가렸습니다. Obsidian이 자기 팝업 창에 쓰는 스타일이 입력창에 걸렸기 때문입니다. 이제 그 스타일이 닿지 않는 이름을 씁니다.
- **npm 설치 Claude Code 자동 인식**: `npm install -g @anthropic-ai/claude-code`로 설치한 경우, 플러그인이 실행할 수 없는 npm 실행 도우미(`claude.cmd`)를 골라 "Native runtime diagnosis failed" 오류가 났습니다. 이제 npm 패키지 안의 실제 `claude.exe`를 사용합니다. 플러그인을 업데이트한 뒤 **Diagnose**를 다시 누르면 되며, 실행 파일 경로를 따로 넣지 않아도 됩니다. 이전에 경로를 직접 넣었다면 그대로 두거나 지워도 됩니다.
- 공식 설치 프로그램, WinGet, 직접 지정한 경로가 있으면 그쪽을 먼저 사용합니다.
- npm으로 설치한 경우 **Update** 버튼으로는 업데이트되지 않습니다. 터미널에서 `npm update -g @anthropic-ai/claude-code`를 실행하세요.

### 검증 범위

인라인 편집 수정은 Obsidian 1.15.0의 실제 볼트에서 커뮤니티 테마로 확인했습니다. 기본 테마와 팝아웃 창 확인은 남아 있습니다. npm 설치 구조는 자동 테스트로 확인했습니다. npm으로만 설치한 실제 Windows PC에서 이 빌드를 실행해 보는 확인은 아직 남아 있습니다. 2.1.120보다 오래된 Claude Code npm 버전에는 `claude.exe`가 없어 여전히 인식되지 않으므로, 최신 버전으로 업데이트하거나 공식 설치 프로그램을 사용하세요.
