"use client";

import { useRef, useState } from "react";
import type {
  CaseFinalDecision,
  CaseInvestigation,
  CaseInvestigationContent,
  ModuleResult,
} from "@/types/experience";
import {
  computeCaseInvestigationScore,
  computeGrade,
  getBestEndingOption,
  type CaseInvestigationScoreBreakdown,
} from "@/lib/scoring";

type Phase = "briefing" | "investigating" | "decision";

interface CaseInvestigationExperienceProps {
  content: CaseInvestigationContent;
  onComplete: (result: ModuleResult) => void;
}

const DECISION_LABELS: Record<CaseFinalDecision, string> = {
  SAFE_TO_PROCEED: "계약 진행 가능",
  NEED_MORE_VERIFICATION: "추가 확인 필요",
  STOP_CONTRACT: "계약 중단",
};

const primaryButtonClass =
  "min-h-11 rounded-xl bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-subtle";
const outlineButtonClass =
  "min-h-11 rounded-xl border border-border bg-surface px-6 text-sm font-medium text-muted transition-colors hover:border-accent disabled:cursor-not-allowed";

function isUnlocked(
  inv: CaseInvestigation,
  registeredEvidence: ReadonlySet<string>,
  completedInvestigationIds: ReadonlySet<string>
): boolean {
  if (!inv.unlockCondition) return true;
  if (inv.unlockCondition.kind === "evidence") {
    return registeredEvidence.has(inv.unlockCondition.pattern);
  }
  return completedInvestigationIds.has(inv.unlockCondition.investigationId);
}

function buildExplanation(
  content: CaseInvestigationContent,
  breakdown: CaseInvestigationScoreBreakdown,
  bestOptionComment: string
): string {
  let explanation = content.hiddenTruth.explanation;

  if (breakdown.missedRiskPatterns.length > 0) {
    const missedDescriptions = breakdown.missedRiskPatterns
      .map(
        (pattern) =>
          content.evidenceDefinitions.find((def) => def.pattern === pattern)?.description
      )
      .filter((description): description is string => Boolean(description));

    if (missedDescriptions.length > 0) {
      explanation += ` 놓친 위험 신호: ${missedDescriptions.join(", ")}.`;
    }
  }

  return `${explanation} ${bestOptionComment}`;
}

