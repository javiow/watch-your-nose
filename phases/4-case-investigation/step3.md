# Step 3: case-investigation-experience

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`, `/docs/ADR.md`(ADR-010), `/docs/PRD.md`
- `src/types/experience.ts` (step1 산출물)
- `src/data/case-investigation.ts`, `src/data/case-investigation.test.ts` (step1 산출물, 실제 6개 케이스)
- `src/lib/scoring.ts`, `src/lib/scoring.test.ts` (step2에서 추가된 `computeCaseInvestigationScore`/`getBestEndingOption`/`CaseInvestigationState`)
- `src/components/experiences/CaseSelectExperience.tsx`, `CaseSelectExperience.test.tsx` — **대체 대상, 참고만 하고 이 step에서 삭제한다** (Tailwind 토큰 패턴, `ModuleResult` 조립 방식 참고)
- `src/components/experiences/FraudJudgmentExperience.tsx` — 단일 클릭 즉시 `onComplete` + `lockedRef` 중복 제출 방지 패턴 참고
- `src/lib/registry.ts`, `src/lib/registry.test.ts`
- `src/data/remediation.ts`, `src/data/remediation.test.ts`
- `src/app/globals.css` (Tailwind 디자인 토큰: `surface`, `surface-muted`, `border`, `muted`, `subtle`, `accent`, `accent-hover`, `accent-soft`, `safe`, `danger`, `foreground`)

## 작업

### 1. `src/data/remediation.ts`에 신규 태그 추가

`REMEDIATION_COPY`에 아래 항목을 추가한다(기존 5개 항목은 그대로 둔다):

```ts
"missed-realestate-investigation-signal":
  "부동산 계약을 판단할 때 놓친 위험 신호가 있었습니다. 전세가율(매매가 대비 전세금 비율)이 지나치게 높거나, 소유권이 최근 짧은 기간에 바뀌었거나, 공식 통지 절차(청약Home 등)와 다른 방식으로 연락이 왔거나, 계약 권한을 확인할 서류(신탁 동의서·보증보험 확인서 등)가 빠져 있다면 모두 대표적인 위험 신호입니다. 중개사·상담사의 '안전하다'는 말만 믿지 말고 등기부등본·실거래가·공식 채널을 직접 확인한 뒤 결정하세요.",
```

기존 `false-alarmed-safe-case`는 그대로 재사용한다(수정 불필요) — 위험이 경미한 케이스를 과도하게 의심해 오답 처리된 경우 매핑된다. 기존 `missed-lease-fraud-signal`은 건드리지 않는다(전세매물 유형 전용, 이번 신규 태그와 별개).

`src/data/remediation.test.ts`에 `"missed-realestate-investigation-signal 태그에 대한 대응 방안을 반환한다"` 테스트를 기존 5개와 동일한 형식으로 추가한다.

### 2. `src/components/experiences/CaseInvestigationExperience.test.tsx` 작성 (TDD — 컴포넌트 구현보다 먼저)

`src/data/case-investigation.ts`의 실제 데이터 중 `caseId: "JEONSE_001"`(가장 단순, investigations 2개)과 `caseId: "BUNYANG_005"`(최고점이 `SAFE_TO_PROCEED`)를 각각 fixture로 사용해 아래를 검증한다:

- 브리핑 단계: `content.title`(스포일러 문구)이 화면에 렌더되지 **않는다**(`screen.queryByText(content.title)`가 `null`). `content.scenario.propertyLocation`은 렌더된다.
- 브리핑 단계: `content.hiddenTruth.explanation`, `content.endingOptions[].comment`가 렌더되지 않는다.
- "조사 시작" 클릭 후 조사 화면으로 전환되고, 포인트가 부족하면(초기 포인트보다 비용이 큰 fixture로 테스트) 해당 조사 버튼이 `disabled`다.
- `hiddenUntilUnlocked: true`인 조사 항목(fixture로 구성)은 언락 전 화면에 아예 나타나지 않는다.
- 문서를 열람했을 때 `evidencePattern`이 `null`인 블록은 클릭 가능한 버튼으로 렌더되지 않는다(plain text).
- `evidencePattern`이 있는 블록을 클릭하면 증거로 등록되고, 같은 블록을 다시 클릭해도 중복 등록되지 않는다.
- NPC 질문 버튼을 클릭하면 해당 statement의 대사가 나타나고, 같은 질문 버튼은 재클릭 시 비활성 상태를 유지한다(재클릭해도 상태가 변하지 않음).
- 최종 판단 3버튼(진행/추가확인/중단) 중 하나를 클릭하면 `onComplete`가 정확히 1회 호출된다. 같은 버튼을 연속 클릭해도 1회만 호출된다.
- `JEONSE_001`에서 `getBestEndingOption`과 다른 결정을 선택하면 `result.isCorrect === false`이고 `result.mistakeTag === "missed-realestate-investigation-signal"`이다.
- `BUNYANG_005`에서 최고점(`SAFE_TO_PROCEED`)이 아닌 다른 결정을 선택하면 `result.mistakeTag === "false-alarmed-safe-case"`다.
- 최고점 결정을 선택하면 `result.isCorrect === true`이고 `result.mistakeTag === undefined`다.
- `onComplete`로 전달된 `result.explanation`에 `content.hiddenTruth.explanation`의 일부가 포함된다(체험 중에는 안 보이지만 결과로는 전달돼야 함).
- `result.typeId === "case-investigation"`, `result.contentId === content.caseId`다.

### 3. `src/components/experiences/CaseInvestigationExperience.tsx` 구현

```ts
"use client";

