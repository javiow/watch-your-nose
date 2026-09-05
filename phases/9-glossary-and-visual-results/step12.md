# Step 12: grade-threshold-text

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/src/lib/scoring.ts` (전체) — `GRADE_THRESHOLDS`(`{ safe: 80, caution: 50 }`), `GRADE_LABELS`(`{ safe: "안전", caution: "주의", danger: "위험" }`), `computeGrade`
- `/src/lib/scoring.test.ts` (전체) — 테스트 작성 스타일
- `/src/app/result/page.tsx` (전체) — 이후 step15에서 이 함수를 쓴다. 이 step에서는 result 페이지를 건드리지 마라.

## 배경

결과 페이지의 등급("72% 주의")이 어떤 기준으로 매겨졌는지 사용자에게 공개되지 않는다. 등급 기준 문구를 만드는 순수 함수를 `scoring.ts`에 추가한다. 하드코딩된 숫자가 상수와 따로 놀지 않도록 `GRADE_THRESHOLDS`/`GRADE_LABELS`를 직접 참조해 문자열을 조립한다.

## 작업

`src/lib/scoring.ts`에 아래 함수를 추가한다(export).

```ts
export function describeGradeThresholds(): string;
// 예: "80% 이상 안전 · 50~79% 주의 · 50% 미만 위험"
// GRADE_THRESHOLDS.safe / GRADE_THRESHOLDS.caution / GRADE_LABELS 를 직접 조합해 만든다.
// caution 구간 상한은 GRADE_THRESHOLDS.safe - 1 로 계산한다.
```

기존 export, `GRADE_THRESHOLDS`, `GRADE_LABELS`, `computeGrade` 등은 절대 변경하지 마라 — 새 함수만 추가한다.

`src/lib/scoring.test.ts`에 테스트를 추가한다:

- `describeGradeThresholds()`가 `GRADE_THRESHOLDS`/`GRADE_LABELS`를 조합해 만든 기대 문자열과 정확히 일치한다. 기대값을 리터럴로 하드코딩하지 말고, 테스트 안에서도 `` `${GRADE_THRESHOLDS.safe}% 이상 ${GRADE_LABELS.safe} · ${GRADE_THRESHOLDS.caution}~${GRADE_THRESHOLDS.safe - 1}% ${GRADE_LABELS.caution} · ${GRADE_THRESHOLDS.caution}% 미만 ${GRADE_LABELS.danger}` ``처럼 상수로 조립해 비교한다(상수가 바뀌어도 테스트가 따라오도록).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `GRADE_THRESHOLDS`, `GRADE_LABELS`, `computeGrade`, `aggregateResults` 등 기존 export의 동작/시그니처가 그대로인가?
   - `src/app/result/page.tsx`를 수정하지 않았는가? (그건 step15)
3. 결과에 따라 `phases/9-glossary-and-visual-results/index.json`의 `step: 12`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `GRADE_THRESHOLDS`/`GRADE_LABELS` 값을 바꾸지 마라. 이유: 채점 기준 자체는 이 phase의 범위가 아니다.
- `src/app/result/page.tsx`를 수정하지 마라. 이유: 결과 페이지 렌더는 step15에서 통합적으로 다룬다.
- 기존 테스트를 깨뜨리지 마라.
