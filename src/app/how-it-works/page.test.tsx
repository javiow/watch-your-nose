import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HowItWorksPage from "./page";

describe("HowItWorksPage", () => {
  it("서비스 소개와 진행 방식 안내를 보여준다", () => {
    render(<HowItWorksPage />);
    expect(screen.getByText("진행 방식")).toBeDefined();
    expect(screen.getByText(/다음으로 넘어가기/)).toBeDefined();
    expect(screen.getByText(/정답과 오답을 알려주지 않습니다/)).toBeDefined();
  });

  it("체험 유형명을 노출하지 않는다", () => {
    render(<HowItWorksPage />);
    expect(
      screen.queryByText(/보이스피싱|사례선택|케이스 조사|전세매물|사기 판별/)
    ).toBeNull();
  });

  it("시작하기 CTA는 /setup으로 이동하는 링크다", () => {
    render(<HowItWorksPage />);
    const cta = screen.getByRole("link", { name: "시작하기" });
    expect(cta).toHaveAttribute("href", "/setup");
  });
});
