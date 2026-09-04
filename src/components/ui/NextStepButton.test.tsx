import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NextStepButton } from "./NextStepButton";

describe("NextStepButton", () => {
  it("기본 라벨 '다음으로 넘어가기'를 렌더한다", () => {
    render(<NextStepButton onClick={vi.fn()} />);
    expect(screen.getByText("다음으로 넘어가기")).toBeInTheDocument();
  });

  it("label prop을 주면 그 텍스트로 렌더한다", () => {
    render(<NextStepButton onClick={vi.fn()} label="결과 확인하기" />);
    expect(screen.getByText("결과 확인하기")).toBeInTheDocument();
  });

  it("클릭 시 onClick이 정확히 1회 호출된다", () => {
    const onClick = vi.fn();
    render(<NextStepButton onClick={onClick} />);
    fireEvent.click(screen.getByText("다음으로 넘어가기"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled일 때 클릭해도 onClick이 호출되지 않는다", () => {
    const onClick = vi.fn();
    render(<NextStepButton onClick={onClick} disabled />);
    const button = screen.getByText("다음으로 넘어가기");

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("message prop이 있으면 완료 안내 문구와 버튼을 카드로 함께 렌더한다", () => {
    const { container } = render(
      <NextStepButton onClick={vi.fn()} message="모든 판정을 완료했습니다." />
    );

    expect(screen.getByText("모든 판정을 완료했습니다.")).toBeInTheDocument();
    expect(screen.getByText("다음으로 넘어가기")).toBeInTheDocument();
    expect(container.querySelector(".rounded-xl.border")).toBeInTheDocument();
  });

  it("message prop이 없으면 카드 래퍼 없이 버튼만 렌더한다", () => {
    const { container } = render(<NextStepButton onClick={vi.fn()} />);
    const button = screen.getByText("다음으로 넘어가기");
    expect(container.firstChild).toBe(button);
  });
});
