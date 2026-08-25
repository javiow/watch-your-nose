import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DialogueChoice } from "@/types/experience";
import { ChatChoiceButtons } from "./ChatChoiceButtons";

const choices: DialogueChoice[] = [
  { id: "a", text: "선택지 A" },
  { id: "b", text: "선택지 B" },
];

describe("ChatChoiceButtons", () => {
  it("선택지를 클릭하면 즉시 onSelect가 호출된다", () => {
    const onSelect = vi.fn();
    render(<ChatChoiceButtons choices={choices} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("선택지 A"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("잠금 이후 추가 클릭은 무시되어 onSelect가 중복 호출되지 않는다", () => {
    const onSelect = vi.fn();
    render(<ChatChoiceButtons choices={choices} onSelect={onSelect} />);

    const buttonA = screen.getByText("선택지 A");
    fireEvent.click(buttonA);
    fireEvent.click(buttonA);
    fireEvent.click(screen.getByText("선택지 B"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
