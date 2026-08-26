# Step 1: data-model

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md` (특히 방금 step0에서 추가된 ADR-010)
- `src/types/experience.ts` (특히 `FraudJudgmentCategory`/`FraudJudgmentCard`의 "렌더링 금지" 주석 패턴, `JeonseHouse`의 8필드 구조화 콘텐츠 패턴)
- `src/data/case-select.ts`, `src/data/case-select.test.ts` (이번 step에서 대체될 기존 3번째 유형 — 아직 삭제하지 않는다, step3에서 삭제)
- `src/data/fraud-judgment.ts`, `src/data/fraud-judgment.test.ts` (외부 팀원 레포를 정적 리터럴로 이식한 최근 선례 — 데이터 무결성 테스트 스타일 참고)

이 step은 타입과 콘텐츠 데이터만 다룬다. `src/lib/scoring.ts`/`src/lib/registry.ts`/`src/data/remediation.ts`/UI 컴포넌트는 이 step에서 건드리지 않는다(scoring.ts는 step2, registry/컴포넌트/remediation은 step3).

## 외부 참고 소스

팀원 레포 [`dakyommii/red-flag`](https://github.com/dakyommii/red-flag)의 케이스 데이터 6개를 WebFetch로 가져온다:

- `https://raw.githubusercontent.com/dakyommii/red-flag/main/data/cases/jeonse_001_high_ratio.json`
- `https://raw.githubusercontent.com/dakyommii/red-flag/main/data/cases/jeonse_002_ownership_change.json`
- `https://raw.githubusercontent.com/dakyommii/red-flag/main/data/cases/jeonse_003_trust.json`
- `https://raw.githubusercontent.com/dakyommii/red-flag/main/data/cases/cheongyak_004_impersonation.json`
- `https://raw.githubusercontent.com/dakyommii/red-flag/main/data/cases/bunyang_005_yield_guarantee.json`
- `https://raw.githubusercontent.com/dakyommii/red-flag/main/data/cases/final_001_family.json`

각 파일은 아래 원본 필드를 가진다: `case_id, title, domain, difficulty, time_limit_seconds, initial_points, scenario{description, property{location, price_description}, broker_line, speaker_label, goal}, documents[{document_id, title, blocks[{block_id, text, evidence_pattern}]}], hidden_truth{fraud_type, risk_patterns[], required_evidence[], explanation}, evidence_definitions[{pattern, importance, description}], investigations[{investigation_id, name, cost, time_cost, unlock_condition, document_id, hidden_until_unlocked?}], npc_personas[{npc_id, display_name, statements[{statement_id, text, reveal_keywords[]}], suggested_questions[]}], contradictions[{contradiction_id, left, right, score, explanation}], safe_actions[], ending_options[{decision, score, comment}], source{official_sources[]}`.

6개 파일 전부 `npc_personas` 길이가 1이다(이 전제가 깨지면 데이터 무결성 테스트가 실패하도록 아래 3번에서 강제한다).

## 작업

### 1. `src/types/experience.ts`에 타입 추가 (기존 타입은 삭제하지 않는다)

