import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatBubble } from "./ChatBubble";

describe("ChatBubble", () => {
  it("caller 말풍선은 좌측 정렬 카드 톤으로 렌더된다", () => {
    render(<ChatBubble speaker="caller" text="안녕하세요" />);
    const bubble = screen.getByText("안녕하세요");
    expect(bubble.className).toContain("bg-[#141414]");
    expect(bubble.parentElement?.className).toContain("justify-start");
  });

  it("me 말풍선은 우측 정렬 브랜드 톤으로 렌더된다", () => {
    render(<ChatBubble speaker="me" text="알겠습니다" />);
    const bubble = screen.getByText("알겠습니다");
    expect(bubble.className).toContain("bg-blue-500");
    expect(bubble.parentElement?.className).toContain("justify-end");
  });
});
