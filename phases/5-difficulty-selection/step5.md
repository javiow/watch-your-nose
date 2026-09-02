# Step 5: difficulty-page-wiring

## 읽어야 할 파일

먼저 아래 파일들을 읽고 배선 패턴을 파악하라:

- `/docs/ARCHITECTURE.md` ("데이터 흐름" — `/` → `/setup` → `/difficulty` → `/session` → `/result`; "엣지 케이스" — 가드 리다이렉트 패턴)
- `/docs/ADR.md` (ADR-008 `/setup` 전역 1회 단계 + `playerInfo` 가드, ADR-012)
- `/src/app/setup/page.tsx` — **`/difficulty/page.tsx` 의 템플릿.** `useRouter`, `useSession`, `onComplete` → 세터 호출 + `router.push`.
- `/src/app/session/page.tsx` — 이번 step에서 수정. `useSession` 구조분해, `pickRandomContent` 호출(`useMemo`), `playerInfo === null` 가드(`useEffect` + 조기 return).
- `/src/app/page.test.tsx` — `next/navigation` mock 스타일(`vi.mock("next/navigation", ...)`).
- `/src/components/ui/DifficultySelectForm.tsx` — step4에서 만든 폼. Props `{ onComplete: (difficulty: Difficulty) => void }`.
- `/src/lib/session-context.tsx` — step2에서 추가된 `difficulty` / `setDifficulty`.
- `/src/types/experience.ts` — `Difficulty`.

## 배경 (step1~4 완료 상태)

- step1: `Difficulty` 타입, `src/data/difficulty.ts`.
- step2: `SessionProvider.difficulty` / `setDifficulty` (초기 `null`, `resetSession` 무관).
- step3: `registry` 의 `pickRandomContent(difficulty?)` 가 콘텐츠를 난이도로 좁힘.
- step4: `DifficultySelectForm` 컴포넌트(컨트롤드, `onComplete(difficulty)`).

이 step은 **페이지/라우팅 레이어**만 다룬다. `/difficulty` 라우트를 신설하고, `/setup` → `/difficulty` → `/session` 순서로 연결하고, `/session` 이 `difficulty` 를 읽어 `pickRandomContent` 에 넘기고 가드에 포함하도록 한다. 이 step 완료로 phase 전체가 end-to-end 동작한다.

## 작업

### 1. `src/app/difficulty/page.test.tsx` — 테스트 먼저

> `page.tsx` 자체는 tdd-guard 예외지만, 배선 회귀를 막기 위해 테스트를 만든다. `next/navigation` 과 `@/lib/session-context` 를 mock 한다(`src/app/page.test.tsx` 스타일).

검증:
- `playerInfo` 가 `null` 이면 `router.replace("/")` 가 호출된다.
- `playerInfo` 가 있고 사용자가 카드 선택 + "시작하기" 를 누르면 `setDifficulty` 가 고른 id로 호출되고 `router.push("/session")` 가 호출된다.

### 2. `src/app/difficulty/page.tsx` 신설

`src/app/setup/page.tsx` 와 동형 + `playerInfo` 가드. 아래를 그대로 사용해도 된다:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DifficultySelectForm } from "@/components/ui/DifficultySelectForm";
import { useSession } from "@/lib/session-context";
import type { Difficulty } from "@/types/experience";

