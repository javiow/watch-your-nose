# Step 5: review-result-components

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "`dangerouslySetInnerHTML` 금지", "공용 UI는 `src/components/ui/`")
- `/docs/ARCHITECTURE.md` (컴포넌트 배치)
- `/docs/ADR.md`의 ADR-002 (새 런타임 의존성 추가 금지)
- `/src/types/experience.ts` — step0의 `ReviewItem` / `MissedSignal`
- `/src/app/result/page.tsx` (전체) — 특히 문항별 리뷰 `<li>`의 ✓/✗ 관용구:
  `<span aria-hidden="true" className={result.isCorrect ? "text-safe" : "text-danger"}>{result.isCorrect ? "✓" : "✗"}</span>` + `<span className="sr-only">{result.isCorrect ? "정답" : "오답"}</span>`
- `/src/components/ui/Prose.tsx`, `/src/components/ui/inline-markup.tsx` (기존 UI 컴포넌트 스타일·패턴 참고)
- 기존 UI 테스트 한두 개 (`src/components/ui/Prose.test.tsx` 등) — 테스트 스타일 참고

## 배경

결과 페이지 "문항별 리뷰"에 두 가지를 추가한다: (1) 카드/매물별 **O/X 표**, (2) **놓친 위험 신호 불릿 목록**(굵은 제목 + 평문 설명 + 별도 출처 줄).

이 step은 이 둘을 그리는 **표현 컴포넌트 2개만** 만들고 단위 테스트한다. 결과 페이지 배선은 step6. 두 컴포넌트는 `ReviewItem[]` / `MissedSignal[]`를 받아 순수하게 렌더만 한다(상태·데이터 fetch 없음).

## 작업

### 1. `src/components/ui/ReviewBreakdownTable.tsx` 신규

```ts
import type { ReactNode } from "react";
import type { ReviewItem } from "@/types/experience";

export function ReviewBreakdownTable({ items }: { items: ReviewItem[] }): ReactNode;
```

- `items.length === 0` → `null` 반환.
- 마크업: `<div className="overflow-x-auto">` 안에 `<table className="w-full text-sm">`.
  - `<thead>` (`text-xs text-subtle`): 열 4개 — `항목` / `내 판단` / `정답` / `결과`.
  - `<tbody>`의 행마다 `<tr>`, 셀은 `<td className="border-t border-border py-2 …">`.
    - `항목` 셀: `item.label`, `text-muted`.
    - `내 판단` 셀: `item.userVerdict`, `text-subtle`.
    - `정답` 셀: `item.correctVerdict`, `text-subtle`.
    - `결과` 셀: page.tsx와 **동일 관용구** —
      `<span aria-hidden="true" className={item.isCorrect ? "text-safe" : "text-danger"}>{item.isCorrect ? "✓" : "✗"}</span>`
      `<span className="sr-only">{item.isCorrect ? "정답" : "오답"}</span>`
- **`<ul>` / `<li>`를 쓰지 마라. 반드시 `<table>` / `<tr>` / `<td>`.**
  이유: `result/page.test.tsx`가 `container.querySelectorAll("li")`로 리뷰 문항 수를 센다. 표를 `<li>`로 만들면 그 카운트가 깨진다.

### 2. `src/components/ui/MissedSignalList.tsx` 신규

```ts
import type { ReactNode } from "react";
import type { MissedSignal } from "@/types/experience";

export function MissedSignalList({ signals }: { signals: MissedSignal[] }): ReactNode;
```

- `signals.length === 0` → `null` 반환.
- 마크업: `<ul className="space-y-3">`, 항목마다 `<li className="space-y-1">`:
  - `<p><strong className="font-semibold text-foreground">{signal.title}</strong></p>` — **`<strong>`은 `title`만 감싼다.**
  - `{signal.description && <p className="text-sm text-muted">{signal.description}</p>}`
  - `{signal.source && <p className="text-xs text-subtle">(출처: {signal.source})</p>}`
- 평문 React 텍스트 노드만 쓴다. `renderInlineMarkup` / `dangerouslySetInnerHTML`를 쓰지 마라 — 데이터에 마커가 없고, "전체 문장 볼드" 제거가 이 phase의 목적이다.

### 3. 테스트 신규

**`src/components/ui/ReviewBreakdownTable.test.tsx`:**
- `ReviewItem` 3개를 넘기면 `<tr>` 3개(헤더 행 제외), 각 행에 `label` / `userVerdict` / `correctVerdict` 텍스트가 있다.
- 정답 행: `✓`, `text-safe` 클래스, `sr-only` "정답". 오답 행: `✗`, `text-danger`, "오답".
- `items={[]}` → `container.firstChild === null`.
- `container.querySelector("table")` 존재, `container.querySelector("ul")` 없음.

**`src/components/ui/MissedSignalList.test.tsx`:**
- signal마다 `title`이 `<strong>` 안에 있고, `container.querySelectorAll("strong").length === signals.length` (설명·출처는 볼드가 아님).
- `source`가 있는 signal → `(출처: …)` 텍스트 노드 존재; `source` 없는 signal → `(출처:` 텍스트 없음.
- `description` 없는 signal → 빈 `<p>`가 생기지 않는다.
- `signals={[]}` → `container.firstChild === null`.

## Acceptance Criteria

> 메모리 절약: 전체 Next 빌드 / 전체 테스트 대신 **타입체크 + 린트 + 이 step 관련 테스트만** 실행한다. 전체 `npm run build && npm test`는 phase 종료 후 운영자가 한 번 돌린다.

```bash
npx tsc --noEmit
npm run lint
npx vitest run src/components/ui/ReviewBreakdownTable.test.tsx src/components/ui/MissedSignalList.test.tsx
```

## 검증 절차

1. 위 AC 커맨드를 실행한다. **위 타입체크·린트·관련 테스트가 모두 통과해야 한다.**
2. 아키텍처 체크리스트:
   - 두 컴포넌트가 `src/components/ui/`에 있는가?
   - `grep -rn "dangerouslySetInnerHTML" src/` → 0건인가?
   - `git diff package.json` → 변화 없는가? (새 패키지 없음, ADR-002)
   - `ReviewBreakdownTable`이 `<table>`인가? (`<ul>`/`<li>` 아님)
   - `MissedSignalList`의 `<strong>`이 `title`만 감싸는가?
3. 결과에 따라 `phases/11-review-breakdown-and-phase-nav/index.json`의 `step: 5`를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

`summary`에 두 컴포넌트의 파일 경로·props 시그니처·"ReviewBreakdownTable은 `<table>` 사용(li 아님)"·"빈 배열이면 null"을 적어라(step6이 참조한다).

## 금지사항

- `ReviewBreakdownTable`을 `<ul>` / `<li>`로 만들지 마라. 이유: `result/page.test.tsx`의 `querySelectorAll("li")` 문항 카운트가 깨진다.
- `MissedSignalList`에서 `title` 밖의 텍스트를 `<strong>`으로 감싸지 마라. 이유: 이 phase의 핵심 요구 — 문장 전체 볼드 제거.
- `src/app/result/page.tsx`를 이 step에서 수정하지 마라. 이유: 배선은 step6.
- 새 npm 패키지를 추가하지 마라 (ADR-002).
- 두 컴포넌트에 `useState` / `useEffect` / 데이터 접근을 넣지 마라. 이유: 순수 표현 컴포넌트여야 테스트·재사용이 쉽다.
