# Step 2: scoring-logic

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`, `/docs/ADR.md`(ADR-010)
- `src/types/experience.ts` (step1에서 추가된 `CaseInvestigationContent`/`CaseFinalDecision`/`CaseEndingOption` 등)
- `src/data/case-investigation.ts`, `src/data/case-investigation.test.ts` (step1 산출물 — 실제 6개 케이스 데이터)
- `src/lib/scoring.ts`, `src/lib/scoring.test.ts` (기존 `computeGrade`/`aggregateResults`/`computeVoicePhishingScore` 패턴 — 유형 전용 순수 채점 함수를 이 파일에 두는 기존 관례)
- `src/data/remediation.ts`, `src/data/remediation.test.ts`

이 step은 순수 로직(스코어링 함수)과 remediation 문구만 다룬다. UI 컴포넌트나 `registry.ts` 등록은 이 step에서 하지 않는다(step3에서 함).

## 배경

red-flag 원작의 `backend/app/scoring.py`는 순수 rule-based 채점 함수다(LLM 미사용). 이 프로젝트는 백엔드가 없으므로 동일한 가중치 로직을 클라이언트 TS 순수 함수로 재구현한다:

```python
risk_discovery = round(40 * len(found_risk) / len(risk_patterns))
evidence_quality = round(20 * min(gained_importance / total_importance, 1.0))
contradiction = round(15 * min(gained_contradiction_score / total_contradiction_score, 1.0))
efficiency = round(10 * min(len(evidence_board) / investigate_count, 1.0))
final_decision = ending_options 중 사용자가 고른 decision의 score
total = 위 5개 합
```

이 프로젝트에서는 `total`을 0~100으로 clamp한다(원작은 clamp하지 않아 케이스에 따라 100을 넘을 수 있었다 — 예: `CHEONGYAK_004`의 `STOP_CONTRACT` 점수 18은 원작 설계 문서의 "최종판단 15점 만점" 가정을 이미 벗어나 있다. 이번 이식에서는 데이터를 고치지 않고 합산 후 clamp로 흡수한다).

## 작업

### 1. `src/lib/scoring.ts`에 추가 (기존 export는 수정하지 않는다)

```ts
import type {
  CaseEndingOption,
  CaseFinalDecision,
  CaseInvestigationContent,
} from "@/types/experience";

export interface CaseInvestigationState {
  registeredEvidence: ReadonlySet<string>; // 등록된 evidence pattern들
  completedInvestigationIds: ReadonlySet<string>;
  triggeredStatementIds: ReadonlySet<string>; // 클릭한 NPC 질문의 statementId들
  finalDecision: CaseFinalDecision;
}

export interface CaseInvestigationScoreBreakdown {
  riskDiscovery: number;      // 0~40
  evidenceQuality: number;    // 0~20
  contradiction: number;      // 0~15
  efficiency: number;         // 0~10
  finalDecisionScore: number; // 선택한 ending option의 원본 score
  total: number;              // 위 5개 합, 0~100으로 clamp
  foundRiskPatterns: string[];
  missedRiskPatterns: string[];
}

export function getBestEndingOption(
  content: CaseInvestigationContent
): CaseEndingOption;