export default function DifficultyPage() {
  const router = useRouter();
  const { playerInfo, setDifficulty } = useSession();

  useEffect(() => {
    if (playerInfo === null) {
      router.replace("/");
    }
  }, [playerInfo, router]);

  if (playerInfo === null) {
    return null;
  }

  const handleComplete = (difficulty: Difficulty) => {
    setDifficulty(difficulty);
    router.push("/session");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-4 py-16">
      <DifficultySelectForm onComplete={handleComplete} />
    </main>
  );
}
```

### 3. `src/app/setup/page.tsx` — 1줄 수정

`handleComplete` 안의 `router.push("/session")` → `router.push("/difficulty")`. 그 외는 건드리지 않는다.

### 4. `src/app/session/page.tsx` — 가드 + 콘텐츠 픽에 difficulty 연결

4-1. `useSession()` 구조분해에 `difficulty` 추가:
```ts
const { sessionPlan, addResult, playerInfo, difficulty } = useSession();
```

4-2. 콘텐츠 픽에 전달 + deps 갱신:
```ts
const content = useMemo(
  () => currentModule?.pickRandomContent(difficulty ?? undefined),
  [currentModule, difficulty]
);
```

4-3. 리다이렉트 가드 `useEffect` 에 `difficulty === null` 조건 추가, deps에 `difficulty` 추가:
```ts
useEffect(() => {
  if (sessionPlan.length === 0 || playerInfo === null || difficulty === null) {
    router.replace("/");
  }
}, [sessionPlan, playerInfo, difficulty, router]);
```

4-4. 조기 return 조건에도 `|| difficulty === null` 추가:
```ts
if (
  sessionPlan.length === 0 ||
  playerInfo === null ||
  difficulty === null ||
  !currentModule ||
  content === undefined
) {
  return null;
}
```

> `handleComplete` / 진행률 UI / `Component` 렌더는 건드리지 않는다.

### 5. 기존 세션 관련 테스트 점검

- `src/app/session/page.tsx` 를 렌더하는 기존 테스트가 있으면(`session/page.test.tsx` 등) `useSession` mock 에 `difficulty` 를 넣어 통과시킨다. 없으면 스킵.
- `src/components/ui/StartButton.tsx` 는 여전히 `/setup` 으로 push 한다 — **수정하지 않는다.**

## Acceptance Criteria

```bash
npm run build   # /difficulty 라우트 생성, 타입 에러 없음
npm run lint     # session/page.tsx 의 useMemo/useEffect deps에 difficulty 포함 (react-hooks/exhaustive-deps)
npm test         # difficulty/page.test.tsx + 전체 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `npm run dev` 로 수동 클릭 점검:
   - `/` → 시작하기 → `/setup` 3개 선택 → 시작하기 → **`/difficulty`** 도착. 세 카드에 라벨+설명, 선택 전 "시작하기" 비활성, 페이지·URL 어디에도 유형명 없음.
   - 난이도 선택 → 시작하기 → `/session` `1/4` → 4단계 완료 → `/result` 점수·리뷰 정상.
   - `/result` → 다시 체험하기 → `/setup`·`/difficulty` 건너뛰고 바로 `/session`, 난이도 유지된 채 새 보드.
   - 새 탭에서 `/difficulty` 직접 진입 → `/` 로. 새 탭에서 `/session` 직접 진입 → `/` 로.
   - `쉬움` / `어려움` 으로 각각 한 세션씩 완주 — 미태깅 3개 유형은 난이도 도입 전과 동일하게 플레이·채점.
3. 아키텍처 체크리스트:
   - `/session` 가드가 `playerInfo` 와 `difficulty` 를 모두 확인하는가?
   - `/difficulty` 가 `playerInfo` 없이 직접 진입 시 `/` 로 튕기는가?
   - `resetSession()` 후 재체험이 난이도를 다시 묻지 않는가?
4. 결과에 따라 `phases/5-difficulty-selection/index.json`의 `step: 5` 항목을 업데이트한다.

## 금지사항

- `src/app/setup/page.tsx` 에서 `push` 대상 1줄 외에 아무것도 바꾸지 마라.
- `src/components/ui/StartButton.tsx` 를 `/difficulty` 로 바꾸지 마라. 이유: 흐름은 `/` → `/setup` → `/difficulty` 이고, 캐릭터 설정을 건너뛰면 안 된다.
- `/session` 의 `handleComplete`·진행률 표시·`Component` 렌더 로직을 수정하지 마라. 이유: 이번 step은 difficulty 주입과 가드만 다룬다.
- `pickRandomContent(difficulty)` 에서 `difficulty` 가 `null` 일 때 임의 기본값(예: `"easy"`)으로 대체하지 마라. 이유: `null` 이면 가드가 `/` 로 돌려보내는 게 정상 흐름이다. `?? undefined` 로 넘겨 registry의 fallback에 맡긴다.
- 기존 테스트를 깨뜨리지 마라.
