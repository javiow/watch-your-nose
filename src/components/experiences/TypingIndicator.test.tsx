import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TypingIndicator } from "./TypingIndicator";

describe("TypingIndicator", () => {
  it("타이핑 인디케이터를 렌더한다", () => {
    render(<TypingIndicator />);
    expect(screen.getByTestId("typing-indicator")).toBeDefined();
  });
});
