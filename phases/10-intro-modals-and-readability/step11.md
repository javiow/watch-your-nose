# Step 11: adopt-prose-remaining

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-004 (유형 목록 사전 비공개), ADR-016 (`/how-it-works` 분리)
- `/src/components/ui/Prose.tsx` (step0) + 그 `summary`
- `/src/app/how-it-works/page.tsx` (전체) — 서버 컴포넌트. 소개 문단 `<p className="text-base leading-relaxed text-muted">` 2문장 + `LEARNING_STEPS` 아이콘 칩 + "진행 방식" `<ul>`(항목에 "…문항별 리뷰·대응 방안…" 표현이 있음)
- `/src/app/how-it-works/page.test.tsx` (전체) — 문구 substring 매처, 유형명 비노출 테스트
- `/src/components/experiences/CaseInvestigationExperience.tsx` — `phase === "briefing"`의 시나리오 카드 안 `content.scenario.description`을 렌더하는 `<p className="... leading-relaxed ...">`

## 배경

step0에서 만든 `Prose`를 남은 긴 본문 렌더 지점에 적용해 문단 분리 + 여백을 준다. `/result`(step10)와 `IntroDialog`(step2)는 이미 `Prose`를 쓴다. 이 step은 나머지 두 곳(`how-it-works`, 케이스 조사 브리핑 설명)에 적용하고, `how-it-works`의 "대응 방안" 관련 표현을 step10 변경(대응 방안이 문항 안으로 들어가 별도 섹션이 사라짐)에 맞춰 다듬는다.

## 작업

### 1. `src/app/how-it-works/page.tsx`

- 상단 소개 `<p>`(2문장)를 `<Prose text={"...\n\n..."} size="base" />`로 바꾼다. 두 문장을 `\n\n`로 나눠 2문단으로. 문장 자체는 최대한 보존하되 늘어지는 부분만 줄인다.
- "진행 방식" `<ul>` 항목 중 "…결과 페이지에서 종합 점수·유형별 점수·문항별 리뷰·대응 방안을 한 번에 확인합니다." 를, 대응 방안이 이제 각 문항 리뷰에 붙는다는 사실에 맞춰 다듬는다. 예: "…결과 페이지에서 종합 점수와 유형별 점수, 문항별 리뷰(대응 방안 포함)를 한 번에 확인합니다." (짧게)
- `LEARNING_STEPS` 아이콘 칩, `<Link href="/setup">`, 서버 컴포넌트 여부는 그대로.
- 유형명(보이스피싱/전세매물 등)을 새로 노출하지 마라(ADR-004).

### 2. `src/components/experiences/CaseInvestigationExperience.tsx`

- 브리핑 시나리오 카드 안 `content.scenario.description` 렌더 `<p>`를 `<Prose text={content.scenario.description} size="sm" />`로 교체(선택적이지만 권장). `description`에 `\n\n`가 없으면 문단 1개로 그대로 렌더되므로 안전하다.
- 시나리오 카드의 다른 필드(`propertyLocation`, `brokerLine`, `goal` 등)는 짧으므로 건드리지 마라.
- step4에서 얹은 `IntroDialog` 배선은 건드리지 마라.

### 3. 테스트

- `how-it-works/page.test.tsx`: 기존 substring 매처가 깨지면, 문구를 보존하는 쪽으로 `page.tsx`를 조정하거나(우선) 매처의 기대 문자열을 새 문구로 갱신한다. 유형명 비노출 테스트는 그대로 통과해야 한다. "진행 방식" 관련 케이스가 있으면 새 문구에 맞춘다.
- `CaseInvestigationExperience.test.tsx`: 브리핑에서 `content.scenario.description`이 여전히 화면에 보이는지 확인하는 케이스가 있으면 그대로 통과해야 한다(`Prose`는 텍스트를 그대로 렌더). 스포일러 비노출 케이스도 유지.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `npm run dev`로 `/how-it-works`와 케이스 조사 브리핑을 열어 문단이 나뉘고 여백이 생겼는지, 첫 줄 들여쓰기가 없는지 확인.
3. 체크리스트:
   - `Prose`만 적용했고 새 의존성·`.prose` 클래스가 없는가?
   - `how-it-works`에 유형명이 새로 노출되지 않았는가?
   - 케이스 조사 브리핑의 스포일러 비노출이 유지되는가?
4. 결과에 따라 `phases/10-intro-modals-and-readability/index.json`의 `step: 11`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 데이터 파일(`src/data/*`)의 문자열을 이 step에서 재작성하지 마라. 이유: 카피 축약은 step12에서 데이터 테스트와 함께 다룬다.
- `how-it-works`를 클라이언트 컴포넌트로 바꾸지 마라. 이유: 상호작용이 없는 정적 페이지다.
- `how-it-works`에서 체험 유형을 구체적으로 나열하지 마라(ADR-004: 일반적 톤 유지).
- 기존 테스트를 (갱신이 명시된 파일 외에는) 깨뜨리지 마라.
