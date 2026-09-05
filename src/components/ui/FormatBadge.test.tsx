import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormatBadge } from "./FormatBadge";
import { EXPERIENCE_FORMAT } from "@/data/experience-format";

describe("FormatBadge", () => {
  it("formatLabel과 hint 텍스트를 렌더한다", () => {
    render(<FormatBadge format={EXPERIENCE_FORMAT["voice-phishing"]} />);
    expect(screen.getByText("전화 통화")).toBeDefined();
    expect(screen.getByText("듣고 바로 답해보세요")).toBeDefined();
  });

  it("아이콘은 aria-hidden 처리된다", () => {
    const { container } = render(
      <FormatBadge format={EXPERIENCE_FORMAT["jeonse"]} />
    );
    const hidden = container.querySelector('[aria-hidden="true"]');
    expect(hidden?.textContent).toBe("🏠");
  });
});
