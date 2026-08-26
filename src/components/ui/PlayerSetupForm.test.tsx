import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerSetupForm } from "./PlayerSetupForm";

describe("PlayerSetupForm", () => {
  it("나이대/직업/성별 중 하나라도 선택되지 않으면 시작하기 버튼이 비활성 상태다", () => {
    render(<PlayerSetupForm onComplete={vi.fn()} />);

    const startButton = screen.getByRole("button", { name: "시작하기" });
    expect(startButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "20대" }));
    expect(startButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "직장인" }));
    expect(startButton).toBeDisabled();
  });

  it("셋 다 선택 후 클릭하면 onComplete가 선택한 값 그대로 정확히 한 번 호출된다", () => {
    const onComplete = vi.fn();
    render(<PlayerSetupForm onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: "20대" }));
    fireEvent.click(screen.getByRole("button", { name: "직장인" }));
    fireEvent.click(screen.getByRole("button", { name: "여성" }));

    const startButton = screen.getByRole("button", { name: "시작하기" });
    expect(startButton).not.toBeDisabled();

    fireEvent.click(startButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({
      ageGroup: "20대",
      job: "직장인",
      gender: "여성",
    });
  });
});
