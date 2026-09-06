import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/session-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { HERO_CARDS, LandingHero } from "./LandingHero";

function renderHero() {
  return render(
    <SessionProvider>
      <LandingHero />
    </SessionProvider>,
  );
}

describe("LandingHero", () => {
  it("서비스명·헤드라인·CTA를 렌더한다", () => {
    renderHero();
    expect(screen.getByText("Watch Your Nose")).toBeDefined();
    expect(screen.getByText("코심코심")).toBeDefined();
    expect(screen.getByRole("button", { name: "시작하기" })).toBeDefined();
  });

  it("마스코트 옆에 '코심이' 라벨을 표시한다", () => {
    renderHero();
    expect(screen.getByText("코심이")).toBeDefined();
  });

  it("설명 문구는 각 문장을 중간에서 줄바꿈해 두 줄로 나눈다", () => {
    const { container } = renderHero();
    const lead = screen.getByText(/눈 뜨고 코 베이지 않도록,/);
    expect(lead.closest("p")?.querySelector("br")).not.toBeNull();
    expect(screen.getByText(/다양한 금융 사기를 미리 겪어보는 학습 서비스\./)).toBeDefined();

    const story = screen.getByText(/코심이가 .*되뇌며/);
    expect(story.closest("p")?.querySelector("br")).not.toBeNull();
    expect(screen.getByText(/사기 수법을 익히는 이야기예요\./)).toBeDefined();
    expect(container.querySelectorAll("p br").length).toBeGreaterThanOrEqual(2);
  });

  it("장식용 마스코트 이미지가 있다", () => {
    const { container } = renderHero();
    const wrapper = container.querySelector("[data-expression]");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("체험 유형명을 노출하지 않는다", () => {
    renderHero();
    expect(
      screen.queryByText(/보이스피싱|사례선택|전세매물|사기 판별/),
    ).toBeNull();
    expect(HERO_CARDS.join(" ")).not.toMatch(
      /보이스피싱|사례선택|전세매물|사기 판별/,
    );
  });

  it("떠다니는 카드는 장식이다(aria-hidden, pointer-events-none)", () => {
    const { container } = renderHero();
    const cards = container.querySelectorAll("[data-hero-card]");
    expect(cards.length).toBe(HERO_CARDS.length);
    cards.forEach((card) => {
      expect(card.getAttribute("aria-hidden")).toBe("true");
      expect(card.className).toContain("pointer-events-none");
    });
  });

  it("떠다니는 카드는 모바일에서도 보인다(hidden 클래스 없음)", () => {
    const { container } = renderHero();
    const cards = container.querySelectorAll("[data-hero-card]");
    cards.forEach((card) => {
      expect(card.className.split(/\s+/)).not.toContain("hidden");
    });
  });
});
