# CMDS Achmage 1.3.2

## Inline edit styling fix for the community review

**Requires Obsidian desktop 1.13.0 or later.**

- **Inline edit styles now load from `styles.css`.** The inline edit panel no longer creates a `<style>` element at runtime; its rules live in the plugin stylesheet that Obsidian loads, scoped under `.smtcmp-inline-host`. This resolves the 1.3.1 community-review error. No visual change is intended.
- Because the panel no longer uses Shadow DOM isolation, a theme with very broad `!important` rules may now affect the inline edit panel.

### Verification limits

Automated tests, type checks, and the local community-review error gate pass. Visual checks in real Obsidian (default and custom themes, Korean IME, popout windows) are still pending.

---

## 한국어

## 커뮤니티 심사 대응: 인라인 편집 스타일 수정

**Obsidian 데스크톱 1.13.0 이상이 필요합니다.**

- **인라인 편집 스타일을 `styles.css`에서 불러옵니다.** 인라인 편집 패널이 실행 중에 `<style>` 요소를 만들지 않고, Obsidian이 로드하는 플러그인 스타일시트(`.smtcmp-inline-host` 범위)를 사용합니다. 1.3.1 커뮤니티 심사 오류를 해결합니다. 의도한 화면 변화는 없습니다.
- Shadow DOM 격리를 쓰지 않으므로, `!important`를 넓게 쓰는 테마는 인라인 편집 패널에 영향을 줄 수 있습니다.

### 검증 범위

자동 테스트, 타입 검사, 로컬 커뮤니티 심사 Error 게이트를 통과했습니다. 실제 Obsidian에서의 화면 확인(기본·사용자 테마, 한국어 IME, 팝아웃 창)은 남아 있습니다.
