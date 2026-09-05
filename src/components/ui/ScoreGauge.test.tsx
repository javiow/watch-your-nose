import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreGauge } from "./ScoreGauge";

describe("ScoreGauge", () => {
  it("role=img 요소의 aria-label에 점수와 등급 라벨이 들어간다", () => {
    render(<ScoreGauge percent={72} grade="caution" />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("aria-label")).toMatch(/72/);
    expect(img.getAttribute("aria-label")).toMatch(/주의/);
  });

  it("등급별로 data-grade 속성이 바뀐다", () => {
    const { rerender, container } = render(
      <ScoreGauge percent={90} grade="safe" />
    );
    expect(container.querySelector('[data-grade="safe"]')).not.toBeNull();
    rerender(<ScoreGauge percent={30} grade="danger" />);
    expect(container.querySelector('[data-grade="danger"]')).not.toBeNull();
  });

  it("percent 0과 100에서도 크래시 없이 렌더된다", () => {
    expect(() => render(<ScoreGauge percent={0} grade="danger" />)).not.toThrow();
    expect(() => render(<ScoreGauge percent={100} grade="safe" />)).not.toThrow();
  });
});