export function CaseInvestigationExperience({
  content,
  onComplete,
}: CaseInvestigationExperienceProps) {
  const [phase, setPhase] = useState<Phase>("briefing");
  const [points, setPoints] = useState(content.initialPoints);
  const [completedInvestigationIds, setCompletedInvestigationIds] = useState<Set<string>>(
    new Set()
  );
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const [registeredEvidence, setRegisteredEvidence] = useState<Set<string>>(new Set());
  const [triggeredStatementIds, setTriggeredStatementIds] = useState<Set<string>>(new Set());
  const [decisionLocked, setDecisionLocked] = useState(false);
  const lockedRef = useRef(false);

  const handleStartInvestigation = (inv: CaseInvestigation) => {
    setPoints((prev) => prev - inv.cost);
    setCompletedInvestigationIds((prev) => new Set(prev).add(inv.investigationId));
    setOpenDocumentId(inv.documentId);
  };

  const handleRegisterEvidence = (pattern: string) => {
    setRegisteredEvidence((prev) => {
      if (prev.has(pattern)) return prev;
      return new Set(prev).add(pattern);
    });
  };

  const handleAskQuestion = (statementId: string) => {
    setTriggeredStatementIds((prev) => {
      if (prev.has(statementId)) return prev;
      return new Set(prev).add(statementId);
    });
  };

  const handleDecision = (decision: CaseFinalDecision) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setDecisionLocked(true);

    const breakdown = computeCaseInvestigationScore(content, {
      registeredEvidence,
      completedInvestigationIds,
      triggeredStatementIds,
      finalDecision: decision,
    });
    const bestOption = getBestEndingOption(content);
    const isCorrect = decision === bestOption.decision;
    const mistakeTag = isCorrect
      ? undefined
      : bestOption.decision === "SAFE_TO_PROCEED"
        ? "false-alarmed-safe-case"
        : "missed-realestate-investigation-signal";

    onComplete({
      typeId: "case-investigation",
      contentId: content.caseId,
      score: breakdown.total,
      grade: computeGrade(breakdown.total),
      userChoice: DECISION_LABELS[decision],
      correctChoice: DECISION_LABELS[bestOption.decision],
      isCorrect,
      explanation: buildExplanation(content, breakdown, bestOption.comment),
      mistakeTag,
    });
  };

  if (phase === "briefing") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm font-medium text-muted">조사 예산 {content.initialPoints}P</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            {content.scenario.propertyLocation}
          </h2>
          <p className="mt-1 text-sm text-subtle">{content.scenario.propertyPriceDescription}</p>
          <div className="mt-4 rounded-xl border border-border bg-surface-muted p-4">
            <p className="text-sm font-medium text-muted">{content.scenario.speakerLabel}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              &ldquo;{content.scenario.brokerLine}&rdquo;
            </p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {content.scenario.description}
          </p>
          <p className="mt-2 text-sm font-medium text-muted">{content.scenario.goal}</p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setPhase("investigating")}
            className={primaryButtonClass}
          >
            조사 시작
          </button>
        </div>
      </div>
    );
  }

  if (phase === "investigating") {
    const visibleInvestigations = content.investigations.filter(
      (inv) =>
        !inv.hiddenUntilUnlocked || isUnlocked(inv, registeredEvidence, completedInvestigationIds)
    );
    const openDocument = content.documents.find((doc) => doc.documentId === openDocumentId);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <span className="text-sm text-subtle">남은 포인트 {points}P</span>
          <span className="text-sm text-subtle">등록된 증거 {registeredEvidence.size}건</span>
        </div>

        {!openDocument && (
          <div className="space-y-3">
            {visibleInvestigations.map((inv) => {
              const unlocked = isUnlocked(inv, registeredEvidence, completedInvestigationIds);
              const completed = completedInvestigationIds.has(inv.investigationId);
              const disabled = completed || !unlocked || points < inv.cost;
              return (
                <button
                  key={inv.investigationId}
                  type="button"
                  onClick={() => handleStartInvestigation(inv)}
                  disabled={disabled}
                  className={`w-full rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                    completed ? "border-accent bg-accent-soft" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-muted">{inv.name}</span>
                  <span className="ml-2 text-sm text-subtle">{inv.cost}P</span>
                </button>
              );
            })}
          </div>
        )}

        {openDocument && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-sm font-medium text-muted">{openDocument.title}</p>
            <div className="mt-3 space-y-3">
              {openDocument.blocks.map((block) => {
                if (block.evidencePattern === null) {
                  return (
                    <p key={block.blockId} className="text-sm leading-relaxed text-muted">
                      {block.text}
                    </p>
                  );
                }

                const registered = registeredEvidence.has(block.evidencePattern);
                const definition = content.evidenceDefinitions.find(
                  (def) => def.pattern === block.evidencePattern
                );

                return (
                  <div key={block.blockId}>
                    <button
                      type="button"
                      onClick={() => handleRegisterEvidence(block.evidencePattern as string)}
                      className={`w-full rounded-xl border p-3 text-left text-sm leading-relaxed transition-colors ${
                        registered
                          ? "border-accent bg-accent-soft text-muted"
                          : "border-border bg-surface text-muted hover:border-accent"
                      }`}
                    >
                      {block.text}
                    </button>
                    {registered && definition && (
                      <p className="mt-1 text-sm text-subtle">확인: {definition.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-start">
              <button
                type="button"
                onClick={() => setOpenDocumentId(null)}
                className={outlineButtonClass}
              >
                목록으로
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm font-medium text-muted">{content.npc.displayName}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {content.npc.questions.map((question) => (
              <button
                key={question.questionId}
                type="button"
                onClick={() => handleAskQuestion(question.statementId)}
                disabled={triggeredStatementIds.has(question.statementId)}
                className={outlineButtonClass}
              >
                {question.prompt}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {content.npc.statements
              .filter((statement) => triggeredStatementIds.has(statement.statementId))
              .map((statement) => (
                <p key={statement.statementId} className="text-sm leading-relaxed text-muted">
                  {statement.text}
                </p>
              ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setPhase("decision")}
            className={primaryButtonClass}
          >
            판단하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-sm font-medium text-muted">이제 판단을 내려주세요.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          onClick={() => handleDecision("SAFE_TO_PROCEED")}
          disabled={decisionLocked}
          className={outlineButtonClass}
        >
          계약을 진행한다
        </button>
        <button
          type="button"
          onClick={() => handleDecision("NEED_MORE_VERIFICATION")}
          disabled={decisionLocked}
          className={outlineButtonClass}
        >
          추가로 확인한 뒤 결정한다
        </button>
        <button
          type="button"
          onClick={() => handleDecision("STOP_CONTRACT")}
          disabled={decisionLocked}
          className={outlineButtonClass}
        >
          계약을 중단한다
        </button>
      </div>
    </div>
  );
}
