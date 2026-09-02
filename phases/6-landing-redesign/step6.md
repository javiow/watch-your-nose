# Step 6: mascot-component

## 읽어야 할 파일

- `/src/components/ui/Mascot.tsx` (현재 구현 — `next/image`로 `/mascot.png` 480×444, `alt="" aria-hidden="true" priority`, prop은 `className?` 만)
- `/src/components/ui/Mascot.test.tsx` (현재 테스트 — **`render(<Mascot />)` 를 props·`SessionProvider` 없이** 호출하고 `container.querySelector("img")` 가 존재하며 `aria-hidden="true"` 를 기대. 이 케이스는 계속 통과해야 한다)
- `/src/lib/mascot-frames.ts` (step3 — `MascotExpression`, `MASCOT_FRAME_SRC`, `MASCOT_FRAME_FILES`)
- `/src/lib/useMascotExpression.ts` (step5 — `useMascotExpression(options)`)
- `/src/lib/useReducedMotion.ts` (step4)
- `/src/app/globals.css` (step2 — `.mascot-frame`, `.mascot-bob`, `.mascot-pop-in` 클래스)
- `/tests/setup.ts` (step4 — matchMedia shim)
- `/src/app/page.tsx` (현재 `<Mascot className="h-36 w-auto sm:h-44" />` 로 소비 — step7에서 바뀌지만 참고)
- `/eslint.config.mjs` (`next/core-web-vitals` — `@next/next/no-img-element` 규칙: raw `<img>` 금지, `next/image` 사용)

## 배경

`Mascot`을 표정 프레임 6장을 겹쳐 놓고 opacity로 크로스페이드하는 컴포넌트로 재작성한다. 랜딩 히어로(step7)에서는 `interactive`로, 결과 페이지(step8)에서는 `expression`(제어)로 쓴다.

**하위 호환이 핵심이다**: `<Mascot />`를 props 없이·`SessionProvider` 없이·SSR로 렌더해도 장식용 `img`(`aria-hidden="true"`)가 나와야 하고 throw하면 안 된다. 새로 추가하는 모든 prop은 optional이어야 한다.

## 작업

### 1. `src/components/ui/Mascot.test.tsx` 갱신 (구현 전)

**기존 케이스를 유지**하고(문구 그대로: props 없이 렌더 → `img` 존재 + `aria-hidden="true"`), 아래를 추가한다:

- `render(<Mascot />)` → `container.querySelectorAll("img").length === MASCOT_FRAME_FILES.length` (프레임 전부 렌더).
- `render(<Mascot expression="surprised" />)` → 래퍼 요소에 `data-expression="surprised"`; `surprised.webp` 를 `src`에 가진 `img`가 `opacity-100` 클래스(활성), 나머지는 `opacity-0`.
- `render(<Mascot interactive />)` 후 `fireEvent.mouseEnter(wrapper)` → 래퍼 `data-expression="surprised"` 로 바뀐다. (jsdom `PointerEvent`가 불완전하므로 `mouseEnter`로 검증한다.)
- `window.matchMedia`를 `matches: true`로 스텁 + `render(<Mascot interactive />)` + `fireEvent.mouseEnter` → `data-expression`이 `"idle"` 그대로(모션 꺼짐).
- 래퍼 요소가 `aria-hidden="true"` 를 가진다.

### 2. `src/components/ui/Mascot.tsx` 재작성

```ts
import type { RefObject } from "react";
import type { MascotExpression } from "@/lib/mascot-frames";

interface MascotProps {
  className?: string;                       // 프레임 박스 크기 (하위 호환)
  expression?: MascotExpression;            // 제어 모드 — idle 루프/트리거 비활성
  interactive?: boolean;                    // default false — idle 루프 + hover/press/focus 반응
  float?: boolean;                          // default = interactive — CSS bob + pop-in 래퍼
  proximityRef?: RefObject<HTMLElement | null>; // 커서 근접 감지 대상 조상 요소
  proximityRadius?: number;                 // px, default 140
  priority?: boolean;                       // default = interactive — next/image priority
}

export function Mascot(props: MascotProps): JSX.Element;
```

렌더 구조:

- 루트: `<span aria-hidden="true" data-expression={active} className={wrapperClasses} {...maybeBind}>`.
  - `wrapperClasses`에 `float`(기본값 = `interactive`)이면 `mascot-bob mascot-pop-in` 포함.
  - `maybeBind`: `interactive && !expression` 일 때만 `useMascotExpression`의 `bind`를 스프레드. 그 외엔 붙이지 않는다.