interface CaseInvestigationExperienceProps {
  content: CaseInvestigationContent;
  onComplete: (result: ModuleResult) => void;
}

export function CaseInvestigationExperience({ content, onComplete }: CaseInvestigationExperienceProps) { ... }
```

**상태 (컴포넌트 내부 `useState`만 사용, 영속화 없음 — ADR-003)**:

```ts
type Phase = "briefing" | "investigating" | "decision";

const [phase, setPhase] = useState<Phase>("briefing");
const [points, setPoints] = useState(content.initialPoints);
const [completedInvestigationIds, setCompletedInvestigationIds] = useState<Set<string>>(new Set());
const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
const [registeredEvidence, setRegisteredEvidence] = useState<Set<string>>(new Set());
const [triggeredStatementIds, setTriggeredStatementIds] = useState<Set<string>>(new Set());
const lockedRef = useRef(false); // FraudJudgmentExperience와 동일한 중복 제출 방지 패턴
```

**Phase 1 — 브리핑**: 헤딩은 `content.scenario.propertyLocation`(≠ `content.title`, 절대 렌더링 금지). `propertyPriceDescription`, `speakerLabel`이 말하는 `brokerLine` 인용 블록, `description`, `goal`, `initialPoints`를 "조사 예산" 배지로 표시. "조사 시작" 버튼 → `phase="investigating"`.

**Phase 2 — 조사**:
- 상단 배지: 남은 포인트, 등록된 증거 수.
- 조사 목록: `content.investigations.filter(inv => !inv.hiddenUntilUnlocked || isUnlocked(inv))`
  - `isUnlocked(inv)`: `unlockCondition === null` 이거나, `kind:"evidence"`면 `registeredEvidence.has(pattern)`, `kind:"investigation"`이면 `completedInvestigationIds.has(investigationId)`.
  - 버튼 `disabled` 조건: 이미 완료, 또는 `!isUnlocked(inv)`, 또는 `points < cost`.
  - 클릭 시: `points -= cost`, `completedInvestigationIds.add(id)`, `openDocumentId = documentId`.
- 문서 뷰(`openDocumentId` 있을 때): 해당 문서의 `blocks`를 렌더. `evidencePattern !== null`인 블록만 클릭 가능한 버튼으로 — 클릭 시 `registeredEvidence.add(pattern)` + 시각 표시(`border-accent bg-accent-soft`) + `evidenceDefinitions`에서 해당 `description`만 확인 텍스트로 보여준다(정답 여부는 노출하지 않는다). "목록으로" 버튼으로 `openDocumentId=null`.
- NPC 패널(조사 화면 내내 상시 노출): `npc.displayName` + `npc.questions` 버튼 목록. 클릭 시 `triggeredStatementIds.add(statementId)`, 클릭한 statement의 `text`를 대화 로그에 append. 이미 클릭한 질문 버튼은 `disabled`.
- 하단 "판단하기" 버튼: 항상 활성(부분 조사만 하고 넘어가는 것도 원작과 동일하게 허용) → `phase="decision"`.

**Phase 3 — 최종 판단**: 공통 3버튼(케이스마다 문구가 바뀌지 않는 고정 라벨 — `content.endingOptions[].comment`는 어디에도 렌더링하지 않는다):
- "계약을 진행한다" → `SAFE_TO_PROCEED`
- "추가로 확인한 뒤 결정한다" → `NEED_MORE_VERIFICATION`
- "계약을 중단한다" → `STOP_CONTRACT`

클릭 즉시(`lockedRef` 가드) 아래 로직으로 `ModuleResult`를 조립해 `onComplete` 호출:

```ts
const breakdown = computeCaseInvestigationScore(content, {
  registeredEvidence, completedInvestigationIds, triggeredStatementIds, finalDecision,
});
const bestOption = getBestEndingOption(content);
const isCorrect = finalDecision === bestOption.decision;
const mistakeTag = isCorrect
  ? undefined
  : bestOption.decision === "SAFE_TO_PROCEED"
    ? "false-alarmed-safe-case"
    : "missed-realestate-investigation-signal";
