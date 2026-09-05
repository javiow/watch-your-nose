import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ModuleResult } from "@/types/experience";
import { ScoreBarChart } from "./ScoreBarChart";
import { EXPERIENCE_TYPE_LABELS } from "@/data/experience-types";
import { EXPERIENCE_FORMAT } from "@/data/experience-format";

const makeResult = (o: Partial<ModuleResult>): ModuleResult => ({
  typeId: "voice-phishing",
  contentId: "c1",
  score: 0,
  grade: "danger",
  userChoice: "a",
  correctChoice: "b",
  isCorrect: false,
  explanation: "",
  ...o,
});

describe("ScoreBarChart", () => {
  it("결과마다 유형 라벨과 learningPhrase가 있는 행을 렌더한다", () => {
    const results = [
      makeResult({ typeId: "voice-phishing", score: 100, grade: "safe" }),
      makeResult({ typeId: "jeonse", score: 40, grade: "danger" }),
    ];
    render(<ScoreBarChart results={results} />);
    expect(screen.getByText(EXPERIENCE_TYPE_LABELS["voice-phishing"])).toBeDefined();
    expect(screen.getByText(EXPERIENCE_FORMAT["voice-phishing"].learningPhrase)).toBeDefined();
    expect(screen.getByText(EXPERIENCE_TYPE_LABELS["jeonse"])).toBeDefined();
  });

  it("막대 채움 width는 점수 퍼센트와 일치한다", () => {
    const { container } = render(
      <ScoreBarChart results={[makeResult({ score: 100, grade: "safe" })]} />
    );
    const fill = container.querySelector("[data-bar-fill]") as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("점수에 따라 행의 data-grade가 정해진다", () => {
    const { container } = render(
      <ScoreBarChart
        results={[
          makeResult({ typeId: "voice-phishing", score: 92 }),
          makeResult({ typeId: "jeonse", score: 30 }),
        ]}
      />
    );
    expect(container.querySelector('[data-grade="safe"]')).not.toBeNull();
    expect(container.querySelector('[data-grade="danger"]')).not.toBeNull();
  });
});
