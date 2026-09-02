# Step 2: session-difficulty-state

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` ("상태 관리" 절 — 세션 상태는 Context만, localStorage 없음)
- `/docs/ADR.md` (ADR-003 세션 상태 원칙, ADR-008 `playerInfo` 가 `resetSession()`으로 초기화되지 않는 선례, ADR-012)
- `/src/lib/session-context.tsx` — 이번 step에서 수정할 파일. `playerInfo` / `setPlayerInfo` 가 어떻게 상태·context value·memo deps에 엮여 있는지 정독하라.
- `/src/lib/session-context.test.tsx` — 기존 테스트. `TestConsumer` 컴포넌트와 `playerInfo` 관련 테스트 4개의 패턴을 그대로 따른다.
- `/src/types/experience.ts` — step1에서 추가된 `Difficulty` 타입.

## 배경 (step1 완료 상태)

step1에서 `src/types/experience.ts` 에 `export type Difficulty = "easy" | "medium" | "hard"` 가 추가되었고, `src/data/difficulty.ts` (`DIFFICULTY_OPTIONS`)가 생성되었다.

이 step은 **세션 상태 레이어**만 다룬다. `/difficulty` 화면(step5)이 저장하고 `/session`(step5)·`registry`(step3)가 읽을 `difficulty` 필드를 `SessionProvider` 에 추가한다. 규칙은 기존 `playerInfo` 와 100% 동일하다:

- 초기값 `null`.
- 세터로 한 번 설정된다.
- `resetSession()` 이 **건드리지 않는다** — "다시 체험하기"가 `/difficulty` 를 다시 거치지 않게.

## 작업

### 1. `src/lib/session-context.test.tsx` — 테스트 먼저

`TestConsumer` 를 확장하고, 기존 `playerInfo` 테스트와 대칭인 테스트 2개를 추가한다.

1-1. `TestConsumer`:
- `useSession()` 구조분해에 `difficulty`, `setDifficulty` 추가.
- `<span data-testid="difficulty">{difficulty ?? "null"}</span>` 렌더.
- `<button onClick={() => setDifficulty("hard")}>set-difficulty</button>` 추가.

1-2. 추가 테스트:

```ts
it("setDifficulty를 호출하면 difficulty가 갱신된다", () => {
  // 초기 "null" → set-difficulty 클릭 → "hard"
});

it("setDifficulty 호출 후 resetSession()을 호출해도 difficulty는 유지된다", () => {
  // 기존 "setPlayerInfo 호출 후 resetSession()..." 테스트와 동일 구조
});
```

### 2. `src/lib/session-context.tsx` 구현

`playerInfo` 를 그대로 미러한다.

2-1. `import type { Difficulty } from "@/types/experience";` 추가(기존 `ExperienceTypeId, ModuleResult` import 줄에 합쳐도 됨).

2-2. `SessionContextValue` 인터페이스에 추가:

```ts
  difficulty: Difficulty | null;
  setDifficulty: (difficulty: Difficulty) => void;
```

2-3. `SessionProvider` 본문에 상태 추가:

```ts
const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
```

2-4. `resetSession` 은 **수정하지 않는다** (difficulty를 건드리면 안 됨).

2-5. `value` 메모의 객체에 `difficulty, setDifficulty` 를 추가하고, deps 배열에 `difficulty` 를 추가한다. `setDifficulty` 는 `useState` 세터라 안정적이므로 deps에 넣지 않는다(기존 `setPlayerInfo` 와 동일 처리).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test        # 기존 session-context 테스트 4개 + 신규 2개 통과, 그 외 전부 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - `difficulty` 가 `playerInfo` 와 정확히 같은 방식으로 다뤄지는가? (초기 `null`, `resetSession` 무관, memo deps 포함, 세터는 deps 제외)
   - `resetSession` 본문이 step 이전과 동일한가? (diff 없어야 함)
   - localStorage/sessionStorage 등 영속화 코드를 추가하지 않았는가? (ADR-003)
3. 결과에 따라 `phases/5-difficulty-selection/index.json`의 `step: 2` 항목을 업데이트한다.

## 금지사항

- `resetSession()` 안에서 `setDifficulty(null)` 같은 초기화를 하지 마라. 이유: ADR-008/ADR-012 — 재체험 시 난이도를 다시 묻지 않는 것이 의도된 동작이다.
- `src/lib/registry.ts`, `src/app/**`, `src/components/**` 를 수정하지 마라. 이유: step3·step4·step5 범위다.
- `difficulty` 를 localStorage 등에 영속화하지 마라. 이유: ADR-003 — 새로고침 시 처음부터 재시작이 제품 결정이다.
- 기존 테스트를 깨뜨리지 마라.
