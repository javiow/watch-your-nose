import { describe, expect, it } from "vitest";
import type {
  CaseInvestigationContent,
  ChoiceRisk,
  ModuleResult,
} from "@/types/experience";
import {
  GRADE_LABELS,
  aggregateResults,
  computeCaseInvestigationScore,
  computeGrade,
  computeVoicePhishingScore,
  getBestEndingOption,
} from "./scoring";
import type { CaseInvestigationState } from "./scoring";

describe("GRADE_LABELS", () => {
  it("각 등급에 대한 한글 라벨을 제공한다", () => {
    expect(GRADE_LABELS.safe).toBe("안전");
    expect(GRADE_LABELS.caution).toBe("주의");
    expect(GRADE_LABELS.danger).toBe("위험");
  });
});

describe("computeGrade", () => {
  it("80% 이상이면 safe", () => {
    expect(computeGrade(80)).toBe("safe");
    expect(computeGrade(100)).toBe("safe");
  });

  it("50~79%면 caution", () => {
    expect(computeGrade(50)).toBe("caution");
    expect(computeGrade(79)).toBe("caution");
  });

  it("50% 미만이면 danger", () => {
    expect(computeGrade(49)).toBe("danger");
    expect(computeGrade(0)).toBe("danger");
  });
});

describe("aggregateResults", () => {
  const makeResult = (overrides: Partial<ModuleResult>): ModuleResult => ({
    typeId: "voice-phishing",
    contentId: "c1",
    score: 100,
    grade: "safe",
    userChoice: "a",
    correctChoice: "a",
    isCorrect: true,
    explanation: "",
    ...overrides,
  });

  it("점수 평균과 종합 등급을 계산한다", () => {
    const results = [
      makeResult({ score: 100 }),
      makeResult({ score: 60 }),
      makeResult({ score: 20 }),
    ];
    const { average, grade } = aggregateResults(results);
    expect(average).toBeCloseTo(60);
    expect(grade).toBe("caution");
  });

  it("결과가 없으면 평균 0, danger 등급을 반환한다", () => {
    const { average, grade } = aggregateResults([]);
    expect(average).toBe(0);
    expect(grade).toBe("danger");
  });
});

describe("computeVoicePhishingScore", () => {
  it("safe로만 끝까지 진행하면 100점, 정답으로 채점된다", () => {
    const path: ChoiceRisk[] = ["safe"];
    const { score, isCorrect } = computeVoicePhishingScore(path);
    expect(score).toBe(100);
    expect(isCorrect).toBe(true);
  });

  it("caution 한 번 후 safe로 끝나면 80점, 정답으로 채점된다", () => {
    const path: ChoiceRisk[] = ["caution", "safe"];
    const { score, isCorrect } = computeVoicePhishingScore(path);
    expect(score).toBe(80);
    expect(isCorrect).toBe(true);
  });

  it("caution 두 번 후 safe로 끝나면 60점(주의 등급 경계), 정답으로 채점된다", () => {
    const path: ChoiceRisk[] = ["caution", "caution", "safe"];
    const { score, isCorrect } = computeVoicePhishingScore(path);
    expect(score).toBe(60);
    expect(isCorrect).toBe(true);
  });

  it("danger로 끝나면 앞서 뭘 골랐든 0점, 오답으로 채점된다", () => {
    const path: ChoiceRisk[] = ["safe", "caution", "danger"];
    const { score, isCorrect } = computeVoicePhishingScore(path);
    expect(score).toBe(0);
    expect(isCorrect).toBe(false);
  });

  it("바로 danger로 끝나도 0점, 오답으로 채점된다", () => {
    const path: ChoiceRisk[] = ["danger"];
    const { score, isCorrect } = computeVoicePhishingScore(path);
    expect(score).toBe(0);
    expect(isCorrect).toBe(false);
  });
});

