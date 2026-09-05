# 계보 (Lineage)

CMDS Achmage는 새로 시작한 플러그인이 아니라, 이어받아 온 코드 위에 서 있습니다. 어디에서 와서 어떤 이름과 버전을 거쳐 왔는지 이 문서에 남깁니다.

## 이름의 변천

| 단계 | 플러그인 id | 이름 | 저작자 | 저장소 |
|---|---|---|---|---|
| 원본 | `smart-composer` | Smart Composer | Heesu Suh | [glowingjade/obsidian-smart-composer](https://github.com/glowingjade/obsidian-smart-composer) |
| 안창현 교수 포크 | `smart-composer` | Smart Composer (릴리스 제목 `Smart_composer_Achmage`) | Heesu Suh (원본 유지) | laguna821/obsidian_smart_composer_Achmage |
| **리브랜딩(현재)** | **`cmds-achmage`** | **CMDS Achmage** | **CMDSPACE-DEV** | [CMDSPACE-DEV/CMDS-Achmage](https://github.com/CMDSPACE-DEV/CMDS-Achmage) |

## 버전의 변천

안창현 교수가 원본을 포크해 이어 온 버전 이력입니다. 아래 태그와 릴리스 노트는 이 저장소에 그대로 보존되어 있습니다.

- **이어받은 버전**: `1.3.1` · `1.4.0` · `2.0.0`–`2.0.14` · `2.1.1` · `2.4.0` · `2.5.0` · `2.5.5` · `2.6.1`–`2.6.5`
- **기준점**: `2.6.5` (2026-08-10) — 조직 저장소로 이관한 시점
- **파이프라인 검증용**: `2.6.6-test.1` · `2.6.6-test.2` · `2.6.6-test.3` — 제품 릴리스가 아니라 조직 저장소의 릴리스 자동화를 확인하기 위한 태그
- 각 시점의 릴리스 노트는 저장소 루트의 `RELEASE_NOTES_*.md`로 남아 있습니다.

## 왜 1.0.0으로 다시 시작하나

`cmds-achmage`는 이전과 **다른 플러그인 id**입니다. 옵시디언은 플러그인을 id로 구분하므로, 이 id로 설치된 사용자는 아직 없습니다. 그래서 이어받은 코드의 성숙도와 무관하게, **새 이름의 첫 정식 배포**라는 사실을 그대로 드러내기 위해 `1.0.0`에서 다시 시작합니다. 이어받은 `2.6.5`까지의 이력은 위에 기록해 보존합니다.

원본에 대한 감사와 출처는 [README](README.md#출처)에 밝혀 두었습니다.
