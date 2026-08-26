import type {
  CaseEndingOption,
  CaseFinalDecision,
  CaseInvestigationContent,
  ChoiceRisk,
  Grade,
  ModuleResult,
} from "@/types/experience";

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

export interface CaseInvestigationState {
  registeredEvidence: ReadonlySet<string>;
  completedInvestigationIds: ReadonlySet<string>;
  triggeredStatementIds: ReadonlySet<string>;
  finalDecision: CaseFinalDecision;
}

export interface CaseInvestigationScoreBreakdown {
  riskDiscovery: number;
  evidenceQuality: number;
  contradiction: number;
  efficiency: number;
  finalDecisionScore: number;
  total: number;
  foundRiskPatterns: string[];
  missedRiskPatterns: string[];
}

export function getBestEndingOption(
  content: CaseInvestigationContent
): CaseEndingOption {
  return content.endingOptions.reduce((best, option) =>
    option.score > best.score ? option : best
  );
}

export function computeCaseInvestigationScore(
  content: CaseInvestigationContent,
  state: CaseInvestigationState
): CaseInvestigationScoreBreakdown {
  const { riskPatterns } = content.hiddenTruth;
  const foundRiskPatterns = riskPatterns.filter((pattern) =>
    state.registeredEvidence.has(pattern)
  );
  const missedRiskPatterns = riskPatterns.filter(
    (pattern) => !state.registeredEvidence.has(pattern)
  );
  const riskDiscovery =
    riskPatterns.length === 0
      ? 0
      : Math.round((40 * foundRiskPatterns.length) / riskPatterns.length);

  const totalImportance = content.evidenceDefinitions.reduce(
    (sum, def) => sum + def.importance,
    0
  );
  const gainedImportance = content.evidenceDefinitions
    .filter((def) => state.registeredEvidence.has(def.pattern))
    .reduce((sum, def) => sum + def.importance, 0);
  const evidenceQuality =
    totalImportance === 0
      ? 0
      : Math.round(20 * Math.min(gainedImportance / totalImportance, 1));

  const totalContradictionScore =
    content.contradictions.reduce((sum, c) => sum + c.score, 0) || 1;
  const gainedContradictionScore = content.contradictions
    .filter(
      (c) =>
        state.triggeredStatementIds.has(c.statementId) &&
        state.registeredEvidence.has(c.evidencePattern)
    )
    .reduce((sum, c) => sum + c.score, 0);
  const contradiction = Math.round(
    15 * Math.min(gainedContradictionScore / totalContradictionScore, 1)
  );

  const efficiency =
    state.completedInvestigationIds.size === 0
      ? 0
      : Math.round(
          10 *
            Math.min(
              state.registeredEvidence.size /
                state.completedInvestigationIds.size,
              1
            )
        );

  const finalDecisionScore =
    content.endingOptions.find((o) => o.decision === state.finalDecision)
      ?.score ?? 0;

  const total = Math.min(
    100,
    riskDiscovery + evidenceQuality + contradiction + efficiency + finalDecisionScore
  );

  return {
    riskDiscovery,
    evidenceQuality,
    contradiction,
    efficiency,
    finalDecisionScore,
    total,
    foundRiskPatterns,
    missedRiskPatterns,
  };
}
