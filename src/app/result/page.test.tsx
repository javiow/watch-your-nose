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
  describeGradeThresholds: () => "80% 이상 안전 · 50~79% 주의 · 50% 미만 위험",
  computeGrade: (n: number) => (n >= 80 ? "safe" : n >= 50 ? "caution" : "danger"),
}));

import ResultPage from "./page";
import { EXPERIENCE_MODULES } from "@/lib/registry";
import { GRADE_EXPRESSION } from "@/lib/mascot-frames";
import { EXPERIENCE_TYPE_LABELS } from "@/data/experience-types";

function completeResults(
  overrides?: Partial<{
    isCorrect: boolean;
    mistakeTag: string;
    explanation: string;
    reviewItems: unknown;
    missedSignals: unknown;
  }>[]
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

  it("종합 점수 게이지·등급 기준·유형별 점수·문항별 리뷰가 렌더된다", () => {
    mockResults = completeResults();
    aggregate.mockReturnValue({ average: 80, grade: "safe" });

    render(<ResultPage />);
    expect(screen.getByRole("heading", { name: "결과 📊" })).toBeDefined();
    expect(screen.getByText("종합 정답률 🎯")).toBeDefined();
    expect(screen.getByRole("img", { name: /80.*안전/ })).toBeDefined();
    expect(screen.getByText(/80% 이상 안전/)).toBeDefined();
    expect(screen.getByText("유형별 점수 📈")).toBeDefined();
    expect(screen.getByText("문항별 리뷰 📝")).toBeDefined();
    expect(screen.getByRole("button", { name: "다시 체험하기 🔄" })).toBeDefined();
  });

  it("문항별 리뷰의 각 항목에 체험 유형 라벨이 노출된다", () => {
    mockResults = completeResults();
    aggregate.mockReturnValue({ average: 100, grade: "safe" });

    render(<ResultPage />);
    for (const mod of EXPERIENCE_MODULES) {
      // 막대 그래프 + 문항별 리뷰 양쪽에 라벨이 나오므로 최소 1곳 이상.
      expect(
        screen.getAllByText(new RegExp(EXPERIENCE_TYPE_LABELS[mod.typeId])).length
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("오답 결과의 문항 리뷰 안에 대응 방안이 함께 노출된다", () => {
    const incorrectIndex = EXPERIENCE_MODULES.findIndex((mod) => mod.typeId === "jeonse");
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === incorrectIndex ? { isCorrect: false, mistakeTag: "missed-lease-fraud-signal" } : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 75, grade: "caution" });

    render(<ResultPage />);
    // 별도 "대응 방안" 섹션은 없어지고 문항 리뷰 안에 "이렇게 대응하세요"로 들어간다.
    expect(screen.queryByText("대응 방안")).toBeNull();
    expect(screen.getByText("이렇게 대응하세요 🛡️")).toBeDefined();
    // 유형별 점수 막대 1곳 + 문항별 리뷰 1곳, 총 2곳에 전세매물 라벨이 노출된다.
    expect(
      screen.getAllByText(new RegExp(EXPERIENCE_TYPE_LABELS.jeonse))
    ).toHaveLength(2);
  });

  it("정답 결과의 문항 리뷰에는 대응 방안이 렌더되지 않는다", () => {
    mockResults = completeResults();
    aggregate.mockReturnValue({ average: 100, grade: "safe" });

    render(<ResultPage />);
    expect(screen.queryByText("이렇게 대응하세요 🛡️")).toBeNull();
  });

  it("오답 대응 블록이 해당 문항(N번) 리뷰 항목 안에 위치한다", () => {
    const incorrectIndex = EXPERIENCE_MODULES.findIndex((mod) => mod.typeId === "jeonse");
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === incorrectIndex ? { isCorrect: false, mistakeTag: "missed-lease-fraud-signal" } : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 75, grade: "caution" });

    const { container } = render(<ResultPage />);
    const items = Array.from(container.querySelectorAll("li"));
    const reviewItem = items.find(
      (li) =>
        li.textContent?.includes(`${incorrectIndex + 1}번`) &&
        li.textContent?.includes(EXPERIENCE_TYPE_LABELS.jeonse)
    );
    expect(reviewItem).toBeDefined();
    expect(reviewItem?.textContent).toContain("이렇게 대응하세요");
    expect(reviewItem?.textContent).toContain("등기부등본으로 소유자·근저당 직접 확인");
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

  it("대응 방안은 짧은 불릿 목록과 공식 링크(새 탭)로 렌더된다", () => {
    const incorrectIndex = EXPERIENCE_MODULES.findIndex((mod) => mod.typeId === "jeonse");
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === incorrectIndex ? { isCorrect: false, mistakeTag: "missed-lease-fraud-signal" } : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 75, grade: "caution" });

    render(<ResultPage />);
    expect(
      screen.getByText("등기부등본으로 소유자·근저당 직접 확인")
    ).toBeDefined();

    const link = screen.getByRole("link", { name: /인터넷등기소/ });
    expect(link.getAttribute("href")).toBe("https://www.iros.go.kr");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("세션을 전혀 안 거쳤으면(results 0건) 홈으로 리다이렉트하고 마스코트를 렌더하지 않는다", () => {
    mockResults = [];
    const { container } = render(<ResultPage />);
    expect(replace).toHaveBeenCalledWith("/");
    expect(container.querySelector("[data-expression]")).toBeNull();
  });

  it("결과가 아직 다 안 채워졌어도(일부만 도착) 홈으로 튕기지 않고 있는 결과를 렌더한다", () => {
    // /session이 마지막 addResult 직후 push("/result")를 하는 흐름에서 /result가
    // 마운트되는 찰나 Context가 마지막 결과를 아직 반영 못 했을 수 있다. 예전엔
    // 이때 홈으로 하드 리다이렉트돼 복구가 안 됐다. 이제는 렌더하고 리렌더로 채운다.
    mockResults = completeResults().slice(0, 2);
    aggregate.mockReturnValue({ average: 100, grade: "safe" });

    render(<ResultPage />);
    expect(replace).not.toHaveBeenCalledWith("/");
    expect(screen.getByRole("heading", { name: /결과/ })).toBeDefined();
    expect(screen.getByText(/종합 정답률/)).toBeDefined();
  });

  it("reviewItems가 있으면 O/X 표(table)가 렌더되고 항목 라벨이 노출된다", () => {
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === 0
        ? {
            reviewItems: [
              { label: "1번 카드", userVerdict: "정상", correctVerdict: "사기", isCorrect: false },
              { label: "2번 카드", userVerdict: "사기", correctVerdict: "사기", isCorrect: true },
            ],
          }
        : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 75, grade: "caution" });

    const { container } = render(<ResultPage />);
    expect(screen.getByText("1번 카드")).toBeDefined();
    expect(screen.getByText("2번 카드")).toBeDefined();
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("missedSignals가 있으면 '놓친 위험 신호' 목록이 렌더되고 제목만 볼드다", () => {
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === 0
        ? {
            isCorrect: false,
            missedSignals: [
              {
                title: "선입금 요구",
                description: "선입금은 위험 신호입니다.",
                source: "경찰청",
              },
            ],
          }
        : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 60, grade: "caution" });

    render(<ResultPage />);
    const heading = screen.getByText("놓친 위험 신호 🚩");
    expect(screen.getByText("(출처: 경찰청)")).toBeDefined();

    const list = heading.nextElementSibling!; // MissedSignalList의 <ul>
    const li = list.querySelector("li")!;
    const strongs = li.querySelectorAll("strong");
    expect(strongs).toHaveLength(1);
    expect(strongs[0].textContent).toBe("선입금 요구");
    expect(li.textContent).toContain("선입금은 위험 신호입니다.");
  });

  it("놓친 위험 신호의 {{term:...}} 마커가 결과 화면에 리터럴로 새지 않는다", () => {
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === 0
        ? {
            isCorrect: false,
            missedSignals: [
              {
                title:
                  "{{term:신탁등기|신탁 등기}} 발견 — 신탁회사({{term:수탁자}}) 동의 없이는 계약 권한이 없을 수 있음",
              },
            ],
          }
        : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 60, grade: "caution" });

    const { container } = render(<ResultPage />);
    expect(container.textContent).not.toContain("{{term:");
    expect(container.textContent).toContain("신탁 등기");
  });

  it("단일 판정 오답 결과의 detail은 표 아래 문단으로 렌더된다", () => {
    const overrides = EXPERIENCE_MODULES.map((_, i) =>
      i === 0
        ? {
            isCorrect: false,
            reviewItems: [
              {
                label: "이 전화 대응",
                userVerdict: "정보를 알려준다",
                correctVerdict: "전화를 끊는다",
                isCorrect: false,
                detail: "낯선 연락처의 개인정보 요청에는 응하지 않아야 합니다.",
              },
            ],
          }
        : {}
    );
    mockResults = completeResults(overrides);
    aggregate.mockReturnValue({ average: 60, grade: "caution" });

    render(<ResultPage />);
    expect(
      screen.getByText("낯선 연락처의 개인정보 요청에는 응하지 않아야 합니다.")
    ).toBeDefined();
  });

  it("reviewItems/missedSignals가 없는 결과는 추가 블록 없이 기존대로 렌더된다", () => {
    mockResults = completeResults();
    aggregate.mockReturnValue({ average: 100, grade: "safe" });

    const { container } = render(<ResultPage />);
    expect(container.querySelector("table")).toBeNull();
    expect(screen.queryByText("놓친 위험 신호 🚩")).toBeNull();
  });
});
