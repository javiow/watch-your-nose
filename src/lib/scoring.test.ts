import { describe, expect, it } from "vitest";
import type { ModuleResult } from "@/types/experience";
import { GRADE_LABELS, aggregateResults, computeGrade } from "./scoring";

describe("GRADE_LABELS", () => {
  it("각 등급에 대한 한글 라벨을 제공한다", () => {
    expect(GRADE_LABELS.safe).toBe("안전");
    expect(GRADE_LABELS.caution).toBe("주의");
    expect(GRADE_LABELS.danger).toBe("위험");
  });
});

describe("computeGrade", () => {
  it("80% 이상이면 safe", () => {
    expect(computeGrade(80)).toBe("safe");
    expect(computeGrade(100)).toBe("safe");
  });

  it("50~79%면 caution", () => {
    expect(computeGrade(50)).toBe("caution");
    expect(computeGrade(79)).toBe("caution");
  });

  it("50% 미만이면 danger", () => {
    expect(computeGrade(49)).toBe("danger");
    expect(computeGrade(0)).toBe("danger");
  });
});

describe("aggregateResults", () => {
  const makeResult = (overrides: Partial<ModuleResult>): ModuleResult => ({
    typeId: "voice-phishing",
    contentId: "c1",
    score: 100,
    grade: "safe",
    userChoice: "a",
    correctChoice: "a",
    isCorrect: true,
    explanation: "",
    ...overrides,
  });

  it("점수 평균과 종합 등급을 계산한다", () => {
    const results = [
      makeResult({ score: 100 }),
      makeResult({ score: 60 }),
      makeResult({ score: 20 }),
    ];
    const { average, grade } = aggregateResults(results);
    expect(average).toBeCloseTo(60);
    expect(grade).toBe("caution");
  });

  it("결과가 없으면 평균 0, danger 등급을 반환한다", () => {
    const { average, grade } = aggregateResults([]);
    expect(average).toBe(0);
    expect(grade).toBe("danger");
  });
});
