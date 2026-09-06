# Step 6: result-page-wire-review

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ADR.md`의 ADR-016 (결과 페이지에서 유형 라벨 노출은 허용됨)
- `/src/app/result/page.tsx` (전체) — 현재 문항별 리뷰 `<li>` 순서: ① 헤더 `✓/✗ + {index+1}번 · {EXPERIENCE_TYPE_LABELS[typeId]}` → ② `<p>내 선택 {userChoice} · 정답 {correctChoice}</p>` → ③ `<Prose text={result.explanation} size="sm" />` → ④ 오답이면 "이렇게 대응하세요" 블록(`getRemediationEntry(result.mistakeTag)` → `<Prose message>` + bullets + links)
- `/src/app/result/page.test.tsx` (전체) — `vi.mock` 팩토리, `completeResults(overrides?)` 픽스처 헬퍼(현재 override 타입: `{ isCorrect; mistakeTag; explanation }`), `container.querySelectorAll("li")` 기반 "오답 대응 블록이 N번 문항 li 안" 테스트, "**로 감싼 핵심 문구만 강조" 테스트
- `/src/components/ui/ReviewBreakdownTable.tsx`, `/src/components/ui/MissedSignalList.tsx` (step5 산출물 — props·빈 배열 동작 확인)
- `/src/components/ui/Prose.tsx`
- `/src/types/experience.ts` — `ModuleResult.reviewItems?` / `.missedSignals?` (step0), `ReviewItem.detail?`

## 배경

step5에서 `ReviewBreakdownTable` / `MissedSignalList`를 만들었고, step1~4에서 각 체험이 `ModuleResult.reviewItems` / `missedSignals`를 채우기 시작했다. 이제 결과 페이지 "문항별 리뷰"의 각 `<li>`에 이 둘을 끼워 넣는다.

**신규 필드가 없는 결과에서는 아무것도 추가로 그리지 않아 현행과 100% 동일**해야 한다(하위호환). 기존 `page.test.tsx` 픽스처는 신규 필드를 안 넣으므로 그 폴백 경로를 그대로 타야 한다.

## 작업

### `src/app/result/page.tsx`

`results.map((result, index) => <li>…)` 내부에서, ③ `<Prose explanation>` **다음**, ④ "이렇게 대응하세요" 블록 **앞**에 아래를 삽입한다:

```tsx
{result.reviewItems && <ReviewBreakdownTable items={result.reviewItems} />}

{result.missedSignals && result.missedSignals.length > 0 && (
  <div className="space-y-2">
    <p className="text-xs font-medium text-danger">놓친 위험 신호</p>
    <MissedSignalList signals={result.missedSignals} />
  </div>
)}
{!result.missedSignals &&
  result.reviewItems?.some((i) => !i.isCorrect && i.detail) && (
    <Prose
      size="sm"
      text={result.reviewItems.find((i) => !i.isCorrect && i.detail)!.detail!}
    />
  )}
```

- ② `<p>내 선택 … · 정답 …</p>` 와 ③ `<Prose text={result.explanation}>` 는 **그대로 유지**한다(폴백 + 짧은 요약 겸용).
- `ReviewBreakdownTable` / `MissedSignalList` import 2줄 추가.
- 그 외 페이지 구조(종합 정답률, 유형별 점수, 다시 체험하기)는 건드리지 않는다.

### `src/app/result/page.test.tsx` 갱신

- `completeResults`의 `overrides` 타입에 `reviewItems?: ReviewItem[]`, `missedSignals?: MissedSignal[]`를 추가한다(기존 필드 유지).
- **신규**: `reviewItems`가 있는 결과 → O/X 표의 행(각 `label` + ✓/✗)이 화면에 보인다.
- **신규**: `missedSignals`가 있는 결과 → "놓친 위험 신호" 헤딩 + 목록이 보이고, 각 `title`이 볼드(`<strong>`), `source`가 있는 항목은 `(출처: …)` 줄이 보인다.
- **신규**: 놓친 신호 `<li>` 안의 `<strong>`은 정확히 1개(제목만) — `description` 텍스트는 `li.textContent`에는 있지만 `li.querySelector("strong")?.textContent`에는 없다.
- **신규**: `reviewItems` 1행 + `missedSignals` 없음 + 그 행에 `detail` 있음 → 표 아래에 `detail` 문단(`<Prose>`)이 렌더된다.
- 기존 테스트(마스코트 표정, 게이지/등급 기준, 유형 라벨 카운트, `**` 강조, "이렇게 대응하세요" 블록, 미완료 세션 리다이렉트)는 **신규 필드 없는** `completeResults()`로 폴백 경로를 그대로 타므로 수정 없이 통과해야 한다. 특히 `container.querySelectorAll("li")` 기반 "오답 대응 블록이 N번 문항 li 안" 테스트가 계속 통과하는지 확인한다(표를 `<table>`로 만들었으니 새 `<li>`는 `MissedSignalList` 안에서만 생기고 문항 라벨을 포함하지 않는다).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **`result/page.test.tsx` 전체 + 프로젝트 전체가 통과해야 한다.**
2. `npm run dev`로 세션을 한 번 완주(사기 카드·전세 매물 각 1개 이상 오답, 보이스피싱 오답, 케이스조사 비최선 판단)해 `/result`를 연다:
   - 각 오답 문항에 짧은 요약 문장 → O/X 표(항목·내 판단·정답·결과) → "놓친 위험 신호" 불릿(굵은 제목, 평문 설명 줄, 별도 `(출처: …)` 줄)이 순서대로 보인다.
   - 화면에 run-on 전체 볼드 문장이 없다.
   - 정답 문항은 요약 + (있으면) O/X 표만, "놓친 위험 신호" 블록 없음.
3. 체크리스트:
   - ② `내 선택 … · 정답 …` `<p>`와 ③ `<Prose text={result.explanation}>`가 그대로 있는가?
   - 신규 필드가 없는 결과에서 ④·⑤가 아무것도 렌더하지 않는가?
   - `EXPERIENCE_TYPE_LABELS` 유형 라벨 노출이 유지되는가? (ADR-016)
   - "이렇게 대응하세요" 블록의 마크업·위치·`getRemediationEntry` 호출이 불변인가?
   - 리뷰 항목 컨테이너가 여전히 `<li>`인가?
4. 결과에 따라 `phases/11-review-breakdown-and-phase-nav/index.json`의 `step: 6`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `내 선택 … · 정답 …` `<p>`나 `<Prose text={result.explanation}>`를 지우지 마라. 이유: 신규 필드 없는 결과의 폴백이고, `**` 강조·리다이렉트 등 기존 테스트가 이 경로에 의존한다.
- "이렇게 대응하세요"(remediation) 블록의 마크업·위치·`getRemediationEntry` 호출을 바꾸지 마라. 이유: phase 10에서 확정된 구조다(범위 밖).
- `getRemediationEntry` / `src/data/remediation.ts` / `src/lib/scoring.ts`를 수정하지 마라.
- 리뷰 항목 컨테이너 `<li>`를 다른 태그로 바꾸지 마라. 이유: `page.test.tsx`가 `querySelectorAll("li")`로 문항을 찾는다.
- 체험 컴포넌트(`src/components/experiences/*`)를 수정하지 마라. 이유: 페이로드는 step1~4에서 이미 채워졌다.
