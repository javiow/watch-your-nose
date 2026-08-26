import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CaseInvestigationContent, ModuleResult } from "@/types/experience";
import { CASE_INVESTIGATION_CASES } from "@/data/case-investigation";
import { CaseInvestigationExperience } from "./CaseInvestigationExperience";

const jeonse001 = CASE_INVESTIGATION_CASES.find((c) => c.caseId === "JEONSE_001")!;
const bunyang005 = CASE_INVESTIGATION_CASES.find((c) => c.caseId === "BUNYANG_005")!;

const gatingFixture: CaseInvestigationContent = {
  caseId: "TEST_GATING",
  title: "테스트 스포일러 제목",
  domain: "JEONSE",
  initialPoints: 100,
  scenario: {
    description: "테스트 설명",
    propertyLocation: "테스트 매물 위치",
    propertyPriceDescription: "테스트 가격",
    brokerLine: "테스트 중개사 대사",
    speakerLabel: "테스트 화자",
    goal: "테스트 목표",
  },
  documents: [
    {
      documentId: "DOC_A",
      title: "문서 A",
      blocks: [
        { blockId: "A1", text: "일반 정보 텍스트입니다", evidencePattern: null },
        { blockId: "A2", text: "증거 블록 텍스트입니다", evidencePattern: "PATTERN_A" },
      ],
    },
    {
      documentId: "DOC_B",
      title: "문서 B",
      blocks: [{ blockId: "B1", text: "잠금 해제 문서 텍스트입니다", evidencePattern: null }],
    },
  ],
  hiddenTruth: {
    fraudType: "NONE_LIMITED_RISK",
    riskPatterns: ["PATTERN_A"],
    requiredEvidence: ["PATTERN_A"],
    explanation: "테스트 해설 문구입니다.",
  },
  evidenceDefinitions: [{ pattern: "PATTERN_A", importance: 2, description: "패턴 A 확인 문구" }],
  investigations: [
    {
      investigationId: "INV_CHEAP",
      name: "저렴한 조사",
      cost: 50,
      unlockCondition: null,
      documentId: "DOC_A",
    },
    {
      investigationId: "INV_EXPENSIVE",
      name: "비싼 조사",
      cost: 9999,
      unlockCondition: null,
      documentId: "DOC_A",
    },
    {
      investigationId: "INV_HIDDEN",
      name: "숨겨진 조사",
      cost: 10,
      unlockCondition: { kind: "evidence", pattern: "PATTERN_A" },
      documentId: "DOC_B",
      hiddenUntilUnlocked: true,
    },
  ],
  npc: {
    npcId: "NPC_TEST",
    displayName: "테스트 NPC",
    statements: [{ statementId: "ST1", text: "NPC 대사 1입니다" }],
    questions: [{ questionId: "ST1-q", prompt: "질문 1", statementId: "ST1" }],
  },
  contradictions: [],
  endingOptions: [
    { decision: "SAFE_TO_PROCEED", score: 10, comment: "코멘트 안전" },
    { decision: "NEED_MORE_VERIFICATION", score: 20, comment: "코멘트 추가확인" },
    { decision: "STOP_CONTRACT", score: 5, comment: "코멘트 중단" },
  ],
};

function startInvestigating() {
  fireEvent.click(screen.getByText("조사 시작"));
}

function goToDecision() {
  fireEvent.click(screen.getByText("판단하기"));
}