```

`explanation`은 컴포넌트 내부 헬퍼로 조립한다: `content.hiddenTruth.explanation`을 기본 골자로, `breakdown.missedRiskPatterns`가 있으면 해당 `evidenceDefinitions[].description`을 찾아 "놓친 위험 신호: ..." 문장을 덧붙이고, `bestOption.comment`(가장 안전한 판단에 대한 코멘트)를 마지막에 덧붙인다.

`ModuleResult` 필드: `typeId: "case-investigation"`, `contentId: content.caseId`, `score: breakdown.total`, `grade: computeGrade(breakdown.total)`, `userChoice`/`correctChoice`는 3개 라벨 중 사람이 읽을 수 있는 한국어 문자열로("계약 진행 가능"/"추가 확인 필요"/"계약 중단" 등, `content.endingOptions[].comment`는 쓰지 않는다).

**스타일**: 기존 `CaseSelectExperience.tsx`/`FraudJudgmentExperience.tsx`에서 이미 쓰인 토큰만 재사용한다 — 새 클래스 체계를 만들지 마라. 카드/문서/조사 항목: `rounded-xl border border-border bg-surface p-4 shadow-sm`. 선택/등록 상태: `border-accent bg-accent-soft`. 기본 액션 버튼: `min-h-11 rounded-xl bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-subtle`. 보조/아웃라인 버튼(NPC 질문, 최종판단 3버튼): `min-h-11 rounded-xl border border-border bg-surface px-6 text-sm font-medium text-muted transition-colors hover:border-accent disabled:cursor-not-allowed`. 배지 텍스트: `text-sm text-subtle` / `text-sm font-medium text-muted`.

`dangerouslySetInnerHTML`을 쓰지 마라 — 모든 텍스트는 JSX 자식으로만 렌더링한다.

### 4. `src/lib/registry.ts`에 등록, `case-select` 제거

`import { CASE_SELECT_PAIRS } from "@/data/case-select";` / `import { CaseSelectExperience } from "@/components/experiences/CaseSelectExperience";`를 아래로 교체:

```ts
import { CASE_INVESTIGATION_CASES } from "@/data/case-investigation";
import { CaseInvestigationExperience } from "@/components/experiences/CaseInvestigationExperience";
```

`EXPERIENCE_MODULES`의 `case-select` 항목을 아래로 교체:

```ts
{
  typeId: "case-investigation",
  contentPool: CASE_INVESTIGATION_CASES,
  pickRandomContent: () =>
    CASE_INVESTIGATION_CASES[Math.floor(Math.random() * CASE_INVESTIGATION_CASES.length)],
  Component: CaseInvestigationExperience,
},
```

`src/lib/registry.test.ts`의 `"case-select"` 리터럴(모듈 생성 헬퍼 호출부, `pickSessionPlan` 정렬 비교 배열)을 `"case-investigation"`으로 갱신한다.

### 5. 삭제

- `src/components/experiences/CaseSelectExperience.tsx`
- `src/components/experiences/CaseSelectExperience.test.tsx`
- `src/data/case-select.ts`
- `src/data/case-select.test.ts`

삭제 전 `case-select`/`CaseSelectExperience`/`CASE_SELECT_PAIRS`를 grep해 위 4개 파일 + `registry.ts`/`registry.test.ts`(step에서 이미 갱신) 외 다른 참조가 없는지 재확인한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `CaseInvestigationExperience.tsx`가 `content.title`/`content.hiddenTruth.explanation`/`content.endingOptions[].comment`를 직접 렌더링하지 않는가? (테스트로 검증되지만 코드 리뷰로 재확인)
   - `registry.ts`는 여전히 특정 유형을 오케스트레이션 페이지에 직접 노출하지 않고 배열 등록만 하는가?
   - `dangerouslySetInnerHTML`을 쓰지 않았는가?
   - `case-select` 관련 참조가 코드베이스에 하나도 남아있지 않은가? (grep 재확인)
3. `npm run dev`로 실제 플레이해본다: 랜딩 → 세션에서 "다시 체험하기"를 반복해 이 유형이 나오는 세션을 여러 번 만나며 (a) 브리핑/조사/최종판단 3단계가 자연스럽게 전환되는지, (b) 포인트 부족·언락 조건 UI가 올바르게 동작하는지, (c) NPC 질문 클릭 후 재클릭이 막히는지, (d) 체험 중 화면 어디에도 정답 단서(제목·해설·코멘트)가 보이지 않는지, (e) `/result`에서 해당 케이스의 해설·대응 방안이 올바르게 뜨는지 육안 확인한다(6개 케이스가 골고루 나오도록 여러 번 재시도).
4. 결과에 따라 `phases/4-case-investigation/index.json`의 `step: 3` 항목을 업데이트한다.

## 금지사항

- `VoicePhishingExperience.tsx`, `JeonseExperience.tsx`, `FraudJudgmentExperience.tsx`, `src/app/session/page.tsx`, `src/app/result/page.tsx`를 수정하지 마라. 이유: 이 유형들은 기존 계약(`ExperienceModule`/`ModuleResult`)만으로 신규 유형을 수용할 수 있고, `/result`는 이미 모든 `result.explanation`을 그대로 렌더링하므로 손댈 필요가 없다.
- `content.title`/`content.hiddenTruth.explanation`/`content.endingOptions[].comment`를 컴포넌트 JSX에서 직접 렌더링하지 마라 — 정답 유출이다.
- `src/lib/scoring.ts`(step2 산출물)의 `computeCaseInvestigationScore`/`getBestEndingOption` 시그니처나 동작을 바꾸지 마라.
- `dangerouslySetInnerHTML`을 쓰지 마라.
- 기존 테스트를 깨뜨리지 마라.
