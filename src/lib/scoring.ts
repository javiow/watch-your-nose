import type { ChoiceRisk, Grade, ModuleResult } from "@/types/experience";

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

export const VOICE_PHISHING_RISK_PENALTY: Record<ChoiceRisk, number> = {
  safe: 0,
  caution: 20,
  danger: 100,
};

export function computeVoicePhishingScore(pathRisks: ChoiceRisk[]): {
  score: number;
  isCorrect: boolean;
} {
  const totalPenalty = pathRisks.reduce(
    (sum, risk) => sum + VOICE_PHISHING_RISK_PENALTY[risk],
    0
  );
  const score = Math.max(0, 100 - totalPenalty);
  const finalRisk = pathRisks[pathRisks.length - 1];
  return { score, isCorrect: finalRisk === "safe" };
}
