# Step 8: result-mascot

## 읽어야 할 파일

- `/src/app/result/page.tsx` (현재 `"use client"`. `useSession()`에서 `results`, `resetSession`. `isComplete = results.length === EXPERIENCE_MODULES.length`. 미완료면 `useEffect`에서 `router.replace("/")` 후 `return null`. 완료 시 `aggregateResults(results)` → `{ average, grade }`. 종합 정답률 `<section>` 안에 `{roundedAverage}% <span className={GRADE_TEXT_COLOR[grade]}>{GRADE_LABELS[grade]}</span>`. 로컬 `GRADE_TEXT_COLOR: Record<Grade, string>` 맵 존재. 이어서 "문항별 리뷰", "대응 방안", "다시 체험하기" 버튼)
- `/src/lib/scoring.ts` (`aggregateResults`, `GRADE_LABELS`, `Grade`)
- `/src/lib/registry.ts` (`EXPERIENCE_MODULES` — 길이 4)
- `/src/lib/mascot-frames.ts` (step3 — `GRADE_EXPRESSION: Record<Grade, MascotExpression>`)
- `/src/components/ui/Mascot.tsx` (step6 — `expression` prop = 제어/정적 모드)
- `/src/lib/session-context.tsx` (`SessionProvider`, `useSession`)
- `/tests/setup.ts` (step4 matchMedia shim)
- `/src/app/difficulty/page.test.tsx` 또는 `/src/app/setup/page.test.tsx` (라우트 페이지를 `next/navigation`·`session-context` mock으로 테스트하는 기존 패턴 참고)
- `/docs/ADR.md` ADR-013, `/docs/ARCHITECTURE.md` (「데이터 흐름」 `/result` 등급→표정)

## 배경

결과 페이지 종합 정답률 섹션에 **등급별 정적 마스코트**를 넣는다. `safe → relieved`, `caution → worried`, `danger → sad` (매핑은 step3의 `GRADE_EXPRESSION` 재사용). 제어 모드라 idle 루프·포인터 반응이 없다.

`src/app/result/page.tsx`는 `page.tsx`라 `tdd-guard.sh` 면제지만, CLAUDE.md는 TDD를 요구한다 → `src/app/result/page.test.tsx`를 먼저 만든다(현재 없음).

## 작업

### 1. `src/app/result/page.test.tsx` (구현 전, 신규)

`next/navigation`을 mock(`useRouter` → `{ push: vi.fn(), replace: vi.fn() }`)하고, 완료 상태를 만들기 위해 아래 중 하나를 택한다:

- `@/lib/session-context`의 `useSession`을 `vi.mock`으로 스텁해 `results`에 `EXPERIENCE_MODULES.length`(4)개의 `ModuleResult`를 담아 반환, **또는**
- `@/lib/scoring`의 `aggregateResults`를 `vi.mock`으로 스텁해 원하는 `grade`를 강제하고, `useSession`은 실제 `SessionProvider`로 4개짜리 `results`를 주입.

검증:

- `grade`가 `"safe"` → 마스코트 래퍼에 `data-expression="relieved"`.
- `"caution"` → `data-expression="worried"`.
- `"danger"` → `data-expression="sad"`.
- 마스코트 `img`가 `aria-hidden`이고, `fireEvent.mouseEnter(래퍼)` 해도 `data-expression`이 안 바뀐다(정적/제어 모드).
- 스모크: `"종합 정답률"`, `"문항별 리뷰"` 텍스트가 여전히 렌더된다.

### 2. `src/app/result/page.tsx` 수정

- `import { Mascot } from "@/components/ui/Mascot";` 와 `import { GRADE_EXPRESSION } from "@/lib/mascot-frames";` 추가.
- 종합 정답률 `<section>`의 콘텐츠를 `flex items-center gap-4` 행으로 감싸고, 맨 앞에:
  ```tsx
  <Mascot expression={GRADE_EXPRESSION[grade]} className="h-24 w-24 shrink-0" />
  ```
- 그 외 로직(리다이렉트 `useEffect`, `isComplete` 가드, `aggregateResults`, `handleRetry`, 문항별 리뷰/대응 방안/버튼)은 **건드리지 않는다**.
- `GRADE_TEXT_COLOR`(로컬 맵)는 그대로 두고, 마스코트 표정은 `GRADE_EXPRESSION`을 쓴다(별도 로컬 맵을 새로 만들지 마라).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

추가:
- `npx vitest run src/app/result/page.test.tsx` 통과(3개 등급 전부).
- `git status`: `src/app/result/page.tsx` 수정 + `src/app/result/page.test.tsx` 신규.

## 검증 절차

1. 위 AC를 실행한다.
2. 체크리스트:
   - 테스트를 먼저 작성했는가?
   - 등급→표정이 `GRADE_EXPRESSION`(step3) 재사용인가(로컬 재정의 아님)?
   - `Mascot`에 `interactive`/`proximityRef`를 주지 않았는가(정적이어야 함)?
   - 리다이렉트/가드/`handleRetry` 로직을 수정하지 않았는가?
   - `aria-hidden`이 유지되는가?
3. `phases/6-landing-redesign/index.json`의 `step: 8`을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "..."`
   - 실패(3회) → `"status": "error"`, `"error_message": "..."`
   - 개입 필요 → `"status": "blocked"`, `"blocked_reason": "..."`

## 금지사항

- 결과 페이지의 리다이렉트 `useEffect`, `isRetryingRef`, `isComplete` 조기 return, `handleRetry`를 수정하지 마라. 이유: 재시작 경쟁 조건을 막는 정교한 로직이고 이 phase 범위 밖이다.
- 등급→표정 매핑을 `result/page.tsx`에 로컬로 다시 정의하지 마라 — `@/lib/mascot-frames`의 `GRADE_EXPRESSION`을 import.
- `Mascot`에 `interactive`, `proximityRef`, `float`를 주지 마라 — 결과 페이지 마스코트는 정적 제어 모드다.
- `GRADE_TEXT_COLOR`, `GRADE_LABELS` 사용부를 바꾸지 마라.
- 다른 페이지·컴포넌트를 수정하지 마라.
- 기존 테스트를 깨뜨리지 마라.
