# Step 5: mascot-expression-hook

## 읽어야 할 파일

- `/src/lib/mascot-frames.ts` (step3 — `MascotExpression` 타입, 타이밍 상수: `BLINK_MIN_MS`, `BLINK_MAX_MS`, `BLINK_HOLD_MS`, `OCCASIONAL_LOOK_EVERY`, `OCCASIONAL_LOOK_MS`, `REACTION_SURPRISE_MS`, `REACTION_SETTLE_MS`)
- `/src/lib/useReducedMotion.ts` (step4 — `useReducedMotion(): boolean`)
- `/src/lib/useReducedMotion.test.ts` (step4 — fake timer / matchMedia 스텁 패턴 참고)
- `/tests/setup.ts` (step4에서 matchMedia shim 추가됨)
- `/src/lib/session-context.tsx` (`"use client"` 훅을 `src/lib/`에 두는 선례)
- `/docs/ADR.md` ADR-013

## 배경

마스코트의 현재 표정을 관리하는 상태 머신 훅. **idle 루프**(눈 깜빡임 + 가끔 sleepy)와 **외부 트리거**(커서 근접/hover/press → "놀람→걱정→복귀")를 합친다. step6의 `Mascot` 컴포넌트가 `interactive` 모드에서 이 훅을 쓴다.

`src/lib/useMascotExpression.ts`는 `tdd-guard.sh` 대상 → 테스트 먼저.

## 작업

### 1. `src/lib/useMascotExpression.test.ts` (먼저)

`renderHook` + `vi.useFakeTimers()` 로:

- 마운트 직후 `expression === "idle"`.
- `vi.advanceTimersByTime(BLINK_MAX_MS)` → `expression === "blink"`; 이어서 `BLINK_HOLD_MS` → `"idle"` 복귀.
- `act(() => result.current.react())` → `"surprised"`; `+REACTION_SURPRISE_MS` → `"worried"`; `+REACTION_SETTLE_MS` → `"idle"`.
- settle 전에 다시 `react()` → `"surprised"` 유지되고 settle 타이머가 리셋된다.
- `matchMedia` 스텁을 `matches: true`로 → `expression`이 `baseExpression`("idle")에 고정, `react()` 호출해도 안 바뀜, `vi.getTimerCount() === 0`.
- `useMascotExpression({ enabled: false })` → `baseExpression` 고정, 타이머 없음.
- `useMascotExpression({ controlledExpression: "sad" })` → 항상 `"sad"`, `react()` 무시, 타이머 없음.
- `useMascotExpression({ baseExpression: "relieved" })` → idle 복귀 지점이 `"relieved"`.
- unmount 후 `vi.getTimerCount() === 0`, "state update on unmounted component" 경고 없음.

### 2. `src/lib/useMascotExpression.ts`

```ts
"use client";
import type { MascotExpression } from "@/lib/mascot-frames";

interface UseMascotExpressionOptions {
  enabled?: boolean;                       // default true — idle 루프 + 트리거 활성
  baseExpression?: MascotExpression;       // default "idle"
  controlledExpression?: MascotExpression; // 지정 시 그대로 반환(제어 모드)
}

interface UseMascotExpressionResult {
  expression: MascotExpression;
  isReducedMotion: boolean;
  react: (kind?: "surprised") => void;
  bind: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onPointerDown: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
}

export function useMascotExpression(
  options?: UseMascotExpressionOptions,
): UseMascotExpressionResult;
```

상태 머신 규칙(반드시 지킬 것):

- `controlledExpression`이 있으면 그 값을 그대로 반환하고 **타이머를 하나도 걸지 않는다**. `bind` 핸들러와 `react`는 no-op.
- `useReducedMotion()`이 `true` **이거나** `enabled === false` 이면 `expression === baseExpression` 고정, `bind`/`react` no-op, 타이머 없음.
- 그 외(활성):
  - **idle 루프**: `useRef`에 담은 **자기재예약 `setTimeout`**. `BLINK_MIN_MS`~`BLINK_MAX_MS` 랜덤 간격마다 `"blink"`로 바꾸고 `BLINK_HOLD_MS` 뒤 `baseExpression`으로 되돌린다. 매 `OCCASIONAL_LOOK_EVERY`번째 틱은 `"blink"` 대신 `"sleepy"`를 `OCCASIONAL_LOOK_MS` 동안 보여준다.
  - **트리거**(`react()` / `onMouseEnter` / `onPointerDown` / `onFocus`): idle·reaction 타이머를 모두 클리어하고 `"surprised"` → `REACTION_SURPRISE_MS` 뒤 `"worried"` → 추가 `REACTION_SETTLE_MS` 동안 새 트리거가 없으면 `baseExpression`으로 복귀하고 idle 루프 재시작. 트리거가 다시 들어오면 타이머 리셋(`"surprised"` 유지).
  - `onMouseLeave` / `onBlur`: settle 타이머를 앞당겨 시작(딱딱하게 즉시 복귀시키지 말 것).
- **SSR/최초 렌더**: 파일 스코프와 첫 렌더에서 `window`·타이머에 접근하지 않는다. 첫 렌더 반환값은 서버·클라 모두 `controlledExpression ?? baseExpression`.
- **cleanup**: `useEffect` cleanup에서 ref에 담긴 모든 타이머를 클리어한다. `setInterval`을 쓰지 마라 — `setTimeout` 재귀만. 이유: unmount 후 `vi.getTimerCount()`가 0이어야 하고, fake timer 테스트에서 누수가 잡힌다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

추가:
- `npx vitest run src/lib/useMascotExpression.test.ts` 통과.
- `git status` 변경 파일: `src/lib/useMascotExpression.ts`, `src/lib/useMascotExpression.test.ts` 만.

## 검증 절차

1. 위 AC를 실행한다. 콘솔에 "state update on an unmounted component" 경고가 없는지 확인한다.
2. 체크리스트:
   - 테스트를 먼저 작성했는가?
   - 타이밍 값을 하드코딩하지 않고 `@/lib/mascot-frames`에서 import 했는가?
   - `setInterval`을 안 쓰고 `setTimeout` 재귀만 썼는가?
   - reduced-motion / `enabled:false` / `controlledExpression` 경로에서 타이머가 0인가?
   - `useSession`이나 React Context를 import 하지 않았는가?
3. `phases/6-landing-redesign/index.json`의 `step: 5`를 업데이트한다.

## 금지사항

- `setInterval`을 쓰지 마라. 이유: fake timer 테스트에서 unmount 후 타이머 누수(`getTimerCount() > 0`)로 잡힌다.
- `useSession` / `SessionContext` / 라우터를 import 하지 마라. 이유: 이 훅은 세션과 무관하고, step6에서 provider 없이도 렌더돼야 한다.
- 타이밍 상수를 이 파일에 리터럴로 박지 마라 — `@/lib/mascot-frames`에서 가져온다.
- 파일 스코프나 첫 렌더에서 `window`/`document`/타이머에 접근하지 마라.
- 다른 `src/` 파일을 수정하지 마라.
- 기존 테스트를 깨뜨리지 마라.