describe("CaseInvestigationExperience", () => {
  it("브리핑 단계에서 title은 렌더링하지 않고 propertyLocation은 렌더링한다", () => {
    render(<CaseInvestigationExperience content={jeonse001} onComplete={vi.fn()} />);
    expect(screen.queryByText(jeonse001.title)).toBeNull();
    expect(screen.getByText(jeonse001.scenario.propertyLocation)).toBeDefined();
  });

  it("브리핑 단계에서 hiddenTruth.explanation과 endingOptions[].comment를 렌더링하지 않는다", () => {
    render(<CaseInvestigationExperience content={jeonse001} onComplete={vi.fn()} />);
    expect(screen.queryByText(jeonse001.hiddenTruth.explanation)).toBeNull();
    for (const option of jeonse001.endingOptions) {
      expect(screen.queryByText(option.comment)).toBeNull();
    }
  });

  it("조사 시작 클릭 후 조사 화면으로 전환되고 포인트가 부족한 조사는 비활성화된다", () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    const expensiveButton = screen.getByRole("button", { name: /비싼 조사/ });
    expect(expensiveButton).toBeDisabled();

    const cheapButton = screen.getByRole("button", { name: /저렴한 조사/ });
    expect(cheapButton).not.toBeDisabled();
  });

  it("hiddenUntilUnlocked 조사 항목은 언락 전 화면에 나타나지 않는다", () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    expect(screen.queryByText(/숨겨진 조사/)).toBeNull();
  });

  it("문서 열람 시 evidencePattern이 null인 블록은 버튼으로 렌더링되지 않는다", () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();
    fireEvent.click(screen.getByRole("button", { name: /저렴한 조사/ }));

    const plainText = screen.getByText("일반 정보 텍스트입니다");
    expect(plainText.closest("button")).toBeNull();
  });

  it("evidencePattern이 있는 블록을 클릭하면 증거로 등록되고 다시 클릭해도 중복 등록되지 않는다", () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();
    fireEvent.click(screen.getByRole("button", { name: /저렴한 조사/ }));

    const evidenceButton = screen.getByRole("button", { name: "증거 블록 텍스트입니다" });
    fireEvent.click(evidenceButton);
    expect(screen.getByText(/등록된 증거.*1/)).toBeDefined();

    fireEvent.click(evidenceButton);
    expect(screen.getByText(/등록된 증거.*1/)).toBeDefined();
    expect(screen.queryByText(/등록된 증거.*2/)).toBeNull();
  });

  it("hiddenUntilUnlocked 조사 항목은 필요한 증거를 등록하면 언락된다", () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();
    fireEvent.click(screen.getByRole("button", { name: /저렴한 조사/ }));
    fireEvent.click(screen.getByRole("button", { name: "증거 블록 텍스트입니다" }));
    fireEvent.click(screen.getByText("목록으로"));

    expect(screen.getByText(/숨겨진 조사/)).toBeDefined();
  });

  it("NPC 질문 버튼을 클릭하면 대사가 나타나고 같은 질문은 재클릭해도 상태가 변하지 않는다", () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    expect(screen.queryByText("NPC 대사 1입니다")).toBeNull();

    const questionButton = screen.getByRole("button", { name: "질문 1" });
    fireEvent.click(questionButton);
    expect(screen.getByText("NPC 대사 1입니다")).toBeDefined();
    expect(questionButton).toBeDisabled();

    fireEvent.click(questionButton);
    expect(screen.getAllByText("NPC 대사 1입니다")).toHaveLength(1);
  });

  it("최종 판단 버튼 클릭 시 onComplete가 정확히 1회 호출되고 연속 클릭해도 1회만 호출된다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={jeonse001} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();

    const decideButton = screen.getByText("계약을 진행한다");
    fireEvent.click(decideButton);
    fireEvent.click(decideButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("JEONSE_001에서 최고점이 아닌 결정을 선택하면 오답이고 missed-realestate-investigation-signal 태그가 붙는다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={jeonse001} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();
    fireEvent.click(screen.getByText("계약을 진행한다"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("missed-realestate-investigation-signal");
  });

  it("JEONSE_001에서 최고점 결정을 선택하면 정답이고 mistakeTag가 없다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={jeonse001} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();
    fireEvent.click(screen.getByText("추가로 확인한 뒤 결정한다"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("BUNYANG_005에서 최고점(SAFE_TO_PROCEED)이 아닌 결정을 선택하면 false-alarmed-safe-case 태그가 붙는다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={bunyang005} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();
    fireEvent.click(screen.getByText("계약을 중단한다"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("false-alarmed-safe-case");
  });

  it("onComplete로 전달된 explanation에 hiddenTruth.explanation의 일부가 포함된다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={jeonse001} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();
    fireEvent.click(screen.getByText("계약을 중단한다"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.explanation).toContain(jeonse001.hiddenTruth.explanation.slice(0, 20));
  });

  it("result.typeId와 contentId가 올바르다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={jeonse001} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();
    fireEvent.click(screen.getByText("계약을 중단한다"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.typeId).toBe("case-investigation");
    expect(result.contentId).toBe("JEONSE_001");
  });
});