- 안쪽: `className`으로 크기가 정해지는 `relative` 박스. 그 안에 `MASCOT_FRAME_FILES`의 **모든** 파일을 `next/image`로 렌더:
  - `fill`, `sizes="(max-width: 640px) 60vw, 320px"`, `alt=""`, `aria-hidden` (부모가 이미 `aria-hidden`이지만 무해), `className="mascot-frame object-contain " + (file === activeSrc ? "opacity-100" : "opacity-0")`.
  - `priority` (기본값 = `interactive`)가 `true`면 활성(idle) 프레임에 `priority`; 나머지 프레임에는 `loading="eager"` 를 줘서 마운트 시 전부 프리로드한다(첫 표정 전환 깜빡임 방지).
- `active` 표정 = `expression ?? hook.expression`. `activeSrc = MASCOT_FRAME_SRC[active]`.
- 훅 호출: `const hook = useMascotExpression({ enabled: Boolean(interactive) && !expression, controlledExpression: expression });`
- **근접 감지**: `interactive && !expression && proximityRef?.current && !hook.isReducedMotion` 일 때만 `useEffect`에서 `proximityRef.current`에 `pointermove` 리스너를 붙인다. 매 이동마다 마스코트 박스의 `getBoundingClientRect()` 중심과 포인터 좌표의 거리를 계산해 `proximityRadius`(기본 140) 이내면 `hook.react()` 호출. cleanup에서 리스너 제거. `typeof window === "undefined" || typeof PointerEvent === "undefined"` 이면 리스너를 붙이지 않는다.

핵심 규칙:

- **`useSession` / any React Context를 import 하지 마라.** 이유: `Mascot.test.tsx`가 provider 없이 렌더한다.
- raw `<img>` 를 쓰지 마라 — `next/image`. 이유: `eslint.config.mjs`의 `@next/next/no-img-element`.
- 모든 새 prop은 optional. `<Mascot />`(zero prop)에서 훅은 `enabled: false`로 호출돼 타이머 없이 `"idle"` 프레임을 정적으로 보여준다.
- `next/image` 로컬 경로(`/mascot/*.webp`)만 쓴다 — `next.config.ts` 수정 불필요, 하지 마라.

### 3. 레거시 애셋 제거

`Mascot.tsx` 재작성 후 `grep -rn "mascot.png" src/` 결과가 비어 있으면(참조 0), `git rm public/mascot.png` 로 삭제한다. 참조가 남아 있으면 삭제하지 말고 `summary`에 남은 참조 위치를 적는다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

추가:
- `npx vitest run src/components/ui/Mascot.test.tsx` 통과(기존 zero-prop 케이스 포함).
- `grep -rn "mascot.png" src/` 결과가 비어 있다.
- `git status`: `src/components/ui/Mascot.tsx`, `src/components/ui/Mascot.test.tsx` 수정 + `public/mascot.png` 삭제.

## 검증 절차

1. 위 AC를 실행한다.
2. 체크리스트:
   - `render(<Mascot />)`(props·provider 없음)가 여전히 `img[aria-hidden="true"]`를 내는가?
   - `Mascot.tsx`가 `useSession`/Context를 import 하지 않는가?
   - raw `<img>` 없이 `next/image`만 쓰는가?
   - `interactive` 없이 렌더 시 타이머가 걸리지 않는가(훅 `enabled:false`)?
   - `next.config.ts`를 건드리지 않았는가?
3. `phases/6-landing-redesign/index.json`의 `step: 6`을 업데이트한다.

## 금지사항

- `Mascot.tsx`에서 `useSession`·`SessionContext`·`next/navigation`을 import 하지 마라. 이유: 컴포넌트 테스트가 provider 없이 렌더하며, 장식 요소는 세션과 무관해야 한다.
- raw `<img>` 태그를 쓰지 마라. 이유: lint 규칙 `@next/next/no-img-element`.
- 기존 `Mascot.test.tsx`의 "props 없이 렌더 → `img` + `aria-hidden`" 케이스를 삭제·완화하지 마라.
- 새 prop을 required로 만들지 마라 — 전부 optional.
- `next.config.ts` / `package.json`을 수정하지 마라.
- 참조가 남아 있는데 `public/mascot.png`를 삭제하지 마라.
- 기존 테스트(특히 `src/app/page.test.tsx`)를 깨뜨리지 마라 — 이 step에서 `page.tsx`는 아직 옛 `<Mascot className=... />` 호출을 유지하며, 그것도 새 컴포넌트에서 정상 렌더돼야 한다.
