# CMDS Achmage 1.3.0

## Current models without waiting for a release, and research sources that work without optional keys

### Models

- **OpenAI Plan finds new models automatically.** On every launch, the plugin reads the model catalog of your ChatGPT account (the same catalog Codex uses) and adds any model the picker lacks. A "모델 목록 새로 고침" button on the OpenAI Plan card runs the same check on demand. Models you added or disabled yourself are never changed.
- **"새 모델 확인" for API keys.** Settings → Models lists chat models your API keys can reach but the picker does not have yet. Nothing is added until you tick it.
- **New defaults for fresh installs.** Claude Opus 5.5, Sonnet 5.5, and Haiku 5.5; GPT-6.1 Sol and GPT-6 Luna; Gemini 3.1 Pro (preview), 3.8 Flash, and 3.5 Flash-Lite. Existing vaults receive these entries without losing their own choices.
- **Shut-down Gemini model handled.** Google has shut down `gemini-3-pro-preview`. API entries that use it are disabled. Any chat, inline-edit, or image-analysis selection pointing at it moves to `gemini-3.1-pro-preview`.
- **GPT-6 Plan reasoning control.** The composer's quick reasoning switch now covers GPT-6 Plan models.

### Research connections

- **Korean Law MCP works without an OC.** The public server answers with the operator's shared key when no OC is sent. Your own OC is optional and bypasses that shared quota. The card shows **Shared quota** while the shared key is in use.
- **OpenAlex works without an API key.** OpenAlex grants a keyless daily allowance. A free key raises it tenfold and is sent only when stored. The card shows **Keyless** while no key is stored.
- **KCI returns results for ordinary queries.** Searches use the keyword field, which covers titles, abstracts, and author keywords. Paging works. A search with no matches stays empty instead of showing one untitled result. The new "Search field" option keeps title-only lookups.
- **Moving to another computer.** API keys and the OC stay in each computer's Obsidian SecretStorage and are never synced. On a new computer, enter them again for sources that require them (for example NAVER and ScienceON).

### Verification

- Unit tests (812), type checks, lint, bundle budget, and the community-review Error gate pass.
- Live checks: an OpenAI Plan account catalog read, chat turns on a discovered GPT-6 Plan model, Korean Law MCP connected with all tools and a statute search returning results, and an OpenAlex search without a key.

---

## 한국어

- **OpenAI Plan 신모델 자동 반영**: 실행할 때마다 ChatGPT 계정의 모델 목록(Codex와 같은 목록)을 읽어 피커에 없는 모델을 추가합니다. OpenAI Plan 카드의 "모델 목록 새로 고침"으로 바로 확인할 수도 있습니다. 직접 추가하거나 꺼 둔 모델은 바꾸지 않습니다.
- **API 키용 "새 모델 확인"**: 설정 → 모델에서 내 API 키로 쓸 수 있지만 피커에 없는 모델을 보여 줍니다. 체크한 모델만 추가됩니다.
- **최신 기본 모델**: Claude Opus·Sonnet·Haiku 5.5, GPT-6.1 Sol·GPT-6 Luna, Gemini 3.1 Pro(preview)·3.8 Flash·3.5 Flash-Lite를 기본으로 제공합니다. 기존 볼트에도 사용자 설정을 유지한 채 추가됩니다.
- **종료된 Gemini 모델 정리**: 서비스가 끝난 `gemini-3-pro-preview` API 항목은 끄고, 이 모델을 가리키던 선택은 `gemini-3.1-pro-preview`로 옮깁니다.
- **Korean Law MCP는 OC 없이도 동작**: OC가 없으면 운영자의 공용 키로 응답합니다. 본인 OC는 선택 사항이며, 넣으면 공용 한도를 거치지 않습니다. 공용 키를 쓰는 동안 카드에 **Shared quota**가 표시됩니다.
- **OpenAlex는 API 키 없이도 동작**: 키 없이 쓸 수 있는 일일 한도가 있고, 무료 키를 넣으면 10배로 늘어납니다. 키가 없는 동안 카드에 **Keyless**가 표시됩니다.
- **KCI 검색 개선**: 제목·초록·저자 키워드를 함께 검색해 일반 질의에도 결과가 나오고, 페이지 넘김이 동작하며, 결과가 없을 때 "제목 없음" 항목이 생기지 않습니다.
- **다른 컴퓨터로 옮길 때**: API 키와 OC는 컴퓨터마다 Obsidian SecretStorage에 따로 저장되며 동기화되지 않습니다. NAVER·ScienceON처럼 키가 필요한 소스는 새 컴퓨터에서 다시 입력하세요.
