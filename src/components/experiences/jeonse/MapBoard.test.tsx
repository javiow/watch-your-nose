import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { JeonseHouse } from "@/types/experience";
import { MapBoard } from "./MapBoard";

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
    reason: "사유",
  };
}

const houses: JeonseHouse[] = ["1", "2", "3", "4", "5"].map((id) => makeHouse(id, id === "1"));

describe("MapBoard", () => {
  it("5채의 매물 버튼을 렌더링한다", () => {
    render(<MapBoard houses={houses} answers={{}} onAnswer={vi.fn()} />);
    for (const house of houses) {
      expect(screen.getByRole("button", { name: `${house.short} 입장` })).toBeDefined();
    }
  });

  it("진행 상황을 점검 N/5 형태로만 보여주고 정답 수는 노출하지 않는다", () => {
    render(<MapBoard houses={houses} answers={{ 0: true }} onAnswer={vi.fn()} />);
    expect(screen.getByText(/점검\s*1\s*\/\s*5/)).toBeDefined();
    expect(screen.queryByText(/정답/)).toBeNull();
  });

  it("완료된 매물은 완료로, 그 외는 미점검으로만 표시하고 정답/오답은 표시하지 않는다", () => {
    render(<MapBoard houses={houses} answers={{ 0: true }} onAnswer={vi.fn()} />);
    expect(screen.getAllByText("완료").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("미점검").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("정답")).toBeNull();
    expect(screen.queryByText("오답")).toBeNull();
  });

  it("매물을 클릭하면 점검 패널이 열린다", () => {
    render(<MapBoard houses={houses} answers={{}} onAnswer={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: `${houses[0].short} 입장` }));
    expect(screen.getByText("확인")).toBeDefined();
  });

  it("점검 패널에서 O/X를 선택하면 onAnswer(index, risky)가 호출된다", () => {
    const onAnswer = vi.fn();
    render(<MapBoard houses={houses} answers={{}} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole("button", { name: `${houses[0].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    fireEvent.click(screen.getByText("X — 위험 없음"));
    expect(onAnswer).toHaveBeenCalledWith(0, false);
  });

  it("유형명을 드러내는 문구를 쓰지 않는다", () => {
    const { container } = render(<MapBoard houses={houses} answers={{}} onAnswer={vi.fn()} />);
    expect(container.textContent).not.toMatch(/전세사기|jeonse|JEONSE/i);
  });
});