```ts
export type ExperienceTypeId =
  | "voice-phishing"
  | "case-investigation" // "case-select"를 대체
  | "jeonse"
  | "fraud-judgment";

export type CaseDomain = "JEONSE" | "CHEONGYAK" | "BUNYANG";

// 렌더링 금지 — 내부 채점/식별용. FraudJudgmentCategory와 동일 패턴.
export type CaseFraudType =
  | "HIGH_JEONSE_RATIO_RISK"
  | "GAP_INVESTMENT_RISK"
  | "TRUST_PROPERTY"
  | "PRESALE_IMPERSONATION"
  | "NONE_LIMITED_RISK"
  | "COMPOUND_JEONSE_RISK";
// 원본 6개 케이스의 hidden_truth.fraud_type 값과 정확히 대조해 위 유니온을 확정하라
// (WebFetch 결과 값이 위 목록과 다르면 실제 값으로 고쳐라 — 추측하지 말 것).

export interface CaseDocumentBlock {
  blockId: string;
  text: string;
  evidencePattern: string | null; // null이면 증거 등록 불가한 일반 정보 텍스트
}

export interface CaseDocument {
  documentId: string;
  title: string;
  blocks: CaseDocumentBlock[];
}

export interface CaseEvidenceDefinition {
  pattern: string;
  importance: 1 | 2;
  description: string;
}

export type CaseInvestigationUnlock =
  | { kind: "evidence"; pattern: string }
  | { kind: "investigation"; investigationId: string };

export interface CaseInvestigation {
  investigationId: string;
  name: string;
  cost: number;
  documentId: string;
  unlockCondition: CaseInvestigationUnlock | null;
  hiddenUntilUnlocked?: boolean; // true면 unlock 전 조사 목록 자체에서 숨김. 원본에 없으면 생략(비활성 표시만).
}

export interface CaseNpcStatement {
  statementId: string;
  text: string;
}

export interface CaseNpcQuestion {
  questionId: string; // `${statementId}-q` 형식
  prompt: string; // 버튼 라벨 — 원본 suggested_questions 중 아래 매핑표로 선별한 것만
  statementId: string; // 클릭 시 노출되는 고정 대사
}

export interface CaseNpcPersona {
  npcId: string;
  displayName: string; // "공인중개사 박중개", "동생" 등 원본 그대로. "중개사" 하드코딩 금지 — 케이스마다 다르다.
  statements: CaseNpcStatement[];
  questions: CaseNpcQuestion[];
}

export interface CaseContradiction {
  contradictionId: string;
  statementId: string; // 원본 contradictions[].left
  evidencePattern: string; // 원본 contradictions[].right
  score: number;
  explanation: string; // /result 전용
}

export type CaseFinalDecision =
  | "SAFE_TO_PROCEED"
  | "NEED_MORE_VERIFICATION"
  | "STOP_CONTRACT";

export interface CaseEndingOption {
  decision: CaseFinalDecision;
  score: number;
  comment: string; // /result 전용 — 정답을 암시하므로 체험 중 노출 금지
}

export interface CaseHiddenTruth {
  fraudType: CaseFraudType; // 렌더링 금지
  riskPatterns: string[];
  requiredEvidence: string[];
  explanation: string; // /result 전용
}

export interface CaseInvestigationContent {
  caseId: string;
  title: string; // 렌더링 금지 — 내부 식별용, 스포일러성 문구 포함 (step3에서 강제)
  domain: CaseDomain;
  initialPoints: number;
  scenario: {
    description: string;
    propertyLocation: string;
    propertyPriceDescription: string;
    brokerLine: string;
    speakerLabel: string; // "중개사" | "분양상담사" | "발신 문자" | "동생" 등 — 하드코딩 금지
    goal: string;
  };
  documents: CaseDocument[];
  hiddenTruth: CaseHiddenTruth;
  evidenceDefinitions: CaseEvidenceDefinition[];
  investigations: CaseInvestigation[];
  npc: CaseNpcPersona; // 6개 케이스 전부 npc_personas 길이 1 → 배열이 아닌 단일 필드
  contradictions: CaseContradiction[];
  endingOptions: CaseEndingOption[]; // 정확히 3개, decision 3종 각 1개
}
```

원본의 LLM/시간 전용 필드(`system_prompt`, `hidden_information`, `reveal_keywords`, `knowledge`, `strategies`, `pressure_level`, `role`, `time_cost`, `time_limit_seconds`, `difficulty`, `safe_actions`, `source.case_ids`)는 **포팅하지 않는다** — LLM 미사용·타이머 미구현 원칙(ADR-010)과 맞지 않거나 이번 이식에서 쓰이지 않는다.

`ExperienceModule`/`ModuleResult`/`ExperienceComponentProps`는 수정하지 않는다 — 기존 제네릭 계약으로 이 유형도 충분히 표현된다.

