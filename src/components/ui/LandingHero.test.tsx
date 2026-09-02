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
});