export function computeCaseInvestigationScore(
  content: CaseInvestigationContent,
  state: CaseInvestigationState
): CaseInvestigationScoreBreakdown;
```

**로직 규칙**:
- `getBestEndingOption`: `content.endingOptions` 중 `score`가 가장 높은 항목 하나를 반환한다(step1 데이터 무결성 테스트가 동점 없음을 이미 보장하므로 동점 처리는 신경 쓰지 않아도 된다).
- `riskDiscovery = round(40 * |riskPatterns ∩ registeredEvidence| / |riskPatterns|)` (`riskPatterns.length === 0`이면 0).
- `evidenceQuality`: `evidenceDefinitions`에서 `registeredEvidence`에 해당하는 항목들의 `importance` 합을 `gained`, 전체 `importance` 합을 `total`이라 할 때 `round(20 * min(gained/total, 1))`.
- `contradiction`: `content.contradictions`를 순회해 `triggeredStatementIds.has(c.statementId) && registeredEvidence.has(c.evidencePattern)`인 항목들의 `score` 합을 `gained`, 전체 `contradictions[].score` 합을 `total`(0이면 분모 1로 취급)이라 할 때 `round(15 * min(gained/total, 1))`.
- `efficiency`: `completedInvestigationIds.size`가 0이면 0, 아니면 `round(10 * min(registeredEvidence.size / completedInvestigationIds.size, 1))`.
- `finalDecisionScore`: `content.endingOptions.find(o => o.decision === state.finalDecision)?.score ?? 0`.
- `total = Math.min(100, riskDiscovery + evidenceQuality + contradiction + efficiency + finalDecisionScore)`.
- `foundRiskPatterns` / `missedRiskPatterns`: `content.hiddenTruth.riskPatterns`를 `registeredEvidence` 포함 여부로 양분(정렬은 원본 순서 유지).

`isCorrect` 자체는 이 함수의 책임이 아니다 — step3의 컴포넌트가 `state.finalDecision === getBestEndingOption(content).decision`으로 별도 판정한다(점수 임계치가 아니라 "최고점 선택지와 일치하는가"로 정의, ADR-010).

### 2. `src/lib/scoring.test.ts`에 테스트 추가 (TDD — 위 구현보다 먼저 작성)

`src/data/case-investigation.ts`의 실제 케이스를 import하지 말고, 최소 2~3개 문서/2개 증거정의/2개 조사/1개 NPC statement+question/1개 모순/3개 ending option을 가진 인라인 fixture `CaseInvestigationContent`를 만들어 아래를 검증한다:

- 증거를 하나도 등록하지 않고 `NEED_MORE_VERIFICATION`을 선택하면 `riskDiscovery`/`evidenceQuality`/`contradiction`/`efficiency`가 모두 0이고, `total`은 `finalDecisionScore`(해당 ending option의 원본 점수)와 같다.
- 모든 `riskPatterns`를 `registeredEvidence`로 등록하면 `riskDiscovery === 40`이다.
- `triggeredStatementIds`와 `registeredEvidence`가 fixture의 모순 조건을 둘 다 만족하면 `contradiction`이 해당 모순의 `score`를 15점 만점 비율로 환산한 값과 같다. 둘 중 하나만 만족하면 `contradiction === 0`이다(질문만 클릭하거나 증거만 등록한 것만으로는 점수를 주지 않는다 — 회귀 테스트로 명시).
- 각 컴포넌트 점수가 각각의 상한(40/20/15/10)을 넘지 않는다(fixture를 일부러 과다하게 만들어도 clamp되는지 확인).
- `total`이 100을 넘지 않는다(fixture의 `finalDecisionScore`를 일부러 크게 잡아 5개 항목 합이 100을 넘도록 구성한 케이스 포함).
- `getBestEndingOption`이 `endingOptions` 중 `score`가 가장 큰 항목을 정확히 반환한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `computeCaseInvestigationScore`/`getBestEndingOption`이 순수 함수인가(인자 외 외부 상태 참조 없음, `Math.random()` 없음)?
   - 기존 `computeGrade`/`aggregateResults`/`computeVoicePhishingScore`와 시그니처 스타일이 일관되는가?
   - `total`이 항상 0~100 범위인가(원작처럼 100을 넘지 않는지)?
3. 결과에 따라 `phases/4-case-investigation/index.json`의 `step: 2` 항목을 업데이트한다.

## 금지사항

- `src/lib/registry.ts`, `src/components/experiences/` 아래 어떤 파일도 이 step에서 만들거나 수정하지 마라. 이유: 컴포넌트/등록은 step3에서 데이터·스코어링이 모두 준비된 뒤 한 번에 다룬다.
- `src/data/case-investigation.ts`(step1 산출물)의 데이터를 수정하지 마라.
- 기존 `computeGrade`/`aggregateResults`/`computeVoicePhishingScore`의 시그니처나 동작을 바꾸지 마라 — 다른 3개 유형이 이미 이 함수들에 의존한다.
- 기존 테스트를 깨뜨리지 마라.
