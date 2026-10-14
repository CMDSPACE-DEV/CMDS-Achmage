# CMDS Achmage 1.3.1

## More reliable desktop connections and a smaller plugin

**Requires Obsidian desktop 1.13.0 or later.** Update Obsidian before installing this version.

### Connections and everyday use

- **Claude Team/Enterprise accounts can opt in.** Allow an organization account on this device from the Claude Plan card. You can revoke that choice. Organization-managed policy and billing can apply; review the explanation before allowing it. Team login and a chat response were verified on macOS. Windows Team and all Enterprise logins remain unverified.
- **macOS Claude login finds the terminal's login directory.** When the app has no explicit `CLAUDE_CONFIG_DIR`, it can recover the terminal setting instead of looking in a different directory and treating an existing login as missing.
- **Copy a prompt directly.** The prompt copy button copies the prompt text to the clipboard.
- **Older MCP servers connect automatically.** A streamable-HTTP connection falls back to SSE for SSE-only servers without requiring a setting change. Existing explicit legacy-SSE connections keep working.
- **Find plugin settings through Obsidian search.** The settings entry supports Obsidian 1.13's settings search.
- **Choose your own inline-edit shortcut.** The default Mod+Shift+K binding has been removed to avoid conflicts. Assign **Inline edit selection** in **Settings → Hotkeys** if you want a shortcut.
- **Popout windows behave more reliably.** Window-dependent UI and timer handling follow the appropriate Obsidian window.
- **Chat-save failures are visible.** If chat history cannot be saved, a notice now explains the failure instead of leaving it silent.

### Size and maintenance

- **The plugin is below 5 MB.** Exact tokenizer data is compressed inside `main.js` and decoded once, on the first token calculation. No language, provider, or other feature is removed, and no separate data download is needed. This keeps the file below Obsidian Sync Standard's 5 MB limit.
- **Dependency and security updates.** Runtime dependency audit findings are cleared. Some development-tool findings remain documented; this is not a claim that every dependency audit finding is resolved.
- **CSS cleanup.** Styles were cleaned up with no intended visual change.

### Verification limits

macOS Team opt-in, chat, and revocation have live evidence; Windows Team and Enterprise remain unverified. Before release, compare actual Obsidian plugin load time and confirm a long chat shows token usage. Automated compressed-data checks establish exact rank data/token IDs and lazy one-time decoding, not real-app startup time. Final integrated automated-check results are recorded in the release preparation PR.

---

## 한국어

**Obsidian 데스크톱 1.13.0 이상이 필요합니다.** 설치 전에 Obsidian을 업데이트하세요.

### 연결과 일상 사용

- **Claude Team/Enterprise 계정 허용**: Claude Plan 카드에서 이 기기의 조직 계정 사용을 허용하고 언제든 철회할 수 있습니다. 조직 정책과 과금이 적용될 수 있으므로 안내를 확인한 뒤 허용하세요. macOS에서 Team 로그인과 채팅 응답을 확인했습니다. Windows Team 및 모든 Enterprise 로그인은 아직 미검증입니다.
- **macOS Claude 로그인 디렉터리 수정**: 앱에 `CLAUDE_CONFIG_DIR`이 따로 지정되지 않았으면 터미널의 설정을 찾아 사용합니다. 터미널에서 이미 로그인했는데 앱이 다른 디렉터리를 보아 로그인을 찾지 못하는 문제를 줄입니다.
- **프롬프트 복사 버튼**: 버튼으로 프롬프트 텍스트를 클립보드에 복사할 수 있습니다.
- **기존 MCP 서버 자동 연결**: streamable-HTTP 연결은 SSE만 지원하는 서버에서 자동으로 SSE를 사용합니다. 사용자가 설정을 바꿀 필요가 없으며 기존의 명시적 legacy-SSE 연결도 유지합니다.
- **Obsidian 설정 검색 지원**: Obsidian 1.13의 설정 검색에서 플러그인 설정을 찾을 수 있습니다.
- **인라인 편집 단축키 직접 지정**: 충돌을 피하기 위해 기본 Mod+Shift+K 바인딩을 제거했습니다. 필요하면 **설정 → 단축키**에서 **Inline edit selection** 명령에 원하는 키를 지정하세요.
- **팝아웃 창 동작 개선**: 창에 의존하는 UI와 타이머 처리가 해당 Obsidian 창을 따르도록 개선했습니다.
- **채팅 저장 실패 알림**: 채팅 기록을 저장하지 못하면 이제 알림으로 실패를 알려 줍니다.

### 용량과 유지보수

- **플러그인 5MB 미만**: 정확한 토크나이저 데이터를 `main.js` 안에 압축하고 첫 토큰 계산 때 한 번만 해제합니다. 언어·모델 제공자 등 기능을 제거하거나 별도 데이터를 다운로드하지 않으며, Obsidian Sync Standard의 5MB 파일 한도 아래로 줄였습니다.
- **의존성·보안 업데이트**: 운영 의존성 감사 항목을 해결했습니다. 일부 개발 도구의 감사 항목은 사유와 함께 남아 있으며 모든 의존성 감사 항목이 해결됐다는 뜻은 아닙니다.
- **CSS 정리**: 의도한 외형 변경 없이 스타일을 정리했습니다.

### 검증 범위

macOS Team 허용·채팅·철회는 실제 사용 증거가 있고 Windows Team·Enterprise는 미검증입니다. 릴리스 전에 실제 Obsidian의 플러그인 로드 시간을 비교하고 긴 채팅의 토큰 표시를 확인해야 합니다. 자동 압축 검사는 정확한 데이터·토큰 ID와 지연 1회 해제를 검증하며 실제 앱 시작 시간을 대신하지 않습니다. 최종 통합 자동 검사 결과는 릴리스 준비 PR에 기록합니다.
