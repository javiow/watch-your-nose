import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Grade } from "@/types/experience";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}));

const resetSession = vi.fn();
let mockResults: unknown[] = [];
vi.mock("@/lib/session-context", () => ({
  useSession: () => ({ results: mockResults, resetSession }),
}));

const aggregate = vi.fn();
vi.mock("@/lib/scoring", () => ({
  GRADE_LABELS: { safe: "안전", caution: "주의", danger: "위험" },
  aggregateResults: (...args: unknown[]) => aggregate(...args),
}));

import ResultPage from "./page";
import { EXPERIENCE_MODULES } from "@/lib/registry";
import { GRADE_EXPRESSION } from "@/lib/mascot-frames";

function completeResults() {
  return Array.from({ length: EXPERIENCE_MODULES.length }, (_, i) => ({
    typeId: "voice-phishing",
    contentId: `c${i}`,
    score: 100,
    grade: "safe" as Grade,
    userChoice: "a",
    correctChoice: "a",
    isCorrect: true,
    explanation: "설명",
  }));
}

afterEach(() => {
  vi.clearAllMocks();
  mockResults = [];
});

describe("ResultPage 마스코트", () => {
  it.each(["safe", "caution", "danger"] as const)(
    "등급 %s이면 대응되는 마스코트 표정을 보여준다",
    (grade) => {
      mockResults = completeResults();
      aggregate.mockReturnValue({ average: 75, grade });

      const { container } = render(<ResultPage />);
      const wrapper = container.querySelector("[data-expression]");
      expect(wrapper).toHaveAttribute(
        "data-expression",
        GRADE_EXPRESSION[grade],
      );
      expect(wrapper).toHaveAttribute("aria-hidden", "true");
    },
  );

  it("마스코트는 제어 모드라 포인터에 반응하지 않는다", () => {
    mockResults = completeResults();
    aggregate.mockReturnValue({ average: 30, grade: "danger" });

    const { container } = render(<ResultPage />);
    const wrapper = container.querySelector("[data-expression]") as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper).toHaveAttribute(
      "data-expression",
      GRADE_EXPRESSION.danger,
    );
  });

  it("종합 정답률·문항별 리뷰는 그대로 렌더된다", () => {
    mockResults = completeResults();
    aggregate.mockReturnValue({ average: 80, grade: "safe" });

    render(<ResultPage />);
    expect(screen.getByText("종합 정답률")).toBeDefined();
    expect(screen.getByText("문항별 리뷰")).toBeDefined();
  });

  it("미완료 세션이면 홈으로 리다이렉트하고 마스코트를 렌더하지 않는다", () => {
    mockResults = [];
    const { container } = render(<ResultPage />);
    expect(replace).toHaveBeenCalledWith("/");
    expect(container.querySelector("[data-expression]")).toBeNull();
  });
});
