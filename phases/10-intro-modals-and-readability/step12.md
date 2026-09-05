# Step 12: tighten-data-copy

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (모든 콘텐츠는 `src/data`의 정적 TS, 팀이 채우는 영역)
- `/docs/ADR.md`의 ADR-004, ADR-005 (피해자 관점만), ADR-016
- `/src/data/remediation.ts` (전체) — 6개 `REMEDIATION_ENTRIES[*].message`(2~3문장, `**강조**` 마커 포함) + `DEFAULT_REMEDIATION_MESSAGE`
- `/src/data/remediation.test.ts` (전체) — 현재 `message.length > 0` 정도만 검사
- `/src/data/jeonse.ts` — 각 house의 `explain`(3~4문장), `lesson`(1~2문장), `reason`(짧은 구). `explain`/`lesson`은 현재 **어디에도 렌더되지 않는다**.
- `/src/data/jeonse.test.ts` — `fields` 8개 고정 등 완결성 검사
- `/src/data/case-investigation.ts` — `hiddenTruth.explanation` + 그 외 `explanation:` 필드 다수, `endingOptions[].comment`, `contradictions[].explanation`(현재 미렌더)
- `/src/data/case-investigation.test.ts`
- `/src/components/experiences/JeonseExperience.tsx`의 `buildExplanation` — `house.reason`을 결과 `explanation`에 이어붙임
- `/src/components/experiences/CaseInvestigationExperience.tsx`의 `buildExplanation` — `hiddenTruth.explanation` + 놓친 신호 + `bestOption.comment`를 하나의 `ModuleResult.explanation`으로 연결. `CaseInvestigationExperience.test.tsx`에 `hiddenTruth.explanation.slice(0, 20)` 포함 검사가 있음.
- `/src/components/ui/Prose.tsx` — `/\n{2,}/`로 문단 분리

## 배경

사용자 피드백: "너무 많은 텍스트가 나오지 않도록 요약해보자." 사용자 확답: `src/data`의 긴 콘텐츠까지 재작성 대상.

`/result`(step10)와 브리핑(step11)이 이제 `Prose`로 렌더하므로, 데이터 문자열을 **짧게 다듬고 문장 사이에 `\n\n`을 넣어** 문단이 나뉘게 한다. 의미(왜 위험한지, 무엇을 배웠는지)는 보존하고 군더더기·중복만 줄인다.

## 작업

### 공통 규칙

- 각 문자열을 **2~3개의 짧은 문장**으로. 문장 **사이**에만 `\n\n`(맨 끝/맨 앞 금지).
- `**강조**` 마커와 `{{term:...}}` 마커는 유지한다(핵심 문구 강조·용어 툴팁).
- 사실 관계(수치, 기관명, 절차)를 바꾸지 마라. 가해자 관점 표현을 넣지 마라(ADR-005).
- `reason`(짧은 구)은 그대로 둔다 — 이미 짧고 결과 문장 조립에 쓰인다.

### 1. `src/data/remediation.ts`

- 6개 `message` + `DEFAULT_REMEDIATION_MESSAGE`를 다듬는다. 기존 첫 문장(행동 지침)을 살리고, 예시 나열이 길면 2개로 줄인다.
- `bullets` / `links`는 이미 짧으므로 건드리지 마라.

### 2. `src/data/jeonse.ts`

- 각 house `explain`: 3~4문장 → 2~3문장, `\n\n`로 분리.
- 각 house `lesson`: 1~2문장 유지하되 늘어지면 축약.
- `explain`/`lesson`은 여전히 **렌더되지 않는 상태**여야 한다(이 phase에서 노출 배선을 새로 만들지 않는다).

### 3. `src/data/case-investigation.ts`

- `hiddenTruth.explanation`: 2~3문장으로, `\n\n` 분리. **첫 20자는 의미가 통하는 완결된 도입으로 유지**한다(아래 금지사항 참조).
- 그 외 `explanation:` 필드들, `endingOptions[].comment`: 같은 방식으로 축약.
- `contradictions[].explanation`(미렌더): 축약만 하고 배선은 하지 마라.

### 4. 테스트 — 상한 어서션 추가

- `remediation.test.ts`: 모든 `message`에 대해 `message.length <= 200` **또는** `message.split("\n\n").length <= 3`. `getRemediation(tag) === getRemediationEntry(tag).message` 회귀 검사가 있으면 유지.
- `jeonse.test.ts`: 모든 house에 대해 `explain.length <= 260`, `lesson.length <= 140`. `explain`/`lesson`이 문단 분리돼도 `fields` 8개 고정 등 기존 검사는 그대로.
- `case-investigation.test.ts`: 모든 `hiddenTruth.explanation.length <= 260`, 모든 `endingOptions[].comment.length <= 200`.
- 이미 특정 문자열 전체를 기대하던 테스트가 있으면(예: `explanation`을 통째로 비교) 새 문자열로 갱신하거나, 데이터에서 값을 읽어 비교하도록 바꾼다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`CaseInvestigationExperience.test.tsx`의 `hiddenTruth.explanation.slice(0, 20)` 포함 검사, `JeonseExperience.test.tsx`의 결과 문장 검사가 통과해야 한다.**
2. `npm run dev`로 세션을 완주해 `/result`의 문항별 리뷰 설명이 짧아지고 문단으로 나뉘었는지 확인.
3. 체크리스트:
   - `\n\n`이 문자열 맨 끝/맨 앞에 붙지 않았는가? (`grep -n '\\n\\n"' src/data/*.ts` 로 대략 점검, trailing `\n\n` 없는지)
   - `**` 마커와 `{{term:}}` 마커가 유지됐는가?
   - 수치·기관명 같은 사실을 바꾸지 않았는가?
   - `explain`/`lesson`을 새로 렌더하는 코드를 넣지 않았는가?
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 12`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `hiddenTruth.explanation`의 앞 20자를 `\n\n`이나 잘리는 구절로 시작하지 마라. 이유: `CaseInvestigationExperience.buildExplanation`이 `.slice(0, 20)`으로 결과 설명에 이어붙이고, 테스트도 그 부분 문자열을 검사한다.
- `reason`(jeonse) 필드를 건드리지 마라. 이유: 짧고, 결과 문장 조립 로직이 그대로 이어붙인다.
- `explain` / `lesson` / `contradictions[].explanation`을 렌더하는 새 UI를 만들지 마라. 이유: 이 phase 범위는 "짧게 다듬기"까지다. 노출 여부는 별도 결정 사항.
- 콘텐츠의 사실(수치·기관·절차)을 바꾸거나 가해자 시점 표현을 넣지 마라(ADR-005).
- 기존 테스트를 (상한 어서션 추가·문자열 갱신이 명시된 데이터 테스트 외에는) 깨뜨리지 마라.