describe("computeCaseInvestigationScore", () => {
  const fixture: CaseInvestigationContent = {
    caseId: "FIXTURE_001",
    title: "테스트용 케이스",
    domain: "JEONSE",
    initialPoints: 500,
    scenario: {
      description: "테스트 시나리오 설명",
      propertyLocation: "테스트 지역",
      propertyPriceDescription: "전세금 1억 원",
      brokerLine: "테스트 중개사 대사",
      speakerLabel: "중개사",
      goal: "테스트 목표",
    },
    documents: [
      {
        documentId: "DOC_A",
        title: "문서 A",
        blocks: [
          { blockId: "BLK_A1", text: "본문 A1", evidencePattern: "RISK_A" },
        ],
      },
      {
        documentId: "DOC_B",
        title: "문서 B",
        blocks: [
          { blockId: "BLK_B1", text: "본문 B1", evidencePattern: "RISK_B" },
        ],
      },
    ],
    hiddenTruth: {
      fraudType: "NONE_LIMITED_RISK",
      riskPatterns: ["RISK_A", "RISK_B"],
      requiredEvidence: ["RISK_A"],
      explanation: "테스트용 진실 설명",
    },
    evidenceDefinitions: [
      { pattern: "RISK_A", importance: 2, description: "위험 신호 A" },
      { pattern: "RISK_B", importance: 1, description: "위험 신호 B" },
    ],
    investigations: [
      {
        investigationId: "INV_1",
        name: "조사 1",
        cost: 100,
        documentId: "DOC_A",
        unlockCondition: null,
      },
      {
        investigationId: "INV_2",
        name: "조사 2",
        cost: 100,
        documentId: "DOC_B",
        unlockCondition: null,
      },
    ],
    npc: {
      npcId: "NPC_1",
      displayName: "중개사 테스트",
      statements: [{ statementId: "STMT_1", text: "테스트 대사" }],
      questions: [
        {
          questionId: "STMT_1-q",
          prompt: "테스트 질문",
          statementId: "STMT_1",
        },
      ],
    },
    contradictions: [
      {
        contradictionId: "CONTRA_1",
        statementId: "STMT_1",
        evidencePattern: "RISK_A",
        score: 15,
        explanation: "테스트 모순 설명",
      },
    ],
    endingOptions: [
      { decision: "SAFE_TO_PROCEED", score: 5, comment: "진행해도 됨" },
      { decision: "NEED_MORE_VERIFICATION", score: 10, comment: "확인 필요" },
      { decision: "STOP_CONTRACT", score: 30, comment: "계약 중단" },
    ],
  };

  const emptyState: CaseInvestigationState = {
    registeredEvidence: new Set(),
    completedInvestigationIds: new Set(),
    triggeredStatementIds: new Set(),
    finalDecision: "NEED_MORE_VERIFICATION",
  };

  it("증거를 하나도 등록하지 않고 NEED_MORE_VERIFICATION을 선택하면 나머지 항목이 모두 0이고 total은 finalDecisionScore와 같다", () => {
    const breakdown = computeCaseInvestigationScore(fixture, emptyState);
    expect(breakdown.riskDiscovery).toBe(0);
    expect(breakdown.evidenceQuality).toBe(0);
    expect(breakdown.contradiction).toBe(0);
    expect(breakdown.efficiency).toBe(0);
    expect(breakdown.finalDecisionScore).toBe(10);
    expect(breakdown.total).toBe(10);
  });

  it("모든 riskPatterns를 registeredEvidence로 등록하면 riskDiscovery === 40", () => {
    const state: CaseInvestigationState = {
      ...emptyState,
      registeredEvidence: new Set(["RISK_A", "RISK_B"]),
    };
    const breakdown = computeCaseInvestigationScore(fixture, state);
    expect(breakdown.riskDiscovery).toBe(40);
  });

  it("모순 조건(질문 클릭 + 증거 등록)을 둘 다 만족해야 contradiction 점수를 얻는다", () => {
    const bothState: CaseInvestigationState = {
      ...emptyState,
      registeredEvidence: new Set(["RISK_A"]),
      triggeredStatementIds: new Set(["STMT_1"]),
    };
    expect(computeCaseInvestigationScore(fixture, bothState).contradiction).toBe(15);

    const onlyQuestionState: CaseInvestigationState = {
      ...emptyState,
      triggeredStatementIds: new Set(["STMT_1"]),
    };
    expect(
      computeCaseInvestigationScore(fixture, onlyQuestionState).contradiction
    ).toBe(0);

    const onlyEvidenceState: CaseInvestigationState = {
      ...emptyState,
      registeredEvidence: new Set(["RISK_A"]),
    };
    expect(
      computeCaseInvestigationScore(fixture, onlyEvidenceState).contradiction
    ).toBe(0);
  });

  it("각 컴포넌트 점수가 각각의 상한(40/20/15/10)을 넘지 않는다", () => {
    const overState: CaseInvestigationState = {
      registeredEvidence: new Set(["RISK_A", "RISK_B", "EXTRA1", "EXTRA2", "EXTRA3"]),
      completedInvestigationIds: new Set(["INV_1"]),
      triggeredStatementIds: new Set(["STMT_1"]),
      finalDecision: "STOP_CONTRACT",
    };
    const breakdown = computeCaseInvestigationScore(fixture, overState);
    expect(breakdown.riskDiscovery).toBeLessThanOrEqual(40);
    expect(breakdown.evidenceQuality).toBeLessThanOrEqual(20);
    expect(breakdown.contradiction).toBeLessThanOrEqual(15);
    expect(breakdown.efficiency).toBeLessThanOrEqual(10);
    expect(breakdown.efficiency).toBe(10);
  });

  it("total이 100을 넘지 않는다 (5개 항목 합이 100을 넘도록 구성해도 clamp된다)", () => {
    const maxState: CaseInvestigationState = {
      registeredEvidence: new Set(["RISK_A", "RISK_B"]),
      completedInvestigationIds: new Set(["INV_1"]),
      triggeredStatementIds: new Set(["STMT_1"]),
      finalDecision: "STOP_CONTRACT",
    };
    const breakdown = computeCaseInvestigationScore(fixture, maxState);
    // 40 + 20 + 15 + 10 + 30 = 115 (clamp 없으면 115)
    expect(breakdown.total).toBeLessThanOrEqual(100);
    expect(breakdown.total).toBe(100);
  });

  it("getBestEndingOption이 score가 가장 큰 ending option을 반환한다", () => {
    const best = getBestEndingOption(fixture);
    expect(best.decision).toBe("STOP_CONTRACT");
    expect(best.score).toBe(30);
  });
});
