# Step 1: difficulty-type-and-data

## 읽어야 할 파일

먼저 아래 파일들을 읽고 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (특히 "개발 프로세스: 테스트 먼저" · 아키텍처 규칙)
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md` (ADR-012 — 이번 phase의 배경)
- `/src/types/experience.ts` — 이번 step에서 수정할 타입 파일. `JeonseDifficulty`, `JeonseHouse.difficulty`, `ExperienceModule`, `VoicePhishingScenario`, `CaseInvestigationContent`, `FraudJudgmentCard` 정의를 정독하라.
- `/src/data/jeonse.ts` — `JEONSE_HOUSES` 각 항목의 `difficulty` 값이 이미 채워져 있음을 확인하라(easy 14 / medium 10 / hard 18).
- `/src/data/jeonse.test.ts` — 기존 데이터 무결성 테스트 스타일(named import from `vitest`, 한글 `describe/it`).
- `/src/data/remediation.ts` — 작은 정적 데이터 파일 + 상수 export 스타일 참고.

## 배경

체험에 난이도(쉬움/중간/어려움)를 도입한다. 이 step은 **타입 + 난이도 콘텐츠 데이터 레이어**만 다룬다. 세션 상태(step2), 선택 로직(step3), 폼 컴포넌트(step4), 페이지 배선(step5)은 이후 step에서 다룬다.

핵심:
- 난이도 코드 값은 `"easy" | "medium" | "hard"` 유니온. 화면 표시용 한글 라벨(쉬움/중간/어려움)은 별도(`Grade`/`GRADE_LABELS` 패턴과 동일).
- 전세매물만 이미 난이도 태깅이 완료돼 있다. 나머지 3개 유형에는 `difficulty` 필드를 **선택적(optional)** 으로만 추가한다 — 이번 phase에서 값을 채우지 않는다.

## 작업

### 1. `src/types/experience.ts` 수정

> `types/` 는 tdd-guard 예외라 테스트를 먼저 만들지 않아도 된다. 아래 변경은 전부 후방호환이므로 이 step만으로도 `npm run build`가 통과해야 한다(기존 `pickRandomContent()` 호출부·구현부는 인자 없는 형태 그대로 유효).

1-1. 공용 `Difficulty` 타입을 추가한다. 위치는 `Grade` 정의 근처가 자연스럽다.

```ts
// 난이도 선택 필터 전용 코드 값. 화면 표시용 한글 라벨은 src/data/difficulty.ts.
export type Difficulty = "easy" | "medium" | "hard";
```

1-2. 기존 `JeonseDifficulty` 를 `Difficulty` 의 별칭으로 바꾼다. 그 위에 있던 jeonse용 의미 주석(easy/medium/hard가 각각 무엇을 뜻하는지)은 **유지**한다.

```ts
// (기존 의미 주석 유지)
// easy: risky/safe 판정을 뒷받침하는 위험 신호가 다수·명확. medium: 항목을 종합하거나 계산해야 판정 가능.
// hard: 숫자·용어만 보면 반대로 오판하기 쉬운 반전형.
export type JeonseDifficulty = Difficulty;
```

1-3. `ExperienceModule` 인터페이스의 `pickRandomContent` 시그니처에 선택적 인자를 추가한다.

```ts
export interface ExperienceModule<TContent = unknown> {
  typeId: ExperienceTypeId;
  contentPool: TContent[];
  pickRandomContent(difficulty?: Difficulty): TContent;
  Component: ComponentType<ExperienceComponentProps<TContent>>;
}
```

1-4. `VoicePhishingScenario`, `CaseInvestigationContent`, `FraudJudgmentCard` 세 인터페이스에 **선택적** 필드를 추가한다. `JeonseHouse.difficulty` 는 필수 그대로 둔다.

```ts
  // 렌더링 금지 — 난이도 필터 전용 내부 메타데이터. 이번 범위에서는 미태깅(후속 작업).
  difficulty?: Difficulty;
