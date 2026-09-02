# Step 3: registry-difficulty-selection

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` (플러그인 레지스트리 패턴, "엣지 케이스" — `contentPool` 비어있으면 에러, `pickSessionPlan` 유형 1회씩)
- `/docs/ADR.md` (ADR-004 랜덤 선택, ADR-012 난이도 필터 규칙 — fallback / 전세매물 즉석 5채)
- `/src/lib/registry.ts` — 이번 step에서 수정할 파일. 4개 모듈의 `pickRandomContent` 클로저와 `pickSessionPlan` 의 Fisher–Yates 루프를 정독하라.
- `/src/lib/registry.test.ts` — 기존 테스트. `makeModule` 헬퍼, `EXPERIENCE_MODULES` / `pickSessionPlan` describe 블록 스타일.
- `/src/lib/scoring.ts` — 순수 함수를 named export 하고 `scoring.test.ts` 에서 직접 단위 테스트하는 선례(`computeGrade`, `getBestEndingOption` 등). `pickByDifficulty` 도 같은 방식으로 export 한다.
- `/src/data/jeonse.ts` — `JEONSE_HOUSES`(42채, `difficulty` 채워짐), `JEONSE_HOUSE_SETS`(5채씩 정적 분할 8세트). 이번 step에서 이 파일은 **수정하지 않는다**.
- `/src/types/experience.ts` — step1에서 넓어진 `pickRandomContent(difficulty?: Difficulty)` 시그니처, `Difficulty`, `JeonseHouse`.

## 배경 (step1~2 완료 상태)

- step1: `Difficulty` 타입 추가, `ExperienceModule.pickRandomContent` 가 `(difficulty?: Difficulty)` 시그니처로 넓어짐, 3개 유형에 `difficulty?` 선택적 필드 추가(값은 미태깅), `src/data/difficulty.ts` 생성.
- step2: `SessionProvider` 에 `difficulty` 상태 추가.

이 step은 **선택 로직 레이어**만 다룬다. `registry.ts` 의 4개 모듈이 `difficulty` 를 받아 콘텐츠 풀을 좁히도록 재배선한다. 호출부(`/session`)는 step5에서 연결한다 — 이 step 이후에도 `pickRandomContent()` 를 인자 없이 호출하면 기존과 동일하게 동작해야 한다.

## 작업

### 1. `src/lib/registry.test.ts` — 테스트 먼저

기존 테스트는 그대로 두고, 아래를 추가한다. `import { EXPERIENCE_MODULES, pickByDifficulty, pickSessionPlan } from "./registry";` 로 확장, `import type { Difficulty } from "@/types/experience";`.

1-1. `describe("pickByDifficulty")`:
- 태그가 있는 풀에서 요청한 난이도의 항목만 반환한다 — 예: `[{difficulty:"easy",v:1},{difficulty:"easy",v:2},{difficulty:"hard",v:3}]` 로 30회 호출, 매번 `.difficulty === "easy"`.
- 요청한 난이도와 일치하는 항목이 없으면 예외 없이 전체 풀에서 반환한다 — 위 풀에 `"medium"` 요청 → 결과가 풀의 원소 중 하나.
- `difficulty` 인자가 `undefined` 면 전체 풀에서 반환한다.
- 난이도 태그가 전혀 없는 풀(`[{v:1},{v:2}]` 처럼 `difficulty` 키 자체가 없음)은 난이도를 무시하고 전체 풀에서 반환한다.

1-2. `describe("EXPERIENCE_MODULES 난이도 선택")`:
- 모든 모듈은 `["easy","medium","hard",undefined]` 각각에 대해 `pickRandomContent(d)` 가 `undefined` 아닌 값을 반환한다.
- `jeonse` 모듈은 `["easy","medium","hard"]` 각각에 대해 `pickRandomContent(d)` 가 길이 5 배열이고, 그 5채가 전부 `.difficulty === d` 다. (몇 회 반복해 확인.)
- `jeonse` 모듈을 인자 없이 호출하면 길이 5 배열을 반환한다(기존 동작 유지 — `JEONSE_HOUSE_SETS` 의 한 세트).

### 2. `src/lib/registry.ts` 구현

2-1. import 보강:
- `@/data/jeonse` 에서 `JEONSE_HOUSES` 를 추가로 가져온다(`JEONSE_HOUSE_SETS` 는 그대로 유지).
- `@/types/experience` 에서 `Difficulty`, `JeonseHouse` 타입을 가져온다.

2-2. Fisher–Yates를 헬퍼로 추출한다. `pickSessionPlan` 은 이 헬퍼를 쓰도록 바꾼다 — **동작은 완전히 동일**해야 한다("각 유형 정확히 1회" 테스트가 가드).

```ts
function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
```

2-3. `pickByDifficulty` 를 **export** 한다:

```ts
export function pickByDifficulty<T extends { difficulty?: Difficulty }>(
  pool: T[],
  difficulty?: Difficulty,
): T {
  const matching = difficulty ? pool.filter((x) => x.difficulty === difficulty) : [];
  const source = matching.length > 0 ? matching : pool;
  return source[Math.floor(Math.random() * source.length)];
}
```

2-4. 전세매물 전용 private 헬퍼 `pickJeonseSet` 을 추가한다. 콘텐츠 단위가 "매물 5채"라 `pickByDifficulty` 를 그대로 못 쓴다.

```ts
const JEONSE_SET_SIZE = 5;

