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
import { MAX_NPC_QUESTIONS, isMeaningfulQuestion } from "@/lib/npc-chat";
import { classifyQuestion } from "@/lib/npc-chat-client";
import { NextStepButton } from "@/components/ui/NextStepButton";

interface ChatEntry {
  key: string;
  userText: string;
  npcText: string;
  statementId: string | null; // 매칭 실패(fallback)면 null — 채점에 반영하지 않는다.
}

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
  const [chatLog, setChatLog] = useState<ChatEntry[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [decisionLocked, setDecisionLocked] = useState(false);
  const [pendingResult, setPendingResult] = useState<ModuleResult | null>(null);
  const lockedRef = useRef(false);
  const nextStepSubmittedRef = useRef(false);

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

  const handleSubmitQuestion = async (rawInput: string) => {
    if (chatLog.length >= MAX_NPC_QUESTIONS) {
      setInputError("질문 횟수를 모두 사용했어요.");
      return;
    }
    const trimmed = rawInput.trim();
    if (!isMeaningfulQuestion(trimmed)) {
      setInputError("조금 더 구체적으로 물어봐 주세요.");
      return;
    }
    setInputError(null);
    setIsClassifying(true);
    const matched = await classifyQuestion(content.npc, trimmed);
    setChatLog((prev) => [
      ...prev,
      {
        key: `entry-${prev.length}`,
        userText: trimmed,
        npcText: matched ? matched.text : content.npc.fallbackLine,
        statementId: matched ? matched.statementId : null,
      },
    ]);
    setQuestionInput("");
    setIsClassifying(false);
  };

  const handleDecision = (decision: CaseFinalDecision) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setDecisionLocked(true);

    const triggeredStatementIds = new Set(
      chatLog.flatMap((entry) => (entry.statementId ? [entry.statementId] : []))
    );
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

    setPendingResult({
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

  const handleNextStep = () => {
    if (!pendingResult || nextStepSubmittedRef.current) return;
    nextStepSubmittedRef.current = true;
    onComplete(pendingResult);
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
    const questionLimitReached = chatLog.length >= MAX_NPC_QUESTIONS;

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
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              {content.npc.displayName.slice(-1)}
            </span>
            <p className="text-sm font-medium text-muted">{content.npc.displayName}</p>
            <span className="ml-auto text-xs text-subtle">
              질문 {chatLog.length}/{MAX_NPC_QUESTIONS}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex justify-start">
              <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-muted px-3 py-2 text-sm leading-relaxed text-muted">
                {content.npc.greeting}
              </p>
            </div>
            {chatLog.map((entry) => (
              <div key={entry.key} className="space-y-2">
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm leading-relaxed text-white">
                    {entry.userText}
                  </p>
                </div>
                <div className="flex justify-start">
                  <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-muted px-3 py-2 text-sm leading-relaxed text-muted">
                    {entry.npcText}
                  </p>
                </div>
              </div>
            ))}
            {isClassifying && (
              <div className="flex justify-start">
                <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-muted px-3 py-2 text-sm text-subtle">
                  ...
                </p>
              </div>
            )}
          </div>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmitQuestion(questionInput);
            }}
          >
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="궁금한 점을 자유롭게 물어보세요"
              disabled={isClassifying || questionLimitReached}
              className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-muted placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isClassifying || questionLimitReached}
              className={outlineButtonClass}
            >
              물어보기
            </button>
          </form>
          {questionLimitReached ? (
            <p className="mt-2 text-sm text-subtle">질문 횟수를 모두 사용했어요.</p>
          ) : (
            inputError && <p className="mt-2 text-sm text-subtle">{inputError}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {content.npc.questions.map((question) => (
              <button
                key={question.questionId}
                type="button"
                disabled={isClassifying || questionLimitReached}
                onClick={() => void handleSubmitQuestion(question.prompt)}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-subtle transition-colors hover:border-accent hover:text-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {question.prompt}
              </button>
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

      {pendingResult && (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm font-medium text-muted">판단을 등록했습니다.</p>
          <NextStepButton onClick={handleNextStep} />
        </div>
      )}
    </div>
  );
}
