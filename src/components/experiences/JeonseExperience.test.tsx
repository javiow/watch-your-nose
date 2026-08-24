import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ListingPair } from "@/types/experience";
import { JeonseExperience } from "./JeonseExperience";

const pair: ListingPair = {
  id: "listing-test",
  normalListing: {
    title: "정상 매물 제목",
    details: "정상 매물 상세",
  },
  scamListing: {
    title: "위험 매물 제목",
    details: "위험 매물 상세",
  },
  correctSide: "normal",
};

describe("JeonseExperience", () => {
  it("선택 전에는 다음 버튼이 비활성화된다", () => {
    render(<JeonseExperience content={pair} onComplete={vi.fn()} />);
    expect(screen.getByText("다음")).toBeDisabled();
  });

  it("두 매물을 모두 렌더링한다", () => {
    render(<JeonseExperience content={pair} onComplete={vi.fn()} />);
    expect(screen.getByText("정상 매물 제목")).toBeDefined();
    expect(screen.getByText("정상 매물 상세")).toBeDefined();
    expect(screen.getByText("위험 매물 제목")).toBeDefined();
    expect(screen.getByText("위험 매물 상세")).toBeDefined();
  });

  it("선택 직후 정답/오답 피드백을 보여주지 않는다", () => {
    render(<JeonseExperience content={pair} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("정상 매물 제목"));
    expect(screen.getByText("다음")).not.toBeDisabled();
    expect(screen.queryByText(/정답/)).toBeNull();
    expect(screen.queryByText(/오답/)).toBeNull();
  });

  it("정상 매물을 선택하면 정답으로 채점된다", () => {
    const onComplete = vi.fn();
    render(<JeonseExperience content={pair} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("정상 매물 제목"));
    fireEvent.click(screen.getByText("다음"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.typeId).toBe("jeonse");
    expect(result.contentId).toBe("listing-test");
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("사기 매물을 선택하면 오답(missed-lease-fraud-signal)으로 채점된다", () => {
    const onComplete = vi.fn();
    render(<JeonseExperience content={pair} onComplete={onComplete} />);
    fireEvent.click(screen.getByText("위험 매물 제목"));
    fireEvent.click(screen.getByText("다음"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("missed-lease-fraud-signal");
  });
});