### 2. 새 파일 `src/data/case-investigation.ts`

```ts
import type { CaseInvestigationContent } from "@/types/experience";

export const CASE_INVESTIGATION_CASES: CaseInvestigationContent[] = [
  // 6개 케이스 전부를 아래 규칙에 맞춰 리터럴로 작성
];
```

**변환 규칙**:
- snake_case → camelCase로만 필드명을 바꾸고, 텍스트(제목·본문·해설·코멘트)는 원문 그대로 옮긴다. 임의로 각색·요약·의역하지 마라.
- `documents[].blocks[].evidence_pattern`이 `null`이면 그대로 `null`로 옮긴다(빈 문자열 금지).
- `investigations[].unlock_condition`을 `CaseInvestigationUnlock`으로 변환: `{"requires_investigation": "X"}` → `{kind: "investigation", investigationId: "X"}`, `{"requires_evidence": "X"}` → `{kind: "evidence", pattern: "X"}`, `null` → `null`. `hidden_until_unlocked` 필드가 원본에 있으면 그대로 옮기고 없으면 아예 생략한다(`false`를 명시하지 않는다).
- `npc_personas[0]`을 `npc: CaseNpcPersona` 단일 필드로 옮긴다(배열 아님). `npc_personas.length !== 1`인 케이스가 있으면 임의로 첫 항목만 쓰지 말고 이 step을 `blocked` 처리하고 `blocked_reason`에 사유를 남겨라.
- `ending_options`를 옮길 때 순서를 임의로 바꾸지 마라(원본 순서 그대로).

**NPC 질문↔대사 매핑(반드시 아래 표 그대로 적용 — 임의로 다른 질문을 선택하거나 대사를 창작하지 마라)**:

원본은 `suggested_questions`(항상 3개)와 `statements`(1~2개)가 자유대화 키워드 매칭으로만 느슨하게 연결되어 있다. 버튼 고정형으로 옮기면서 각 statement마다 `reveal_keywords`와 가장 잘 겹치는 질문 1개만 채택하고 나머지 질문은 버린다. `npc.questions.length`는 항상 `npc.statements.length`와 같아야 한다.

| caseId | statementId | 채택할 질문(`prompt`) |
|---|---|---|
| JEONSE_001 | S01 | "주변 시세는 어느 정도인가요?" |
| JEONSE_002 | S01 | "집주인은 어떤 분인가요?" |
| JEONSE_002 | S02 | "전세금이 시세에 맞나요?" |
| JEONSE_003 | S01 | "집주인이 직접 계약하는 건가요?" |
| JEONSE_003 | S02 | "보증보험 가입할 수 있나요?" |
| CHEONGYAK_004 | S01 | "정말 제가 당첨된 게 맞나요?" |
| BUNYANG_005 | S01 | "수익보장은 언제까지 되나요?" |
| BUNYANG_005 | S02 | "인허가랑 분양보증은 문제없나요?" |
| FINAL_001 | S01 | "중개사가 뭐라고 했어?" |

표에 없는 `suggested_questions`는 전부 드롭한다. WebFetch 결과의 실제 질문 문구가 위 표와 다르게 보이면(예: 공백·문장부호 차이) 원본 문구를 그대로 채택하되, 어떤 statement와 짝지을지는 위 표의 caseId+statementId 매핑을 따른다.

**케이스별 유의사항**:
- **FINAL_001**: `speaker_label`이 원본 JSON에 없다 — `npc_personas[0].display_name`("동생")을 `scenario.speakerLabel`과 `npc.displayName` 양쪽에 동일하게 사용하라. `time_limit_seconds: 1200`(20분) 관련 문구는 `scenario.description`/`goal`의 서사 텍스트로만 유지하고 별도 필드로 옮기지 않는다.
- **BUNYANG_005**: `hidden_truth.fraud_type`이 위험이 경미한 케이스다(정답에 해당하는 `ending_options` 최고점이 `SAFE_TO_PROCEED`) — 타입/데이터 변환 자체는 다른 케이스와 동일하게 다루면 된다(분기 로직은 step2/3에서 처리).
- **CHEONGYAK_004**: `investigations` 중 2개가 `hidden_until_unlocked: true` — 반드시 그대로 옮긴다.
- **JEONSE_002**: `unlock_condition`이 `{"requires_evidence": ...}` 형태인 유일한 케이스 — `{kind: "evidence", ...}`로 변환.

