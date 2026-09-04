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
import { EXPERIENCE_TYPE_LABELS } from "@/data/experience-types";

function completeResults(
  overrides?: Partial<{ isCorrect: boolean; mistakeTag: string; explanation: string }>[]
) {
  return EXPERIENCE_MODULES.map((mod, i) => ({
    typeId: mod.typeId,
    contentId: `c${i}`,
    score: 100,
    grade: "safe" as Grade,
    userChoice: "a",
    correctChoice: "a",
    isCorrect: true,
    explanation: "설명",
    ...(overrides?.[i] ?? {}),
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

  it("문항별 리뷰의 각 항목에 체험 유형 라벨이 노출된다", () => {
    mockResults = completeResults();
    aggregate.mockReturnValue({ average: 100, grade: "safe" });

    render(<ResultPage />);
    for (const mod of EXPERIENCE_MODULES) {
      expect(screen.getByText(new RegExp(EXPERIENCE_TYPE_LABELS[mod.typeId]))).toBeDefined();
    }
  });

  it("오답 결과의 대응 방안에도 해당 결과의 체험 유형 라벨이 함께 노출된다", () => {
    const incorrectIndex = EXPERIENCE_MODULES.findIndex((mod) => mod.typeId === "jeonse");
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === incorrectIndex ? { isCorrect: false, mistakeTag: "missed-lease-fraud-signal" } : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 75, grade: "caution" });

    render(<ResultPage />);
    expect(screen.getByText("대응 방안")).toBeDefined();
    // 문항별 리뷰 1곳(번호와 함께) + 대응 방안 1곳(단독), 총 2곳에 전세매물 라벨이 노출된다.
    expect(
      screen.getAllByText(new RegExp(EXPERIENCE_TYPE_LABELS.jeonse))
    ).toHaveLength(2);
  });

  it("문항별 리뷰 설명에서 **로 감싼 핵심 문구만 강조되고 나머지는 일반 텍스트다", () => {
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === 0
        ? { explanation: "이건 평범한 설명인데 **이 부분만 꼭 기억하세요** 나머지는 그냥 서술." }
        : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 75, grade: "caution" });

    const { container } = render(<ResultPage />);
    const strong = container.querySelector("li strong");
    expect(strong?.textContent).toBe("이 부분만 꼭 기억하세요");
    expect(container.querySelector("li")?.textContent).toContain(
      "이건 평범한 설명인데 이 부분만 꼭 기억하세요 나머지는 그냥 서술."
    );
  });

  it("대응 방안 텍스트에서도 실제 콘텐츠에 표시된 핵심 문구만 강조된다", () => {
    const incorrectIndex = EXPERIENCE_MODULES.findIndex((mod) => mod.typeId === "jeonse");
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === incorrectIndex ? { isCorrect: false, mistakeTag: "missed-lease-fraud-signal" } : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 75, grade: "caution" });

    render(<ResultPage />);
    const highlighted = screen.getByText(
      "소유자와 계약 상대방 명의 불일치, 과도한 근저당, 대리인 명의 계좌로의 잔금 입금 요구"
    );
    expect(highlighted.tagName).toBe("STRONG");
  });

  it("미완료 세션이면 홈으로 리다이렉트하고 마스코트를 렌더하지 않는다", () => {
    mockResults = [];
    const { container } = render(<ResultPage />);
    expect(replace).toHaveBeenCalledWith("/");
    expect(container.querySelector("[data-expression]")).toBeNull();
  });
});
