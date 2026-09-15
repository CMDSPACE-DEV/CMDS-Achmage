# CMDS Achmage 1.2.0

## Read every model name and edit notes with clearer boundaries

### Improvements

- Slash menus no longer defer opening through a low-priority transition. Loading, empty, and error states are visible, and Enter cannot send a slash command while its templates are still loading.
- Create template appears after deliberate pointer or keyboard selection, not during Korean IME composition.
- Prompt template creation and editing work in standalone dialogs again. Slash search supports spaces, hyphens, and non-Latin names; insertion preserves surrounding text and paragraph boundaries. Enter adds a newline in template forms, and empty content is rejected.

- Model menus open outside the chat pane's clipping boundary, size to their content within the window, and wrap long identifiers instead of clipping them. The selected-model button also wraps rather than stopping at 240px.
- Optional CMDS Obsidian editing rules guide chat and inline edits.
- Note editing keeps changes below the YAML frontmatter boundary.
- Settings are organized into labelled sections with a properly pinned tab bar.
- English and Korean introductions and comprehensive user guides are unified.
- External integrations identify the plugin consistently as CMDS Achmage; the repository root and released-version history are cleaned up.

### Verification

- Model picker regression coverage checks portal placement, keyboard selection, and disabled/image-only model filtering.
- Full unit tests, type checks, lint, bundle budget, minimum-app-version validation, and the community-review Error gate are checked before release.

---

## 한국어

- 한글 조합 입력을 드래그 선택으로 오인하지 않도록 수정했습니다. 슬래시 메뉴의 지연 예약을 제거하고 로딩·빈 목록·오류 상태를 표시하며, 로딩 중 Enter 전송을 방지합니다.
- 프롬프트 템플릿 저장·수정 창을 복구했습니다. 공백·하이픈·한국어 이름의 슬래시 검색과 여러 문단 삽입을 개선하고, 본문의 Enter는 줄바꿈으로 동작합니다.

- 모델 목록이 채팅 패널 경계에 잘리지 않도록 수정했습니다. 창 크기에 맞춰 너비를 제한하고, 긴 모델 이름과 선택 버튼은 줄바꿈합니다.
- 채팅·인라인 편집에 적용할 CMDS Obsidian 편집 규칙을 선택적으로 사용할 수 있습니다.
- 노트 수정이 YAML frontmatter 영역을 침범하지 않도록 보호합니다.
- 설정 화면을 항목별 섹션으로 정리하고 탭 바 고정을 개선했습니다.
- 한국어·영어 사용자 가이드와 외부 시스템 식별자를 정비했습니다.
