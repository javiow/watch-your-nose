import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FraudJudgmentCard, ModuleResult } from "@/types/experience";
import { FraudJudgmentExperience } from "./FraudJudgmentExperience";

const fraudCard: FraudJudgmentCard = {
  id: "fraud-fixture-01",
  category: "중고거래_사기",
  title: "먼저 입금해주면 바로 보내드릴게요",
  content: "판매자가 안전결제를 거부하고 선입금을 요구합니다.",
  answer: "fraud",
  explanation: "선입금 요구와 안전결제 거부는 대표적인 사기 신호입니다.",
  source: "더치트 공개 사기 유형",
};

const safeCard: FraudJudgmentCard = {
  id: "safe-fixture-01",
  category: "투자리딩방_사기",
  title: "정식 등록된 투자자문사의 유료 리포트",
  content: "정식 계약을 맺고 월 구독료를 받는 투자자문 서비스입니다.",
  answer: "safe",
  explanation: "정식 등록업체 여부는 금융감독원에서 확인할 수 있습니다.",
  source: "금융투자협회 등록 자문업 안내",
};

describe("FraudJudgmentExperience", () => {
  it("카드의 title과 content를 렌더링한다", () => {
    render(<FraudJudgmentExperience content={fraudCard} onComplete={vi.fn()} />);
    expect(screen.getByText(fraudCard.title)).toBeDefined();
    expect(screen.getByText(fraudCard.content)).toBeDefined();
  });

  it("사기예요 / 정상이에요 버튼을 렌더링한다", () => {
    render(<FraudJudgmentExperience content={fraudCard} onComplete={vi.fn()} />);
    expect(screen.getByText("사기예요")).toBeDefined();
    expect(screen.getByText("정상이에요")).toBeDefined();
  });

  it("체험 중에는 source와 explanation을 노출하지 않는다 (렌더 직후)", () => {
    render(<FraudJudgmentExperience content={fraudCard} onComplete={vi.fn()} />);
    expect(screen.queryByText(fraudCard.source)).toBeNull();
    expect(screen.queryByText(fraudCard.explanation)).toBeNull();
  });

  it("체험 중에는 source와 explanation을 노출하지 않는다 (버튼 클릭 직후)", () => {
    render(<FraudJudgmentExperience content={fraudCard} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("사기예요"));
    expect(screen.queryByText(fraudCard.source)).toBeNull();
    expect(screen.queryByText(fraudCard.explanation)).toBeNull();
  });

  it("fraud 카드에서 사기예요를 선택하면 정답으로 채점된다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fraudCard} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("사기예요"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("fraud 카드에서 정상이에요를 선택하면 missed-scam-signal로 오답 채점된다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fraudCard} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("정상이에요"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("missed-scam-signal");
  });

  it("safe 카드에서 정상이에요를 선택하면 정답으로 채점된다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={safeCard} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("정상이에요"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("safe 카드에서 사기예요를 선택하면 false-alarmed-safe-case로 오답 채점된다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={safeCard} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("사기예요"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("false-alarmed-safe-case");
  });

  it("onComplete에 전달된 explanation은 explanation과 source를 둘 다 포함한다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fraudCard} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("사기예요"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.explanation).toContain(fraudCard.explanation);
    expect(result.explanation).toContain(fraudCard.source);
  });

  it("연속 클릭해도 onComplete는 정확히 1회만 호출된다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fraudCard} onComplete={onComplete} />);
    const fraudButton = screen.getByText("사기예요");
    fireEvent.click(fraudButton);
    fireEvent.click(fraudButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
