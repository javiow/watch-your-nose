import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScamCasePair } from "@/types/experience";
import { CaseSelectExperience } from "./CaseSelectExperience";

const pair: ScamCasePair = {
  id: "pair-test",
  scamCase: {
    title: "수상한 사례 제목",
    body: "수상한 사례 본문",
  },
  normalCase: {
    title: "정상 사례 제목",
    body: "정상 사례 본문",
  },
  correctSide: "scam",
};

describe("CaseSelectExperience", () => {
  it("선택 전에는 다음 버튼이 비활성화된다", () => {
    render(<CaseSelectExperience content={pair} onComplete={vi.fn()} />);
    expect(screen.getByText("다음")).toBeDisabled();
  });

  it("두 사례를 모두 렌더링한다", () => {
    render(<CaseSelectExperience content={pair} onComplete={vi.fn()} />);
    expect(screen.getByText("수상한 사례 제목")).toBeDefined();
    expect(screen.getByText("수상한 사례 본문")).toBeDefined();
    expect(screen.getByText("정상 사례 제목")).toBeDefined();
    expect(screen.getByText("정상 사례 본문")).toBeDefined();
  });

  it("선택 직후 정답/오답 피드백을 보여주지 않는다", () => {
    render(<CaseSelectExperience content={pair} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("수상한 사례 제목"));
    expect(screen.getByText("다음")).not.toBeDisabled();
    expect(screen.queryByText(/정답/)).toBeNull();
    expect(screen.queryByText(/오답/)).toBeNull();
  });

  it("사기 사례를 선택하면 정답으로 채점된다", () => {
    const onComplete = vi.fn();
    render(<CaseSelectExperience content={pair} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("수상한 사례 제목"));
    fireEvent.click(screen.getByText("다음"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.typeId).toBe("case-select");
    expect(result.contentId).toBe("pair-test");
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("정상 사례를 선택하면 오답(missed-scam-signal)으로 채점된다", () => {
    const onComplete = vi.fn();
    render(<CaseSelectExperience content={pair} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("정상 사례 제목"));
    fireEvent.click(screen.getByText("다음"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("missed-scam-signal");
  });
});
