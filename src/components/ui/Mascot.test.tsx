import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MASCOT_FRAME_FILES } from "@/lib/mascot-frames";
import { Mascot } from "./Mascot";

function stubMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  stubMatchMedia(false);
});

describe("Mascot", () => {
  it("renders a decorative mascot image (props/provider 없이)", () => {
    const { container } = render(<Mascot />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute("aria-hidden", "true");
  });

  it("표정 프레임을 전부 겹쳐 렌더한다", () => {
    const { container } = render(<Mascot />);
    expect(container.querySelectorAll("img").length).toBe(
      MASCOT_FRAME_FILES.length,
    );
  });

  it("래퍼가 aria-hidden 장식 요소다", () => {
    const { container } = render(<Mascot />);
    const wrapper = container.querySelector("[data-expression]");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
  });

  it("expression prop이 활성 프레임을 결정한다(제어 모드)", () => {
    const { container } = render(<Mascot expression="surprised" />);
    const wrapper = container.querySelector("[data-expression]");
    expect(wrapper).toHaveAttribute("data-expression", "surprised");

    const activeFrames = container.querySelectorAll('img[data-active="true"]');
    expect(activeFrames.length).toBe(1);
    expect(activeFrames[0].className).toContain("opacity-100");

    container
      .querySelectorAll('img[data-active="false"]')
      .forEach((img) => expect(img.className).toContain("opacity-0"));
  });

  it("interactive면 mouseEnter로 놀란 표정이 된다", () => {
    const { container } = render(<Mascot interactive />);
    const wrapper = container.querySelector("[data-expression]") as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper).toHaveAttribute("data-expression", "surprised");
  });

  it("prefers-reduced-motion이면 interactive여도 표정이 고정된다", () => {
    stubMatchMedia(true);
    const { container } = render(<Mascot interactive />);
    const wrapper = container.querySelector("[data-expression]") as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper).toHaveAttribute("data-expression", "idle");
  });
});
