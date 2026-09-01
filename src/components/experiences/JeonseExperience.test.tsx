import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { JeonseHouse } from "@/types/experience";
import { JeonseExperience } from "./JeonseExperience";

function makeHouse(id: string, risky: boolean): JeonseHouse {
  return {
    id,
    short: `매물 ${id}`,
    name: `매물 ${id}호`,
    addr: "테스트동",
    buildingType: "빌라",
    deposit: "1억",
    market: "1억 5천",
    ratio: "66.7%",
    ratioBad: false,
    risky,
    difficulty: "easy",
    fields: [
      ["등기부등본", "값", "정상"],
      ["선순위 보증금", "값", "정상"],
      ["시세 대비 전세가율", "값", "정상"],
      ["건축물대장", "값", "정상"],
      ["임대인 명의", "값", "정상"],
      ["공인중개사", "값", "정상"],
      ["계약 특약", "값", "정상"],
      ["전입세대 열람", "값", "정상"],
    ],
    explain: "설명",
    lesson: "교훈",
    reason: `${id}번 매물 놓친 이유`,
  };
}

function judgeHouse(index: number, house: JeonseHouse, risky: boolean) {
  fireEvent.click(screen.getByRole("button", { name: `${house.short} 입장` }));
  fireEvent.click(screen.getByText("확인"));
  fireEvent.click(screen.getByText(risky ? "O — 위험 있음" : "X — 위험 없음"));
  fireEvent.click(screen.getByText("닫기"));
}

describe("JeonseExperience", () => {
  it("초기 렌더 시 5채 모두 미판정 상태로 보드가 표시된다", () => {
    const houses = ["1", "2", "3", "4", "5"].map((id) => makeHouse(id, false));
    render(<JeonseExperience content={houses} onComplete={vi.fn()} />);
    expect(screen.getAllByText("미점검").length).toBeGreaterThanOrEqual(5);
  });

  it("매물 하나를 판정한 직후 정답/오답/해설 텍스트가 없다", () => {
    const houses = ["1", "2", "3", "4", "5"].map((id) => makeHouse(id, false));
    render(<JeonseExperience content={houses} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: `${houses[0].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    fireEvent.click(screen.getByText("X — 위험 없음"));

    expect(screen.queryByText(/정답/)).toBeNull();
    expect(screen.queryByText(/오답/)).toBeNull();
    expect(screen.queryByText(houses[0].explain)).toBeNull();
    expect(screen.queryByText(houses[0].lesson)).toBeNull();
  });

  it("5채를 모두 정답으로 판정하면 onComplete가 1회 호출되고 만점으로 채점된다", () => {
    const houses = ["1", "2", "3", "4", "5"].map((id) => makeHouse(id, false));
    const onComplete = vi.fn();
    render(<JeonseExperience content={houses} onComplete={onComplete} />);

    houses.forEach((house, i) => judgeHouse(i, house, false));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.typeId).toBe("jeonse");
    expect(result.contentId).toBe(["1", "2", "3", "4", "5"].sort().join("-"));
    expect(result.score).toBe(100);
    expect(result.isCorrect).toBe(true);
    expect(result.mistakeTag).toBeUndefined();
  });

  it("일부를 오답으로 판정하면 mistakeTag가 missed-lease-fraud-signal로 채점된다", () => {
    const houses = [
      makeHouse("1", true),
      makeHouse("2", true),
      makeHouse("3", false),
      makeHouse("4", false),
      makeHouse("5", false),
    ];
    const onComplete = vi.fn();
    render(<JeonseExperience content={houses} onComplete={onComplete} />);

    // 1, 2번은 실제로 위험(risky=true)한데 안전(X)으로 오판정 → 3/5 정답(60%)
    judgeHouse(0, houses[0], false);
    judgeHouse(1, houses[1], false);
    houses.slice(2).forEach((house, idx) => judgeHouse(idx + 2, house, false));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.score).toBe(60);
    expect(result.isCorrect).toBe(false);
    expect(result.mistakeTag).toBe("missed-lease-fraud-signal");
    expect(result.explanation).toContain(houses[0].reason);
    expect(result.explanation).toContain(houses[1].reason);
  });

  it("힌트로 공개한 집은 판정 전에 닫았다가 다시 들어가도 서류 상태가 계속 보인다", () => {
    const houses = ["1", "2", "3", "4", "5"].map((id) => makeHouse(id, false));
    render(<JeonseExperience content={houses} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: `${houses[0].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    expect(screen.queryAllByText("정상")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "힌트 사용" }));
    expect(screen.getAllByText("정상")).toHaveLength(8);

    fireEvent.keyDown(window, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: `${houses[0].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    expect(screen.getAllByText("정상")).toHaveLength(8);
    expect(screen.queryByRole("button", { name: "힌트 사용" })).toBeNull();
  });

  it("한 집에서 힌트를 쓰면 다른 집에서는 힌트 버튼이 비활성화된다", () => {
    const houses = ["1", "2", "3", "4", "5"].map((id) => makeHouse(id, false));
    render(<JeonseExperience content={houses} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: `${houses[0].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    fireEvent.click(screen.getByRole("button", { name: "힌트 사용" }));
    fireEvent.keyDown(window, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: `${houses[1].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    expect(screen.getByRole("button", { name: "힌트 사용" })).toBeDisabled();
    expect(screen.queryAllByText("정상")).toHaveLength(0);
  });
});
