import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CaseInvestigationContent, ModuleResult } from "@/types/experience";
import { CASE_INVESTIGATION_CASES } from "@/data/case-investigation";
import { matchNpcStatement } from "@/lib/npc-chat";
import { classifyQuestion } from "@/lib/npc-chat-client";
import { CaseInvestigationExperience } from "./CaseInvestigationExperience";

vi.mock("@/lib/npc-chat-client", () => ({
  classifyQuestion: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(classifyQuestion).mockImplementation(async (npc, input) =>
    matchNpcStatement(npc, input)
  );
});

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
    greeting: "테스트 인사말입니다",
    fallbackLine: "테스트 회피 대사입니다",
    statements: [
      { statementId: "ST1", text: "NPC 대사 1입니다", matchKeywords: ["질문"] },
    ],
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

  it("추천 질문 칩을 클릭하면 대사가 나타나고, 같은 칩을 다시 클릭하면 다시 응답한다", async () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    expect(screen.queryByText("NPC 대사 1입니다")).toBeNull();

    const chip = screen.getByRole("button", { name: "질문 1" });
    fireEvent.click(chip);
    expect(await screen.findByText("NPC 대사 1입니다")).toBeDefined();
    expect(chip).not.toBeDisabled();

    fireEvent.click(chip);
    await waitFor(() => {
      expect(screen.getAllByText("NPC 대사 1입니다")).toHaveLength(2);
    });
  });

  it("자유 입력창에 매칭 키워드를 포함한 질문을 입력하면 해당 대사로 응답한다", async () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    const input = screen.getByPlaceholderText(/궁금한 점을 자유롭게/);
    fireEvent.change(input, { target: { value: "질문 있어요 대답해주세요" } });
    fireEvent.click(screen.getByRole("button", { name: "물어보기" }));

    expect(await screen.findByText("질문 있어요 대답해주세요")).toBeDefined();
    expect(await screen.findByText("NPC 대사 1입니다")).toBeDefined();
    expect(input).toHaveValue("");
  });

  it("어떤 키워드와도 매칭되지 않는 질문을 입력하면 fallbackLine으로 응답한다", async () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    const input = screen.getByPlaceholderText(/궁금한 점을 자유롭게/);
    fireEvent.change(input, { target: { value: "오늘 날씨는 어떤가요" } });
    fireEvent.click(screen.getByRole("button", { name: "물어보기" }));

    expect(await screen.findByText("오늘 날씨는 어떤가요")).toBeDefined();
    expect(await screen.findByText("테스트 회피 대사입니다")).toBeDefined();
  });

  it("너무 짧은 입력은 반려되고 대화 내역에 추가되지 않는다", () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    const input = screen.getByPlaceholderText(/궁금한 점을 자유롭게/);
    fireEvent.change(input, { target: { value: "네?" } });
    fireEvent.click(screen.getByRole("button", { name: "물어보기" }));

    expect(screen.queryByText("네?")).toBeNull();
    expect(screen.getByText(/조금 더 구체적으로/)).toBeDefined();
  });

  it("질문은 최대 3회까지만 가능하고, 초과 시도는 대화 내역에 추가되지 않는다", async () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    const chip = screen.getByRole("button", { name: "질문 1" });

    fireEvent.click(chip);
    await waitFor(() => expect(screen.getAllByText("NPC 대사 1입니다")).toHaveLength(1));

    fireEvent.click(chip);
    await waitFor(() => expect(screen.getAllByText("NPC 대사 1입니다")).toHaveLength(2));

    fireEvent.click(chip);
    await waitFor(() => expect(screen.getAllByText("NPC 대사 1입니다")).toHaveLength(3));

    expect(chip).toBeDisabled();
    expect(screen.getByPlaceholderText(/궁금한 점을 자유롭게/)).toBeDisabled();
    expect(screen.getByRole("button", { name: "물어보기" })).toBeDisabled();
    expect(screen.getByText(/질문 횟수를 모두 사용/)).toBeDefined();
  });

  it("질문 가능 횟수가 화면에 표시되고 질문할 때마다 갱신된다", async () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    expect(screen.getByText("질문 0/3")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "질문 1" }));
    await waitFor(() => expect(screen.getByText("질문 1/3")).toBeDefined());
  });

  it("조사 화면 진입 시 NPC의 인사말이 먼저 표시된다", () => {
    render(<CaseInvestigationExperience content={gatingFixture} onComplete={vi.fn()} />);
    startInvestigating();

    expect(screen.getByText("테스트 인사말입니다")).toBeDefined();
  });

  it("질문을 물으면 내가 물은 질문과 NPC 대사가 클릭한 순서대로 대화 내역에 누적된다", async () => {
    const { container } = render(
      <CaseInvestigationExperience content={bunyang005} onComplete={vi.fn()} />
    );
    startInvestigating();

    fireEvent.click(screen.getByRole("button", { name: "인허가랑 분양보증은 문제없나요?" }));
    await screen.findByText("이 프로젝트는 인허가와 분양보증 모두 정상입니다.");
    fireEvent.click(screen.getByRole("button", { name: "수익보장은 언제까지 되나요?" }));
    await screen.findByText("수익보장은 평생 지속됩니다.");

    const text = container.textContent ?? "";
    const idxAskedSecondQuestion = text.indexOf("인허가랑 분양보증은 문제없나요?");
    const idxAskedSecondAnswer = text.indexOf("이 프로젝트는 인허가와 분양보증 모두 정상입니다.");
    const idxAskedFirstQuestion = text.indexOf("수익보장은 언제까지 되나요?");

    expect(idxAskedSecondAnswer).toBeGreaterThan(idxAskedSecondQuestion);
    expect(idxAskedFirstQuestion).toBeGreaterThan(idxAskedSecondAnswer);
  });

  it("결정 버튼 클릭 직후에는 onComplete가 호출되지 않고 다음으로 넘어가기 버튼이 나타난다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={jeonse001} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();

    fireEvent.click(screen.getByText("계약을 진행한다"));

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("다음으로 넘어가기")).toBeDefined();
  });

  it("결정 버튼과 다음으로 넘어가기 버튼을 각각 연속 클릭해도 onComplete는 1회만 호출된다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={jeonse001} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();

    const decideButton = screen.getByText("계약을 진행한다");
    fireEvent.click(decideButton);
    fireEvent.click(decideButton);

    const nextButton = screen.getByText("다음으로 넘어가기");
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("JEONSE_001에서 최고점이 아닌 결정을 선택하면 오답이고 missed-realestate-investigation-signal 태그가 붙는다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={jeonse001} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();
    fireEvent.click(screen.getByText("계약을 진행한다"));
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

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
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

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
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

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
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.explanation).toContain(jeonse001.hiddenTruth.explanation.slice(0, 20));
  });

  it("result.typeId와 contentId가 올바르다", () => {
    const onComplete = vi.fn();
    render(<CaseInvestigationExperience content={jeonse001} onComplete={onComplete} />);
    startInvestigating();
    goToDecision();
    fireEvent.click(screen.getByText("계약을 중단한다"));
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.typeId).toBe("case-investigation");
    expect(result.contentId).toBe("JEONSE_001");
  });
});
