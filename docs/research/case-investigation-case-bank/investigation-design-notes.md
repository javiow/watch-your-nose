# 조사 게임 설계 노트

`case-investigation-scenario-writer`가 새 케이스의 밸런싱을 잡을 때 참고하는 설계 규칙 모음.
사례 스키마 대신 자유 형식으로 정리한다.

## 채점 구조 (red-flag 원작, rule-based)

원작 `scoring.py`는 LLM을 쓰지 않는 순수 rule-based이며 이 프로젝트도 그대로 재구현한다
(ADR-010). 대략의 배점:

- 위험 신호 발견 40
- 증거 품질 20 (`CaseEvidenceDefinition.importance` 1/2 가중)
- 진술↔증거 모순 발견 15
- 조사 효율(포인트 소모 대비) 10
- 최종 판단(`endingOptions[].score`)

합을 0~100으로 clamp. 등급이 "safe"일 때만 `ModuleResult.isCorrect: true`.

## 밸런싱 체크리스트

- `initialPoints`와 각 `investigation.cost`의 합: 핵심 증거를 모두 열람하면 포인트가
  빠듯하게 남거나 약간 모자라도록 잡는다(조사 효율 배점이 의미를 갖게).
- `unlockCondition` 체인: 결정적 증거는 1단계 조사 뒤에 열리는 2차 조사에 배치해,
  "아무거나 열지 말고 단서를 따라가라"를 유도한다. `hiddenUntilUnlocked`는 원작에 있을
  때만 사용.
- 모순(`contradictions`): "관련 질문 클릭 + 관련 증거 등록"이 모두 충족되면 자동으로
  점수를 얻는 방식(원작의 드래그 연결 UI는 없음). statement와 evidencePattern 쌍이
  자연스럽게 어긋나야 한다.
- 엔딩 3종: 최고점이 유일해야 하고(동점 금지), 나머지 2종과 최소 몇 점 이상 벌린다.
  케이스마다 최고점 `decision`이 달라지도록(전부 "계약 중단"이 정답이 되지 않도록) 설계한다.
- `NONE_LIMITED_RISK` 케이스: 위험 신호가 거의 없고 "추가 확인 필요" 또는 "진행 가능"이
  최고점. 반사적으로 "계약 중단"을 고르면 감점되게.

## 비노출/노출 필드 (ADR-004)

- 체험 중 노출: `scenario.*`, `investigations[].purpose`(≤60자, 금지어
  `사기|위험|보이스피싱|전세사기|깡통전세` 및 케이스 `title` 포함 불가), `npc.greeting`,
  `npc.fallbackLine`, `npc.statements[].text`.
- `/result`에서만 노출: `title`, `hiddenTruth`(전체), `contradictions[].explanation`,
  `endingOptions[].comment`, 정답 암시가 담긴 `evidenceDefinitions[].description`.
