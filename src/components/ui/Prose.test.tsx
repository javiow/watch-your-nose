import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Prose } from "./Prose";

describe("Prose", () => {
  it("\\n\\n 기준으로 문단을 나눠 <p>를 문단 수만큼 렌더한다", () => {
    const { container } = render(<Prose text={"문단1\n\n문단2\n\n문단3"} />);
    expect(container.querySelectorAll("p")).toHaveLength(3);
  });

  it("배열 입력은 각 원소를 문단으로 렌더한다", () => {
    const { container } = render(<Prose text={["a", "b"]} />);
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("연속 개행/공백 문단은 빈 <p> 없이 정리한다", () => {
    const { container } = render(<Prose text={"a\n\n\n\nb"} />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe("a");
    expect(paragraphs[1].textContent).toBe("b");
  });

  it("문단 내 **x**는 해당 <p> 안에서 strong으로 렌더한다", () => {
    const { container } = render(<Prose text={"앞 **핵심** 뒤"} />);
    const strong = container.querySelector("p strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("핵심");
  });

  it("컨테이너에 기본 유틸리티 클래스가 있다", () => {
    const { container } = render(<Prose text="문단" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("max-w-prose");
    expect(root.className).toContain("leading-relaxed");
    expect(root.className).toContain("text-sm");
  });

  it('size="base"는 text-base를, 기본은 text-sm을 쓴다', () => {
    const { container: base } = render(<Prose text="문단" size="base" />);
    expect((base.firstChild as HTMLElement).className).toContain("text-base");

    const { container: sm } = render(<Prose text="문단" />);
    expect((sm.firstChild as HTMLElement).className).toContain("text-sm");
  });

  it("전달받은 className을 컨테이너에 덧붙인다", () => {
    const { container } = render(<Prose text="문단" className="mt-4" />);
    expect((container.firstChild as HTMLElement).className).toContain("mt-4");
  });

  it('as="section"이면 section으로 렌더한다', () => {
    const { container } = render(<Prose text="문단" as="section" />);
    expect((container.firstChild as HTMLElement).tagName).toBe("SECTION");
  });

  it("빈 문자열은 아무것도 렌더하지 않는다", () => {
    const { container } = render(<Prose text="" />);
    expect(container.firstChild).toBeNull();
  });
});
