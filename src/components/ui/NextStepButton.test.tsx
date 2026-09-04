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
});
