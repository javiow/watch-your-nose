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

function renderBoard(overrides: { answers?: Record<number, boolean>; hintUsedIndex?: number | null; onAnswer?: (index: number, risky: boolean) => void; onUseHint?: (index: number) => void } = {}) {
  return render(
    <MapBoard
      houses={houses}
      answers={overrides.answers ?? {}}
      onAnswer={overrides.onAnswer ?? vi.fn()}
      hintUsedIndex={overrides.hintUsedIndex ?? null}
      onUseHint={overrides.onUseHint ?? vi.fn()}
    />
  );
}

describe("MapBoard", () => {
  it("5채의 매물 버튼을 렌더링한다", () => {
    renderBoard();
    for (const house of houses) {
      expect(screen.getByRole("button", { name: `${house.short} 입장` })).toBeDefined();
    }
  });

  it("진행 상황을 점검 N/5 형태로만 보여주고 정답 수는 노출하지 않는다", () => {
    renderBoard({ answers: { 0: true } });
    expect(screen.getByText(/점검\s*1\s*\/\s*5/)).toBeDefined();
    expect(screen.queryByText(/정답/)).toBeNull();
  });

  it("완료된 매물은 완료로, 그 외는 미점검으로만 표시하고 정답/오답은 표시하지 않는다", () => {
    renderBoard({ answers: { 0: true } });
    expect(screen.getAllByText("완료").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("미점검").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("정답")).toBeNull();
    expect(screen.queryByText("오답")).toBeNull();
  });

  it("매물을 클릭하면 점검 패널이 열린다", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: `${houses[0].short} 입장` }));
    expect(screen.getByText("확인")).toBeDefined();
  });

  it("점검 패널에서 O/X를 선택하면 onAnswer(index, risky)가 호출된다", () => {
    const onAnswer = vi.fn();
    renderBoard({ onAnswer });
    fireEvent.click(screen.getByRole("button", { name: `${houses[0].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    fireEvent.click(screen.getByText("X — 위험 없음"));
    expect(onAnswer).toHaveBeenCalledWith(0, false);
  });

  it("유형명을 드러내는 문구를 쓰지 않는다", () => {
    const { container } = renderBoard();
    expect(container.textContent).not.toMatch(/전세사기|jeonse|JEONSE/i);
  });

  it("힌트 버튼 클릭 시 onUseHint가 현재 입장한 집의 인덱스와 함께 호출된다", () => {
    const onUseHint = vi.fn();
    renderBoard({ hintUsedIndex: null, onUseHint });
    fireEvent.click(screen.getByRole("button", { name: `${houses[3].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    fireEvent.click(screen.getByRole("button", { name: "힌트 사용" }));
    expect(onUseHint).toHaveBeenCalledWith(3);
  });

  it("hintUsedIndex가 입장한 집과 같으면 확인 직후 바로 서류 상태가 보인다", () => {
    renderBoard({ hintUsedIndex: 2 });
    fireEvent.click(screen.getByRole("button", { name: `${houses[2].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    expect(screen.getAllByText("정상").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "힌트 사용" })).toBeNull();
  });

  it("hintUsedIndex가 다른 집을 가리키면 힌트 버튼이 비활성화되고 상태는 안 보인다", () => {
    renderBoard({ hintUsedIndex: 0 });
    fireEvent.click(screen.getByRole("button", { name: `${houses[1].short} 입장` }));
    fireEvent.click(screen.getByText("확인"));
    expect(screen.getByRole("button", { name: "힌트 사용" })).toBeDisabled();
    expect(screen.queryByText("정상")).toBeNull();
  });
});
