[![English](https://img.shields.io/badge/English-README-134538)](README.md) [![한국어](https://img.shields.io/badge/한국어-README-E985A2)](README.ko.md)

# CMDS Achmage
Obsidian 안에서 노트를 AI의 맥락으로 제공하고 편집을 검토하며 자료 조사와 이미지 제작을 이어갑니다.

**버전 1.1.0 | 커뮤니티 플러그인에서 설치할 수 있습니다.**

Obsidian 1.11.4 이상 | 데스크톱 전용.

## 주요 활용
- 노트, 선택 영역, 폴더로 대화하고 포함된 맥락을 확인합니다.
- 기존 문장에 연결한 편집, 인라인 수정, 체크포인트가 있는 긴 문서 초안을 검토합니다.
- 명시한 실행 정책 아래 리서치 API와 MCP 도구를 연결합니다.
- 이미지 생성, 로컬 텍스트 카드, 선택적 Eagle 전송을 제공합니다.

## 설치와 첫 사용
**커뮤니티 설치:** 설정 → 커뮤니티 플러그인 → 탐색 → **CMDS Achmage** → 설치 → 활성화.

**수동 설치:** [1.1.0 릴리스](https://github.com/CMDSPACE-DEV/CMDS-Achmage/releases/tag/1.1.0)의 `main.js`, `manifest.json`, `styles.css`를 `<vault>/.obsidian/plugins/cmds-achmage/`에 넣고 다시 로드한 뒤 활성화합니다. 기존 설정을 백업하고 다른 사용자의 `data.json`을 복사하지 않습니다.

**Advanced → Providers/Models**에서 API 제공업체와 채팅 모델을 설정합니다. **Writing → Include current file**을 확인하고 도구 연결 전 **MCP → Tool execution → Per-tool approvals**로 바꿉니다. **Open chat**에서 `@`로 예제 노트를 멘션해 좁은 질문 하나를 보냅니다.

## 설명서
- [English user guide](docs/guide.md)
- [한국어 사용설명서](docs/guide.ko.md)
- [Web manual](https://apps.cmdspace.work/plugins/cmds-achmage/)
- [Product family](https://apps.cmdspace.work/plugins/)
- [Issues and support](https://github.com/CMDSPACE-DEV/CMDS-Achmage/issues)

## 개인정보와 한계
API 사용료와 구독료는 별개입니다. Plan 인증은 공식 서드파티 권한을 보장하지 않는 실험 기능입니다. MCP 기본값은 **Full auto**로 활성 쓰기/삭제도 Allow 질문 없이 실행할 수 있고 현재 노트 자동 포함은 기본 켜짐입니다. 개인 자료를 보내기 전에 확인합니다.

## 개발
```sh
npm ci
npm run type:check
npm run lint:check
npm test
npm run build
```
로컬 개발용 플러그인 파일을 빌드합니다.

## 제작자와 라이선스
**Yohan Koo (CMDSPACE)**, https://cmdspace.work, **안창현 교수**가 함께 개발합니다.

**Heesu Suh**의 [Smart Composer](https://github.com/glowingjade/obsidian-smart-composer)에서 출발한 포크입니다. 이름/버전 계보는 [LINEAGE.md](LINEAGE.md), 과거 협업 기록은 [협업 문서](docs/CMDS-COLLABORATION.md)를 참고합니다. **MIT**, [LICENSE](LICENSE)의 **Copyright (c) 2024 Heesu Suh**와 원저작권/허가문을 유지합니다.