### 3. 새 파일 `src/data/case-investigation.test.ts` (TDD — `case-investigation.ts` 작성 전에 먼저 작성)

`CASE_INVESTIGATION_CASES`의 6개 케이스 전부에 대해 `for (const c of CASE_INVESTIGATION_CASES)` 루프로 아래를 검증하는 테스트를 작성한다:

- 배열 길이가 정확히 6이고 `caseId`가 전부 고유하다.
- `hiddenTruth.riskPatterns`의 모든 pattern이 `evidenceDefinitions.map(e => e.pattern)`에 존재한다.
- 모든 `documents[].blocks[].evidencePattern`(null 제외)이 `evidenceDefinitions`에 존재한다.
- `endingOptions.length === 3`이고 `decision`이 `SAFE_TO_PROCEED`/`NEED_MORE_VERIFICATION`/`STOP_CONTRACT` 각 정확히 1개씩이다.
- 각 케이스의 `endingOptions` 중 최고점이 유일하다(동점 없음).
- `investigations[].unlockCondition`이 `{kind:"evidence"}`이면 그 `pattern`이 `evidenceDefinitions`에 존재하고, `{kind:"investigation"}`이면 그 `investigationId`가 같은 케이스의 다른 `investigations[].investigationId`에 존재한다.
- `investigations[].documentId`가 `documents[].documentId`에 존재한다.
- `contradictions[].statementId`가 `npc.statements[].statementId`에 존재하고, `contradictions[].evidencePattern`이 `evidenceDefinitions`에 존재한다.
- `npc.questions.length === npc.statements.length`이고, 모든 `statementId`가 정확히 하나의 질문과 매핑된다(양방향 전수 매핑 — 위 매핑표와 대조).
- (스모크 테스트) `caseId: "JEONSE_001"` 케이스가 존재하고 `investigations.length === 2`, `evidenceDefinitions.length === 2`이다(원작에서 가장 단순한 케이스).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 콘텐츠(케이스 조사 6종)가 `src/data/`의 정적 TS 파일에만 있는가? (`CLAUDE.md` CRITICAL 규칙)
   - 모듈 로드 시점에 `Math.random()` 등 비결정적 계산을 쓰지 않았는가? (무작위 선택은 step3의 `registry.ts`가 담당)
   - 기존 `voice-phishing.ts`/`case-select.ts`/`jeonse.ts`/`fraud-judgment.ts`와 그 테스트를 건드리지 않았는가?
   - NPC 질문 매핑이 위 표와 정확히 일치하는가?
3. 결과에 따라 `phases/4-case-investigation/index.json`의 `step: 1` 항목을 업데이트한다.

## 금지사항

- `src/lib/scoring.ts`, `src/lib/registry.ts`, `src/data/remediation.ts`, `src/data/case-select.ts`, 어떤 UI 컴포넌트도 이 step에서 건드리거나 삭제하지 마라. 이유: 아직 등록되지 않은 타입/데이터만 추가하는 단계이며, scoring 로직은 step2, registry 등록·기존 유형 삭제·컴포넌트는 step3에서 한 번에 다룬다.
- 팀원 원본 콘텐츠(제목·본문·해설·코멘트)의 문구를 임의로 각색·요약·의역하지 마라 — 필드명 리매핑 외에는 원문 그대로 옮긴다.
- NPC 질문 매핑표에 없는 질문을 임의로 채택하거나, 표에 없는 대사를 창작하지 마라.
- `scripts/` 아래에 이 변환을 위한 새 스크립트 파일을 만들지 마라.
- 기존 테스트를 깨뜨리지 마라.
