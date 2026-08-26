import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { JeonseHouse } from "@/types/experience";
import { HouseDialogPanel } from "./HouseDialogPanel";

const house: JeonseHouse = {
  id: "test-01",
  short: "테스트 매물",
  name: "테스트 매물 101호",
  addr: "테스트구 테스트동",
  buildingType: "빌라",
  deposit: "1억",
  market: "1억 5천",
  ratio: "66.7%",
  ratioBad: false,
  risky: false,
  fields: [
    ["등기부등본", "근저당 없음", "정상"],
    ["선순위 보증금", "선순위 없음", "정상"],
    ["시세 대비 전세가율", "66.7%", "정상"],
    ["건축물대장", "위반 없음", "정상"],
    ["임대인 명의", "소유자 본인", "정상"],
    ["공인중개사", "등록 정상", "정상"],
    ["계약 특약", "특약 없음", "정상"],
    ["전입세대 열람", "선순위 없음", "정상"],
  ],
  explain: "테스트 설명 내용입니다",
  lesson: "테스트 교훈 내용입니다",
  reason: "테스트 사유",
};

describe("HouseDialogPanel", () => {
  it("처음에는 확인 버튼이 있는 안내 화면을 보여주고 서류는 아직 보여주지 않는다", () => {
    render(
      <HouseDialogPanel house={house} answered={false} onAnswer={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText("확인")).toBeDefined();
    expect(screen.queryByText("등기부등본")).toBeNull();
  });

  it("확인을 누르면 서류 8항목과 O/X 버튼이 보인다", () => {
    render(
      <HouseDialogPanel house={house} answered={false} onAnswer={vi.fn()} onClose={vi.fn()} />
    );
    fireEvent.click(screen.getByText("확인"));
    expect(screen.getByText("등기부등본")).toBeDefined();
    expect(screen.getByText("전입세대 열람")).toBeDefined();
    expect(screen.getByRole("button", { name: "O — 위험 있음" })).toBeDefined();
    expect(screen.getByRole("button", { name: "X — 위험 없음" })).toBeDefined();
  });

  it("O를 선택하면 onAnswer(true)가 호출된다", () => {
    const onAnswer = vi.fn();
    render(
      <HouseDialogPanel house={house} answered={false} onAnswer={onAnswer} onClose={vi.fn()} />
    );
    fireEvent.click(screen.getByText("확인"));
    fireEvent.click(screen.getByText("O — 위험 있음"));
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it("X를 선택하면 onAnswer(false)가 호출된다", () => {
    const onAnswer = vi.fn();
    render(
      <HouseDialogPanel house={house} answered={false} onAnswer={onAnswer} onClose={vi.fn()} />
    );
    fireEvent.click(screen.getByText("확인"));
    fireEvent.click(screen.getByText("X — 위험 없음"));
    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it("answered가 true면 정답/오답/해설/교훈을 보여주지 않고 중립 안내만 보여준다", () => {
    render(
      <HouseDialogPanel house={house} answered={true} onAnswer={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.queryByText(/정답/)).toBeNull();
    expect(screen.queryByText(/오답/)).toBeNull();
    expect(screen.queryByText(house.explain)).toBeNull();
    expect(screen.queryByText(house.lesson)).toBeNull();
    expect(screen.getByText(/판정을 기록했습니다/)).toBeDefined();
  });

  it("닫기를 누르면 onClose가 호출된다", () => {
    const onClose = vi.fn();
    render(
      <HouseDialogPanel house={house} answered={true} onAnswer={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(screen.getByText("닫기"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