```

### 2. `src/data/difficulty.ts` — 테스트 먼저

> 이 파일은 tdd-guard 대상이다. **`src/data/difficulty.test.ts` 를 먼저 만들고**, 실패를 확인한 뒤 구현한다.

2-1. `src/data/difficulty.test.ts` 작성. `describe("DIFFICULTY_OPTIONS")` 아래 최소 다음을 검증한다:

- `DIFFICULTY_OPTIONS.map((o) => o.id)` 가 `["easy", "medium", "hard"]` 와 정확히 일치한다(순서 포함).
- 모든 옵션의 `label` 과 `description` 이 비어있지 않다(`.length > 0`).
- `label`·`description` 어디에도 체험 유형을 암시하는 단어가 없다. 금지어 배열: `["전세", "매물", "보이스피싱", "피싱", "통화", "사례", "카드", "등기", "임대"]`. (CLAUDE.md CRITICAL — 유형 비노출.)
- `id` 값 집합의 크기가 3이다(중복 없음).

2-2. `src/data/difficulty.ts` 구현:

```ts
import type { Difficulty } from "@/types/experience";

export interface DifficultyOption {
  id: Difficulty;
  label: string;
  description: string;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { id: "easy",   label: "쉬움",   description: "위험 신호가 뚜렷해 비교적 알아채기 쉬운 편이에요." },
  { id: "medium", label: "중간",   description: "여러 정보를 함께 따져봐야 판단할 수 있어요." },
  { id: "hard",   label: "어려움", description: "겉으로 보이는 것과 실제가 달라 헷갈리기 쉬워요." },
];
```

문구는 위 그대로 사용한다(팀 확정본). 순서는 반드시 easy → medium → hard.

### 3. `src/data/jeonse.test.ts` — 전제 조건 1줄 추가

`describe("JEONSE_HOUSES")` 블록 안에 아래 취지의 테스트 1개를 추가한다(기존 "각각 최소 1개 이상" 테스트는 그대로 둔다):

```ts
it("easy/medium/hard 난이도가 각각 5채 이상 존재한다", () => {
  // step3의 전세매물 즉석 5채 세트 구성이 fallback 없이 동작하기 위한 전제.
  for (const level of ["easy", "medium", "hard"] as const) {
    const count = JEONSE_HOUSES.filter((h) => h.difficulty === level).length;
    expect(count).toBeGreaterThanOrEqual(5);
  }
});
```

## Acceptance Criteria

```bash
npm run build   # 타입 에러 없음 (테스트 파일 포함 전체 타입체크)
npm run lint
npm test        # 기존 전부 통과 + difficulty.test.ts + jeonse.test.ts 신규 케이스 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - `Difficulty` 유니온이 `"easy" | "medium" | "hard"` 이고, 한글 라벨은 `src/data/difficulty.ts` 에만 있는가?
   - `JeonseDifficulty` 별칭화 후에도 `src/data/jeonse.ts`, `JeonseExperience.test.tsx`, `jeonse/HouseDialogPanel.test.tsx`, `jeonse/MapBoard.test.tsx` 가 수정 없이 통과하는가?
   - 3개 유형에 추가한 `difficulty` 필드가 **선택적(`?`)** 인가? (필수로 만들면 기존 데이터·픽스처가 전부 깨진다.)
   - `difficulty.test.ts` 를 `difficulty.ts` 보다 먼저 커밋 가능한 상태로 만들었는가(TDD)?
3. 결과에 따라 `phases/5-difficulty-selection/index.json`의 `step: 1` 항목을 업데이트한다.

## 금지사항

- `src/lib/registry.ts` 를 수정하지 마라. 이유: `pickRandomContent` 구현부 재배선은 step3이다. 이 step에서는 인터페이스 시그니처만 넓힌다(0-인자 구현은 넓어진 시그니처에 그대로 대입되므로 build가 깨지지 않는다).
- `src/lib/session-context.tsx`, `src/app/**` 를 수정하지 마라. 이유: step2·step5 범위다.
- 보이스피싱/케이스 조사/사기 판별 카드 데이터 파일에 `difficulty` 값을 채워 넣지 마라. 이유: 콘텐츠 난이도 판정은 이번 범위 밖(ADR-012)이며, 임의로 매기면 팀 검수 없이 잘못된 난이도가 박힌다.
- `difficulty.ts` 의 문구를 임의로 바꾸지 마라(팀 확정본).
- 기존 테스트를 깨뜨리지 마라.
