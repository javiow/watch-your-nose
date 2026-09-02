# Step 4: reduced-motion-hook

## 읽어야 할 파일

- `/tests/setup.ts` (현재: `@testing-library/jest-dom/vitest` import + `afterEach(() => cleanup())` 만 있다)
- `/vitest.config.ts` (jsdom, `setupFiles: ["./tests/setup.ts"]`, alias `@` → `./src`)
- `/src/lib/session-context.tsx` (`"use client"` 모듈이 `src/lib/`에 있는 선례 — 훅을 `src/lib/`에 두는 게 이 프로젝트 패턴)
- `/docs/ADR.md` ADR-013 (jsdom `matchMedia` 없음 → `tests/setup.ts` shim 필요)
- `/CLAUDE.md`

## 배경

`prefers-reduced-motion: reduce` 여부를 구독하는 훅을 만든다. step5(`useMascotExpression`)와 step6(`Mascot`)이 이걸 써서 모션을 끈다.

**jsdom에는 `window.matchMedia`가 없다.** 그래서 이 step은 두 가지를 한다: (1) `tests/setup.ts`에 `matchMedia` shim 추가, (2) `useReducedMotion` 훅 + 테스트 작성.

`tests/setup.ts`는 `tdd-guard.sh` 면제(`tests/**`). `src/lib/useReducedMotion.ts`는 `.ts`라 `tdd-guard.sh` 대상 → 테스트를 먼저 작성한다.

## 작업

### 1. `tests/setup.ts` — matchMedia shim 추가

기존 `cleanup` 로직은 그대로 두고, 아래를 추가한다:

```ts
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
```

`matches: true` 또는 살아있는 `change` 리스너가 필요한 개별 테스트는 각 테스트 파일에서 `window.matchMedia`를 `vi.fn()`으로 로컬 오버라이드한다(이 shim은 "없으면 기본값" 역할만).

### 2. `src/lib/useReducedMotion.test.ts` (먼저)

`@testing-library/react`의 `renderHook`으로:

- `matchMedia`가 `{ matches: false }`를 반환하도록 스텁 → 훅이 `false` 반환.
- `matchMedia`가 `{ matches: true, addEventListener, removeEventListener }`를 반환하도록 스텁 → `useEffect` 후 훅이 `true` 반환.
- 캡처한 `change` 리스너를 `matches: true`로 호출 → 훅 값이 `true`로 갱신된다(`act`로 감싸기).
- `window.matchMedia`를 `undefined`로 만든 상태에서 렌더 → throw 없이 `false` 반환.
- unmount 시 `removeEventListener`(또는 레거시 `removeListener`)가 호출된다(spy).

### 3. `src/lib/useReducedMotion.ts`

```ts
"use client";
export function useReducedMotion(): boolean;
```

핵심 규칙:

- 초기 state는 **`false`** 로 고정한다(SSR/최초 렌더 결정적 — 하이드레이션 불일치 방지). 실제 값은 `useEffect`에서 읽어 설정한다.
- `useEffect` 안에서만 `window.matchMedia("(prefers-reduced-motion: reduce)")`에 접근한다. `typeof window === "undefined" || typeof window.matchMedia !== "function"` 이면 아무것도 하지 않고 `false` 유지.
- `change` 이벤트를 구독한다. `mql.addEventListener` 가 있으면 그걸, 없으면 레거시 `mql.addListener`를 쓴다. cleanup에서 대응되는 해제 함수 호출.
- 모듈 최상위(파일 스코프)에서 `window`에 접근하지 마라.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

추가:
- `npx vitest run src/lib/useReducedMotion.test.ts` 통과.
- `npx vitest run` 전체가 통과한다(shim 추가로 기존 테스트가 깨지지 않음).
- `git status` 변경 파일: `tests/setup.ts`, `src/lib/useReducedMotion.ts`, `src/lib/useReducedMotion.test.ts` 만.

## 검증 절차

1. 위 AC를 실행한다.
2. 체크리스트:
   - 테스트를 구현보다 먼저 작성했는가?
   - 훅이 파일 스코프에서 `window`를 만지지 않는가? (`useEffect` 안에서만)
   - 초기 state가 `false`인가?
   - `tests/setup.ts`의 기존 `cleanup` 로직이 그대로인가?
3. `phases/6-landing-redesign/index.json`의 `step: 4`를 업데이트한다.

## 금지사항

- `tests/setup.ts`의 기존 import·`afterEach(cleanup)`를 삭제·변경하지 마라. 추가만.
- 훅 초기 state를 `window.matchMedia(...).matches`로 초기화하지 마라. 이유: SSR에서 `window`가 없어 터지고, 클라이언트 최초 렌더와 서버 렌더 결과가 달라 하이드레이션 경고가 난다.
- `useReducedMotion.ts`를 `src/components/` 아래 두지 마라 — `src/lib/`에 둔다(이 프로젝트는 `session-context.tsx`처럼 `"use client"` 훅/컨텍스트도 `src/lib/`에 둔다).
- 다른 `src/` 파일을 수정하지 마라.
- 기존 테스트를 깨뜨리지 마라.
