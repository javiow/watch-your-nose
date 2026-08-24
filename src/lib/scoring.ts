import type { Grade, ModuleResult } from "@/types/experience";

export const GRADE_THRESHOLDS = {
  safe: 80,
  caution: 50,
} as const;

export const GRADE_LABELS: Record<Grade, string> = {
  safe: "안전",
  caution: "주의",
  danger: "위험",
};

export function computeGrade(scorePercent: number): Grade {
  if (scorePercent >= GRADE_THRESHOLDS.safe) return "safe";
  if (scorePercent >= GRADE_THRESHOLDS.caution) return "caution";
  return "danger";
}

export function aggregateResults(results: ModuleResult[]): {
  average: number;
  grade: Grade;
} {
  if (results.length === 0) {
    return { average: 0, grade: computeGrade(0) };
  }
  const average =
    results.reduce((sum, result) => sum + result.score, 0) / results.length;
  return { average, grade: computeGrade(average) };
}
