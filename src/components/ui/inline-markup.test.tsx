import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInlineMarkup } from "./inline-markup";

describe("renderInlineMarkup", () => {
  it("**로 감싼 부분을 strong으로 렌더한다", () => {
    const { container } = render(<>{renderInlineMarkup("이건 **중요** 합니다.")}</>);

    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("중요");
    expect(strong?.className).toBe("font-semibold text-foreground");
    expect(container.textContent).toBe("이건 중요 합니다.");
  });

  it("glossary에 존재하는 {{term:key}}는 TermTooltip으로 렌더한다", () => {
    const { container, getByText } = render(
      <>{renderInlineMarkup("{{term:전세가율}} 확인")}</>
    );

    expect(getByText("전세가율")).toBeDefined();
    expect(container.querySelector("button")).not.toBeNull();
  });

  it("사전에 없는 {{term:없는키|표시}}는 표시 텍스트만 남기고 툴팁은 없다", () => {
    const { container, getByText } = render(
      <>{renderInlineMarkup("{{term:없는키|표시}} 끝")}</>
    );

    expect(getByText(/표시/)).toBeDefined();
    expect(container.querySelector("button")).toBeNull();
  });

  it("강조와 용어 마커가 섞이면 각각 처리하고 사이 평문을 유지한다", () => {
    const { container } = render(
      <>{renderInlineMarkup("앞 **강조** 뒤 {{term:전세가율}} 끝")}</>
    );

    expect(container.querySelectorAll("strong")).toHaveLength(1);
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(container.textContent).toContain("앞 ");
    expect(container.textContent).toContain(" 뒤 ");
    expect(container.textContent).toContain(" 끝");
  });

  it("마커가 없는 평문은 그대로 렌더한다", () => {
    const { container } = render(
      <>{renderInlineMarkup("전부 평범한 문장입니다.")}</>
    );

    expect(container.querySelector("strong")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(container.textContent).toBe("전부 평범한 문장입니다.");
  });

  it("인접한 강조 마커는 각각 strong으로 렌더한다", () => {
    const { container: a } = render(<>{renderInlineMarkup("**A****B**")}</>);
    expect(a.querySelectorAll("strong")).toHaveLength(2);

    const { container: b } = render(<>{renderInlineMarkup("**A** **B**")}</>);
    expect(b.querySelectorAll("strong")).toHaveLength(2);
  });
});
