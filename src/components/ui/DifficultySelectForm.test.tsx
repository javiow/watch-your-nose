import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DIFFICULTY_OPTIONS } from "@/data/difficulty";
import { DifficultySelectForm } from "./DifficultySelectForm";

describe("DifficultySelectForm", () => {
  it("난이도를 고르기 전에는 시작하기 버튼이 비활성 상태다", () => {
    render(<DifficultySelectForm onComplete={vi.fn()} />);

    expect(screen.getByRole("button", { name: "시작하기" })).toBeDisabled();
  });

  it("DIFFICULTY_OPTIONS의 세 라벨과 세 설명이 모두 렌더된다", () => {
    render(<DifficultySelectForm onComplete={vi.fn()} />);

    for (const opt of DIFFICULTY_OPTIONS) {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
      expect(screen.getByText(opt.description)).toBeInTheDocument();
    }
  });

  it("카드를 고른 뒤 시작하기를 누르면 onComplete가 그 id로 정확히 한 번 호출된다", () => {
    const onComplete = vi.fn();
    render(<DifficultySelectForm onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /중간/ }));

    const startButton = screen.getByRole("button", { name: "시작하기" });
    expect(startButton).not.toBeDisabled();

    fireEvent.click(startButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("medium");
  });

  it("다른 카드를 다시 고르면 마지막 선택만 반영된다", () => {
    const onComplete = vi.fn();
    render(<DifficultySelectForm onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /쉬움/ }));
    fireEvent.click(screen.getByRole("button", { name: /어려움/ }));

    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("hard");
  });
});
