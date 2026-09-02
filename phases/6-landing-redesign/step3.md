# Step 3: mascot-frames

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md` (「패턴」 — 순수 로직은 `src/lib/`, 「디렉토리 구조」 `lib/`)
- `/docs/ADR.md` ADR-013
- `/CLAUDE.md` (순수 로직은 `src/lib/`에 분리 / 타입은 `src/types/`)
- `/src/types/experience.ts` (`Grade` 유니온 정의 위치 — `"safe" | "caution" | "danger"`)
- `/src/lib/scoring.ts` (`Grade`를 어떻게 import/사용하는지 패턴 참고)
- `/tests/setup.ts`, `/vitest.config.ts` (테스트 환경: jsdom, alias `@` → `./src`, setup은 `@testing-library/jest-dom/vitest` + `afterEach(cleanup)`)
- step1 산출물: `public/mascot/{idle,blink,surprised,worried,sleepy,sad}.webp`

## 배경

마스코트 표정 → 이미지 경로 매핑, 등급 → 표정 매핑, 모션 타이밍 상수를 담는 **순수 데이터 모듈**을 만든다. React·DOM·타이머를 import 하지 않는다(그건 step4·step5). 이 모듈은 step5(훅)·step6(컴포넌트)·step8(결과 페이지)이 참조한다.

`src/lib/` 아래 `.ts` 파일은 `tdd-guard.sh` 대상이다 — **콜로케이션 테스트 파일을 먼저 만들어야** 구현 파일 쓰기가 허용된다. 즉 `src/lib/mascot-frames.test.ts`를 먼저 작성한다.

## 작업

### 1. `src/lib/mascot-frames.test.ts` (먼저)

아래를 검증하는 테스트를 작성한다:

- `MASCOT_FRAME_SRC`의 모든 `MascotExpression` 키가 `/mascot/`로 시작하고 `.webp`로 끝나는 경로로 매핑된다.
- `MASCOT_FRAME_SRC`는 7개 키(`idle`, `blink`, `surprised`, `worried`, `sleepy`, `relieved`, `sad`)를 모두 가진다.
- `relieved`는 `blink`와 같은 파일(`/mascot/blink.webp`)로 매핑된다(웃는 소스 프레임이 없어 감은 눈 프레임 재사용 — ADR-013).
- `MASCOT_FRAME_FILES`는 중복 없는 배열이고, 길이가 6이며, `MASCOT_FRAME_SRC`의 모든 값을 포함한다.
- `GRADE_EXPRESSION`은 정확히 `"safe"`, `"caution"`, `"danger"` 3개 키를 가지며 각 값은 유효한 `MascotExpression`이다. `safe → "relieved"`, `caution → "worried"`, `danger → "sad"`.
- 타이밍 상수들이 모두 양의 정수이고 `BLINK_MIN_MS < BLINK_MAX_MS`.

### 2. `src/lib/mascot-frames.ts`

시그니처(내부 값은 위 테스트를 통과하도록):

```ts
import type { Grade } from "@/types/experience";

export type MascotExpression =
  | "idle" | "blink" | "surprised" | "worried" | "sleepy" | "relieved" | "sad";

export const MASCOT_FRAME_SRC: Record<MascotExpression, string>;
// idle→/mascot/idle.webp, blink→/mascot/blink.webp, surprised→/mascot/surprised.webp,
// worried→/mascot/worried.webp, sleepy→/mascot/sleepy.webp,
// relieved→/mascot/blink.webp (재사용), sad→/mascot/sad.webp

export const MASCOT_FRAME_FILES: string[];
// = [...new Set(Object.values(MASCOT_FRAME_SRC))]  — 프리로드용, 실제 6개

export const GRADE_EXPRESSION: Record<Grade, MascotExpression>;
// { safe: "relieved", caution: "worried", danger: "sad" }

// 모션 타이밍 상수 (step5 훅과 그 테스트가 import — 하드코딩 금지)
export const BLINK_MIN_MS = 3200;
export const BLINK_MAX_MS = 6000;
export const BLINK_HOLD_MS = 140;
export const OCCASIONAL_LOOK_EVERY = 4;   // 매 N번째 idle 틱마다 "sleepy"
export const OCCASIONAL_LOOK_MS = 900;
export const REACTION_SURPRISE_MS = 550;  // surprised → worried 까지
export const REACTION_SETTLE_MS = 1100;   // worried → baseExpression 까지
```

핵심 규칙:

- 이 파일은 **React / `next/image` / `window` / 타이머를 import 하지 않는다.** 순수 상수·타입만.
- `Grade`는 `@/types/experience`에서 `import type` 으로 가져온다. 로컬에서 재정의하지 마라.
- `GRADE_EXPRESSION`의 키는 `Grade` 유니온과 정확히 일치해야 한다(`Record<Grade, MascotExpression>` 타입이 이를 강제).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

추가:
- `npx vitest run src/lib/mascot-frames.test.ts` 가 통과한다.
- `git status`에 `src/lib/mascot-frames.ts` 와 `src/lib/mascot-frames.test.ts` 두 파일만 새로 추가됐다.

## 검증 절차

1. 위 AC를 실행한다.
2. 체크리스트:
   - 구현 파일보다 테스트 파일을 먼저 만들었는가(TDD)?
   - `mascot-frames.ts`가 React/DOM/타이머를 import 하지 않는가?
   - `Grade`를 `@/types/experience`에서 가져왔는가?
   - 경로 문자열이 step1의 실제 파일명(`idle.webp` 등)과 일치하는가?
3. `phases/6-landing-redesign/index.json`의 `step: 3`을 업데이트한다.

## 금지사항

- `src/lib/mascot-frames.ts`에서 `react`, `next/image`, `next/*`, `window`, `setTimeout`을 import/사용하지 마라. 이유: 순수 데이터 모듈이어야 step5 훅 테스트가 fake timer 없이 이 모듈만 격리 검증할 수 있다.
- 타이밍 상수를 step5 훅 안에 하드코딩하지 마라 — 여기서 export 하고 훅과 그 테스트가 import 한다.
- 다른 `src/` 파일(컴포넌트·페이지·다른 lib)을 수정하지 마라.
- 기존 테스트를 깨뜨리지 마라.
