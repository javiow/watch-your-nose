import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReviewItem } from "@/types/experience";
import { ReviewBreakdownTable } from "./ReviewBreakdownTable";

const items: ReviewItem[] = [
  { label: "1번 카드", userVerdict: "사기", correctVerdict: "사기", isCorrect: true },
  { label: "2번 카드", userVerdict: "정상", correctVerdict: "사기", isCorrect: false },
  { label: "3번 카드", userVerdict: "사기", correctVerdict: "사기", isCorrect: true },
];

describe("ReviewBreakdownTable", () => {
  it("항목마다 tbody tr을 렌더하고 label·verdict 텍스트를 담는다", () => {
    const { container } = render(<ReviewBreakdownTable items={items} />);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(3);
    expect(container.textContent).toContain("1번 카드");
    expect(container.textContent).toContain("2번 카드");
    expect(rows[1].textContent).toContain("정상");
    expect(rows[1].textContent).toContain("사기");
  });

  it("정답 행은 ✓/text-safe/'정답', 오답 행은 ✗/text-danger/'오답'로 표시한다", () => {
    const { container } = render(<ReviewBreakdownTable items={items} />);
    const rows = container.querySelectorAll("tbody tr");

    const okMark = rows[0].querySelector("[aria-hidden]")!;
    expect(okMark.textContent).toBe("✓");
    expect(okMark.className).toContain("text-safe");
    expect(rows[0].textContent).toContain("정답");

    const ngMark = rows[1].querySelector("[aria-hidden]")!;
    expect(ngMark.textContent).toBe("✗");
    expect(ngMark.className).toContain("text-danger");
    expect(rows[1].textContent).toContain("오답");
  });

  it("label의 {{term:...}}·** 마커를 리터럴로 노출하지 않고 치환한다", () => {
    const { container } = render(
      <ReviewBreakdownTable
        items={[
          {
            label: "{{term:전세가율}} 92%",
            userVerdict: "안전",
            correctVerdict: "위험 있음",
            isCorrect: false,
          },
        ]}
      />,
    );
    expect(container.textContent).not.toContain("{{term:");
    expect(container.textContent).toContain("전세가율");
  });

  it("빈 배열이면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<ReviewBreakdownTable items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("ul이 아니라 table로 렌더한다", () => {
    const { container } = render(<ReviewBreakdownTable items={items} />);
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelector("ul")).toBeNull();
  });
});