function pickJeonseSet(difficulty?: Difficulty): JeonseHouse[] {
  if (difficulty) {
    const pool = JEONSE_HOUSES.filter((h) => h.difficulty === difficulty);
    if (pool.length >= JEONSE_SET_SIZE) {
      return shuffle(pool).slice(0, JEONSE_SET_SIZE);
    }
  }
  return JEONSE_HOUSE_SETS[Math.floor(Math.random() * JEONSE_HOUSE_SETS.length)];
}
```

2-5. `EXPERIENCE_MODULES` 의 4개 `pickRandomContent` 클로저를 재배선한다. `contentPool` 은 4개 모두 **그대로 유지**한다(`jeonse` 의 `contentPool` 도 `JEONSE_HOUSE_SETS` 유지 — fallback 소스이자 기존 무결성 테스트 대상).

```ts
// voice-phishing
pickRandomContent: (difficulty?: Difficulty) =>
  pickByDifficulty(VOICE_PHISHING_SCENARIOS, difficulty),

// case-investigation
pickRandomContent: (difficulty?: Difficulty) =>
  pickByDifficulty(CASE_INVESTIGATION_CASES, difficulty),

// jeonse
pickRandomContent: (difficulty?: Difficulty) => pickJeonseSet(difficulty),

// fraud-judgment
pickRandomContent: (difficulty?: Difficulty) =>
  pickByDifficulty(FRAUD_JUDGMENT_CARDS, difficulty),
```

2-6. `assertContentPools` / `pickSessionPlan` 의 시그니처·동작은 바꾸지 않는다(난이도는 콘텐츠 픽에만 관여하고 유형 순서 셔플에는 관여하지 않는다).

> 참고: 이번 범위에서 `VOICE_PHISHING_SCENARIOS`·`CASE_INVESTIGATION_CASES`·`FRAUD_JUDGMENT_CARDS` 는 `difficulty` 가 미태깅이므로 `pickByDifficulty` 는 항상 fallback 경로(전체 풀)를 타서 기존과 동일하게 동작한다. 이는 의도된 것이다(ADR-012).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test        # registry.test.ts 신규 + 기존 6개 + 그 외 전부 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - `pickSessionPlan` 결과가 step 이전과 동일한가(각 유형 정확히 1회)? `shuffle` 추출이 동작을 바꾸지 않았는가?
   - `pickRandomContent()` 를 인자 없이 호출했을 때 4개 유형 모두 기존과 동일하게 동작하는가?
   - `jeonse` `"hard"` 로 뽑은 5채가 전부 hard이고, id "41"/"42"(현재 인덱스 40/41, 기존 세트 미포함)도 후보에 들어가는가?
   - `src/data/jeonse.ts` 를 수정하지 않았는가? `JEONSE_HOUSE_SETS` describe 테스트가 그대로 통과하는가?
3. 결과에 따라 `phases/5-difficulty-selection/index.json`의 `step: 3` 항목을 업데이트한다.

## 금지사항

- `src/data/jeonse.ts` 를 수정하지 마라(세트 재구성, `JEONSE_HOUSE_SETS` 삭제 등 금지). 이유: 난이도별 선택 로직은 전부 registry에 두고, 데이터 파일은 정적으로 유지한다. `JEONSE_HOUSE_SETS` 는 fallback 소스로 계속 필요하다.
- `pickRandomContent` 안에서 위험/안전(`risky`) 매물 균형 보정 같은 추가 로직을 넣지 마라. 이유: 요청 범위 밖이고, 기존 정적 세트도 균형을 보장하지 않았다(ADR-012 트레이드오프). 순수 `shuffle().slice(0, 5)` 로 유지한다.
- `src/lib/session-context.tsx`, `src/app/**`, `src/components/**` 를 수정하지 마라. 이유: step5에서 호출부를 연결한다.
- `pickSessionPlan` 에 `difficulty` 인자를 추가하지 마라. 이유: 난이도는 유형 순서가 아니라 유형별 콘텐츠 픽에만 관여한다.
- 기존 테스트를 깨뜨리지 마라.
