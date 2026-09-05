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

const fraudCard2: FraudJudgmentCard = {
  id: "fraud-fixture-02",
  category: "스미싱",
  title: "링크 주소가 미묘하게 다른 택배 안내 문자",
  content: "낯선 번호로 배송 보류 문자가 오고 링크 철자가 미묘하게 다릅니다.",
  answer: "fraud",
  explanation: "공식 도메인과 비슷하지만 다른 링크로 유도하는 스미싱입니다.",
  source: "KISA 스미싱 주의보",
};

const safeCard2: FraudJudgmentCard = {
  id: "safe-fixture-02",
  category: "택배기사_사칭피싱",
  title: "택배사 공식 앱 알림",
  content: "이미 설치된 택배사 공식 앱에서 배송 조회 알림이 옵니다.",
  answer: "safe",
  explanation: "공식 앱 안에서 확인되는 정보는 상대적으로 신뢰할 수 있습니다.",
  source: "일반 전자상거래 배송 안내 관행",
};

const fourCards = [fraudCard, safeCard, fraudCard2, safeCard2];

function start() {
  fireEvent.click(screen.getByRole("button", { name: "판정 시작" }));
}

function answerAll(userAnswers: ("fraud" | "safe")[]) {
  for (const answer of userAnswers) {
    const label = answer === "fraud" ? "사기예요" : "정상이에요";
    fireEvent.click(screen.getByText(label));
  }
}

describe("FraudJudgmentExperience", () => {
  it("시작 화면에서는 형식 배지와 '판정 시작' 버튼만 보이고 첫 카드는 나오지 않는다", () => {
    render(<FraudJudgmentExperience content={fourCards} onComplete={vi.fn()} />);
    expect(screen.getByText("빠른 판별")).toBeDefined();
    expect(screen.getByRole("button", { name: "판정 시작" })).toBeDefined();
    expect(screen.queryByText(fraudCard.title)).toBeNull();
    expect(screen.queryByText("사기예요")).toBeNull();
  });

  it("'판정 시작'을 누르면 첫 카드 content와 판정 버튼이 나타난다", () => {
    render(<FraudJudgmentExperience content={fourCards} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "판정 시작" }));
    expect(screen.getByText(fraudCard.content)).toBeDefined();
    expect(screen.getByText("사기예요")).toBeDefined();
  });

  it("첫 번째 카드의 title과 content를 렌더링한다", () => {
    render(<FraudJudgmentExperience content={fourCards} onComplete={vi.fn()} />);
    start();
    expect(screen.getByText(fraudCard.title)).toBeDefined();
    expect(screen.getByText(fraudCard.content)).toBeDefined();
  });

  it("사기예요 / 정상이에요 버튼을 렌더링한다", () => {
    render(<FraudJudgmentExperience content={fourCards} onComplete={vi.fn()} />);
    start();
    expect(screen.getByText("사기예요")).toBeDefined();
    expect(screen.getByText("정상이에요")).toBeDefined();
  });

  it("체험 중에는 어떤 카드의 source와 explanation도 노출하지 않는다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fourCards} onComplete={onComplete} />);
    start();
    answerAll(["fraud", "safe", "fraud"]);
    for (const card of fourCards) {
      expect(screen.queryByText(card.source)).toBeNull();
      expect(screen.queryByText(card.explanation)).toBeNull();
    }
  });

  it("답변할 때마다 다음 카드로 넘어간다", () => {
    render(<FraudJudgmentExperience content={fourCards} onComplete={vi.fn()} />);
    start();
    expect(screen.getByText(fraudCard.title)).toBeDefined();

    fireEvent.click(screen.getByText("사기예요"));
    expect(screen.getByText(safeCard.title)).toBeDefined();
    expect(screen.queryByText(fraudCard.title)).toBeNull();

    fireEvent.click(screen.getByText("정상이에요"));
    expect(screen.getByText(fraudCard2.title)).toBeDefined();
  });

  it("카드 4장을 모두 답한 뒤 다음으로 넘어가기를 눌러야 onComplete가 호출된다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fourCards} onComplete={onComplete} />);
    start();

    fireEvent.click(screen.getByText("사기예요"));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("정상이에요"));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("사기예요"));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("정상이에요"));
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("다음으로 넘어가기"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("4장 전부 정답이면 isCorrect: true, mistakeTag는 undefined다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fourCards} onComplete={onComplete} />);
    start();
    answerAll(["fraud", "safe", "fraud", "safe"]);
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("사기 카드를 정상으로 오판하면 missed-scam-signal이 우선된다 (혼합 오답)", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fourCards} onComplete={onComplete} />);
    start();
    // fraudCard를 safe로, safeCard2를 fraud로 오답 처리 (양방향 오답 혼합)
    answerAll(["safe", "safe", "fraud", "fraud"]);
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("missed-scam-signal");
  });

  it("정상 카드만 사기로 오판하면 false-alarmed-safe-case다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fourCards} onComplete={onComplete} />);
    start();
    // safeCard, safeCard2만 fraud로 오답, fraud 카드들은 모두 정답
    answerAll(["fraud", "fraud", "fraud", "fraud"]);
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("false-alarmed-safe-case");
  });

  it("onComplete에 전달된 결과의 contentId는 4장의 id를 정렬해 이어붙인 값이다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fourCards} onComplete={onComplete} />);
    start();
    answerAll(["fraud", "safe", "fraud", "safe"]);
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    const expectedId = fourCards
      .map((c) => c.id)
      .sort()
      .join("-");
    expect(result.contentId).toBe(expectedId);
    expect(result.typeId).toBe("fraud-judgment");
  });

  it("마지막 카드 답변 이후 사기예요/정상이에요 버튼을 다시 클릭해도 onComplete는 호출되지 않고, 다음으로 넘어가기 버튼을 연속 클릭해도 1회만 호출된다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fourCards} onComplete={onComplete} />);
    start();

    answerAll(["fraud", "safe", "fraud", "safe"]);
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("사기예요"));
    fireEvent.click(screen.getByText("정상이에요"));
    expect(onComplete).not.toHaveBeenCalled();

    const nextButton = screen.getByText("다음으로 넘어가기");
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("오답이 있으면 explanation에 해당 카드의 title과 출처가 포함된다", () => {
    const onComplete = vi.fn();
    render(<FraudJudgmentExperience content={fourCards} onComplete={onComplete} />);
    start();
    answerAll(["safe", "safe", "fraud", "fraud"]);
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    const result = onComplete.mock.calls[0][0] as ModuleResult;
    expect(result.explanation).toContain(fraudCard.title);
    expect(result.explanation).toContain(fraudCard.source);
  });

  it("진행 표시(N/4)를 렌더링한다", () => {
    render(<FraudJudgmentExperience content={fourCards} onComplete={vi.fn()} />);
    start();
    expect(screen.getByText("1 / 4")).toBeDefined();
    fireEvent.click(screen.getByText("사기예요"));
    expect(screen.getByText("2 / 4")).toBeDefined();
  });

  it("마운트 직후 안내 모달(dialog)이 뜨고, 확인하면 사라지고 첫 카드가 나온다", () => {
    render(<FraudJudgmentExperience content={fourCards} onComplete={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText(/짧은 상황 카드/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "판정 시작" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(fraudCard.content)).toBeDefined();
  });

  it("판정 중 '안내 다시 보기'로 모달을 다시 열고 닫을 수 있다", () => {
    render(<FraudJudgmentExperience content={fourCards} onComplete={vi.fn()} />);
    start();
    fireEvent.click(screen.getByRole("button", { name: "안내 다시 보기" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(fraudCard.content)).toBeDefined();
  });
});
