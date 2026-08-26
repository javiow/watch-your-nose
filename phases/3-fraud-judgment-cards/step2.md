# Step 2: fraud-judgment-experience

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`, `/docs/ADR.md`(ADR-009), `/docs/PRD.md`
- `src/types/experience.ts` (step1에서 추가된 `FraudJudgmentCard`)
- `src/data/fraud-judgment.ts`, `src/data/fraud-judgment.test.ts` (step1 산출물)
- `src/components/experiences/CaseSelectExperience.tsx` — 가장 가까운 참고 컴포넌트(카드 렌더 + `onComplete(ModuleResult)` 흐름). **읽기 전용 참고만 하고 수정하지 마라.**
- `src/components/experiences/ChatChoiceButtons.tsx` — 더블클릭 방지용 `locked` 상태 가드 패턴 참고.
- `src/lib/scoring.ts` (`computeGrade`)
- `src/lib/registry.ts`, `src/lib/registry.test.ts`
- `src/data/remediation.ts`
- `src/app/page.tsx` (36번째 줄 문구 수정 대상)

## 작업

### 1. `src/data/remediation.ts`에 신규 태그 카피 추가

`REMEDIATION_COPY`에 아래 항목을 추가한다(기존 4개 항목은 그대로 둔다):

```ts
"false-alarmed-safe-case":
  "정상적인 상황을 사기로 잘못 판단했습니다. 낯선 연락이나 다급한 문구만으로 바로 사기라고 단정하기보다, 실제로 개인정보·금전·앱 설치를 요구하는지, 공식 채널로 재확인이 가능한지부터 살펴보는 습관을 들이세요. 과도한 의심은 정작 필요한 순간에 필요한 조치를 놓치게 만들 수 있습니다.",
```

`src/data/remediation.test.ts`의 기존 `describe("getRemediation")` 블록에 아래 테스트 케이스를 추가한다(다른 3개 태그 테스트와 동일한 형식):

- `"false-alarmed-safe-case 태그에 대한 대응 방안을 반환한다"` — `getRemediation("false-alarmed-safe-case")`가 `DEFAULT_REMEDIATION_MESSAGE`가 아닌, 비어있지 않은 실제 카피를 반환하는지 확인.

### 2. `src/components/experiences/FraudJudgmentExperience.test.tsx` 작성 (TDD — 컴포넌트 구현보다 먼저)

`CaseSelectExperience.tsx`의 테스트 파일과 동일한 스타일로, 실제 `FRAUD_JUDGMENT_CARDS` 데이터를 import하지 않고 인라인 fixture(`FraudJudgmentCard` 타입에 맞는 fraud 카드 1개, safe 카드 1개)를 사용해 아래를 검증한다:

- 카드의 `title`과 `content`를 렌더링한다.
- "사기예요" / "정상이에요" 버튼을 렌더링한다.
- **체험 중에는 `source`와 `explanation`을 노출하지 않는다** — 렌더 직후, 그리고 버튼 클릭 직후 모두 `screen.queryByText(card.source)`와 `screen.queryByText(card.explanation)`이 `null`이어야 한다(정답 유출 방지 회귀 가드).
- `answer: "fraud"`인 카드에서 "사기예요"를 선택하면 `onComplete`가 `isCorrect: true`, `mistakeTag: undefined`로 호출된다.
- `answer: "fraud"`인 카드에서 "정상이에요"를 선택하면 `isCorrect: false`, `mistakeTag: "missed-scam-signal"`로 호출된다.
- `answer: "safe"`인 카드에서 "정상이에요"를 선택하면 `isCorrect: true`, `mistakeTag: undefined`로 호출된다.
- `answer: "safe"`인 카드에서 "사기예요"를 선택하면 `isCorrect: false`, `mistakeTag: "false-alarmed-safe-case"`로 호출된다.
- `onComplete`에 전달된 `explanation` 문자열이 `card.explanation`과 `card.source`를 **둘 다 포함**한다(유출 방지가 결과 페이지에는 실제로 도달하는지 확인).
- 같은 버튼(또는 두 버튼 중 아무거나)을 연속으로 두 번 클릭해도 `onComplete`는 정확히 1회만 호출된다.

### 3. `src/components/experiences/FraudJudgmentExperience.tsx` 구현

```ts
"use client";

interface FraudJudgmentExperienceProps {
  content: FraudJudgmentCard;
  onComplete: (result: ModuleResult) => void;
}

