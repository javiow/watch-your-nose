import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HighlightedText } from "./HighlightedText";

describe("HighlightedText", () => {
  it("**로 감싼 부분만 strong으로 렌더하고 나머지는 일반 텍스트다", () => {
    const { container } = render(
      <HighlightedText text="이건 평범한데 **이 부분만 강조**되고 이후는 다시 평범." />
    );

    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("이 부분만 강조");
    expect(container.textContent).toBe(
      "이건 평범한데 이 부분만 강조되고 이후는 다시 평범."
    );
  });

  it("여러 군데를 감싸면 각각 strong으로 렌더한다", () => {
    const { container } = render(
      <HighlightedText text="**첫번째**는 강조, 이건 아니고, **두번째**도 강조." />
    );

    const strongs = container.querySelectorAll("strong");
    expect(strongs).toHaveLength(2);
    expect(strongs[0].textContent).toBe("첫번째");
    expect(strongs[1].textContent).toBe("두번째");
  });

  it("강조 표시가 없으면 전부 일반 텍스트로 렌더한다", () => {
    const { container } = render(<HighlightedText text="전부 평범한 문장입니다." />);

    expect(container.querySelector("strong")).toBeNull();
    expect(screen.getByText("전부 평범한 문장입니다.")).toBeInTheDocument();
  });
});