export function FraudJudgmentExperience({ content, onComplete }: FraudJudgmentExperienceProps) { ... }
```

설계 규칙(반드시 지킬 것):

- 렌더링 순서: `content.title` → `content.content` → 버튼 2개("사기예요" = `fraud` 선택, "정상이에요" = `safe` 선택). `CaseSelectExperience`처럼 카드 2장을 나란히 비교하는 UI가 아니라, 카드 1장만 보여준다.
- **`content.source`, `content.category`, `content.explanation`을 이 컴포넌트의 JSX 어디에서도 직접 렌더링하지 마라.** 대신 `onComplete` 호출 시에만 아래처럼 결과 문자열에 결합해서 실어보낸다:
  ```ts
  explanation: `${content.explanation} (출처: ${content.source})`
  ```
  (`/result` 페이지는 이미 모든 유형의 `result.explanation`을 그대로 렌더링하므로 `/result` 쪽 코드는 수정할 필요 없다.)
- `ChatChoiceButtons.tsx`와 동일한 `locked`(+`lockedRef`) 가드 패턴으로 더블클릭/중복 `onComplete` 호출을 막는다 — `CaseSelectExperience`처럼 "선택 후 별도 다음 버튼" 2단계가 아니라, 버튼 클릭 즉시 채점·제출한다(팀원 원작의 1클릭 판정 UX 그대로).
- 채점 로직:
  ```ts
  const isCorrect = userAnswer === content.answer;
  const score = isCorrect ? 100 : 0;
  const mistakeTag = isCorrect
    ? undefined
    : content.answer === "fraud"
      ? "missed-scam-signal"
      : "false-alarmed-safe-case";
  ```
  `ModuleResult.userChoice`/`correctChoice`는 사람이 읽을 수 있는 한국어 문자열로 채운다(예: `userAnswer === "fraud" ? "사기라고 판단" : "정상이라고 판단"`, `content.answer === "fraud" ? "실제로는 사기" : "실제로는 정상"`).
  `typeId: "fraud-judgment"`, `contentId: content.id`, `grade: computeGrade(score)`.
- 스타일은 기존 컴포넌트들과 일관되게(`min-h-11`, `rounded-lg`, `border-neutral-800`/`bg-[#141414]`, 정답 버튼 계열 `blue-500` 강조 등 기존 Tailwind 클래스 관례 재사용).
- `dangerouslySetInnerHTML`을 쓰지 마라 — 모든 텍스트는 JSX 자식으로만 렌더링한다.

### 4. `src/lib/registry.ts`에 등록

`EXPERIENCE_MODULES` 배열 끝에 추가:

```ts
{
  typeId: "fraud-judgment",
  contentPool: FRAUD_JUDGMENT_CARDS,
  pickRandomContent: () =>
    FRAUD_JUDGMENT_CARDS[Math.floor(Math.random() * FRAUD_JUDGMENT_CARDS.length)],
  Component: FraudJudgmentExperience,
},
```

필요한 import(`FRAUD_JUDGMENT_CARDS`, `FraudJudgmentExperience`)를 추가한다. `assertContentPools`/`pickSessionPlan` 함수 자체는 이미 배열에 대해 제네릭이므로 수정하지 않는다.

`src/lib/registry.test.ts`에:
- `fraud-judgment` 유형이 `EXPERIENCE_MODULES`에 등록되어 있고 `contentPool`이 비어있지 않은지 확인하는 테스트를 추가한다(기존 `voice-phishing`/`case-select`/`jeonse` 테스트와 동일 형식).
- `pickSessionPlan`을 테스트하는 `describe` 블록이 자체 mock 모듈 배열을 쓰고 있다면, mock 모듈 개수를 3개→4개로 맞춰 "등록된 유형 각각을 정확히 1회씩만 포함한다" 류의 테스트가 실제 4-모듈 상황을 계속 대표하도록 한다.

### 5. `src/app/page.tsx` 문구 수정

36번째 줄:
```diff
- <li>총 3단계로 진행됩니다.</li>
+ <li>여러 단계로 진행됩니다.</li>
```
이 파일의 다른 부분은 건드리지 않는다(Server Component, registry 비의존 유지).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `FraudJudgmentExperience.tsx`가 `content.source`/`content.category`/`content.explanation`을 직접 렌더링하지 않는가? (테스트로 이미 검증되지만 코드 리뷰로 한 번 더 확인)
   - `registry.ts`는 여전히 특정 유형을 오케스트레이션 페이지에 직접 노출하지 않고 배열 등록만 하는가?
   - `dangerouslySetInnerHTML`을 쓰지 않았는가?
   - `CLAUDE.md` CRITICAL 규칙(체험 유형 사전 비노출 등)을 위반하지 않았는가?
3. `npm run dev`로 실제 플레이해본다: 랜딩 → 세션에서 "다시 체험하기"를 몇 번 반복해 4번째 유형이 등장하는 세션을 만나면, 체험 중 화면에 출처/해설/카테고리가 전혀 보이지 않는지, `/result`에서 해당 카드가 해설+출처와 함께 뜨는지 육안 확인한다.
4. 결과에 따라 `phases/3-fraud-judgment-cards/index.json`의 `step: 2` 항목을 업데이트한다.

## 금지사항

- `VoicePhishingExperience.tsx`, `CaseSelectExperience.tsx`, `JeonseExperience.tsx`, `src/app/session/page.tsx`, `src/app/result/page.tsx`를 수정하지 마라. 이유: 이 유형들은 기존 계약(`ExperienceModule`/`ModuleResult`)만으로 신규 유형을 수용할 수 있고, `/result`는 이미 모든 `result.explanation`을 그대로 렌더링하므로 손댈 필요가 없다.
- `content.source`/`content.category`/`content.explanation`을 컴포넌트 JSX에서 직접 렌더링하지 마라 — 정답 유출이다.
- `dangerouslySetInnerHTML`을 쓰지 마라.
- 기존 테스트를 깨뜨리지 마라.
