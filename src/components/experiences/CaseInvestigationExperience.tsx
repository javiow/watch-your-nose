"use client";

import { useRef, useState } from "react";
import type {
  CaseFinalDecision,
  CaseInvestigation,
  CaseInvestigationContent,
  MissedSignal,
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
import { GlossaryTermText } from "@/components/ui/GlossaryTermText";
import { IntroDialog } from "@/components/ui/IntroDialog";
import { Prose } from "@/components/ui/Prose";
import { EXPERIENCE_FORMAT } from "@/data/experience-format";
import { EXPERIENCE_INTRO } from "@/data/experience-intro";

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
  bestOptionComment: string
): string {
  return `${content.hiddenTruth.explanation} ${bestOptionComment}`;
}

function buildMissedSignals(
  content: CaseInvestigationContent,
  breakdown: CaseInvestigationScoreBreakdown
): MissedSignal[] {
  return breakdown.missedRiskPatterns
    .map(
      (pattern) =>
        content.evidenceDefinitions.find((def) => def.pattern === pattern)?.description
    )
    .filter((description): description is string => Boolean(description))
    .map((description) => ({ title: description }));
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
  const [selectedDecision, setSelectedDecision] = useState<CaseFinalDecision | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [pendingResult, setPendingResult] = useState<ModuleResult | null>(null);
  // "다음으로 넘어가기"를 누르기 전까지는 잘못 누른 판단을 다시 골라 바꿀 수 있다.
  // 확정(다음으로 넘어가기 클릭) 이후에만 판단 버튼을 잠근다.
  const [confirmed, setConfirmed] = useState(false);
  const nextStepSubmittedRef = useRef(false);
  // investigating 단계를 한 번이라도 지난 뒤에는 briefing으로 돌아와도 게이트 모달을
  // 다시 띄우지 않고 "조사로 돌아가기" 버튼만 보여준다.
  const visitedInvestigatingRef = useRef(false);

  const goToInvestigating = () => {
    visitedInvestigatingRef.current = true;
    setPhase("investigating");
  };

  const handleBackToInvestigating = () => {
    // 판단 단계를 벗어나면 낡은 state로 계산된 결과가 제출되지 않도록 초기화한다.
    setSelectedDecision(null);
    setPendingResult(null);
    goToInvestigating();
  };

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
      setInputError("질문 횟수를 모두 사용했어요. 지금까지 확인한 내용과 서류를 바탕으로 판단해보세요.");
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
    if (confirmed) return;
    setSelectedDecision(decision);

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
      explanation: buildExplanation(content, bestOption.comment),
      mistakeTag,
      reviewItems: [
        {
          label: "이 계약 판단",
          userVerdict: DECISION_LABELS[decision],
          correctVerdict: DECISION_LABELS[bestOption.decision],
          isCorrect,
          detail: isCorrect ? undefined : content.hiddenTruth.explanation,
        },
      ],
      missedSignals: isCorrect ? undefined : buildMissedSignals(content, breakdown),
    });
  };

  const handleNextStep = () => {
    if (!pendingResult || nextStepSubmittedRef.current) return;
    nextStepSubmittedRef.current = true;
    setConfirmed(true);
    onComplete(pendingResult);
  };

  if (phase === "briefing") {
    return (
      <>
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
            <Prose className="mt-4" text={content.scenario.description} size="sm" />
            <p className="mt-2 text-sm font-medium text-muted">{content.scenario.goal}</p>
          </div>
          {visitedInvestigatingRef.current && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={goToInvestigating}
                className={primaryButtonClass}
              >
                조사로 돌아가기
              </button>
            </div>
          )}
        </div>

        {!visitedInvestigatingRef.current && (
          <IntroDialog
            mode="gate"
            format={EXPERIENCE_FORMAT["case-investigation"]}
            intro={EXPERIENCE_INTRO["case-investigation"]}
            confirmLabel="조사 시작"
            onConfirm={goToInvestigating}
          />
        )}
      </>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <span className="text-sm text-subtle">남은 포인트 {points}P</span>
            <span className="text-sm text-subtle">
              조사 {completedInvestigationIds.size}/{visibleInvestigations.length}
            </span>
            <span className="text-sm text-subtle">등록된 증거 {registeredEvidence.size}건</span>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="text-xs font-medium text-subtle underline underline-offset-2 transition-colors hover:text-accent"
          >
            안내 다시 보기
          </button>
        </div>

        {showHelp && (
          <IntroDialog
            mode="help"
            format={EXPERIENCE_FORMAT["case-investigation"]}
            intro={EXPERIENCE_INTRO["case-investigation"]}
            confirmLabel="조사 시작"
            onDismiss={() => setShowHelp(false)}
            onConfirm={() => setShowHelp(false)}
          />
        )}

        {!openDocument && (
          <div className="space-y-3">
            <p className="rounded-xl border border-border bg-surface-muted p-3 text-xs leading-relaxed text-muted">
              예산 안에서 꼭 필요한 조사를 고르세요. 조사를 많이 할수록 단서는 늘지만 남는 예산이
              줄고, 너무 아끼면 핵심 단서를 놓칠 수 있어요.
            </p>
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
                  <span className="mt-1 block text-xs leading-relaxed text-subtle">
                    {inv.purpose}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {openDocument && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-sm font-medium text-muted">{openDocument.title}</p>
            {(() => {
              const openInv = content.investigations.find(
                (inv) => inv.documentId === openDocumentId
              );
              return openInv ? (
                <p className="mt-1 text-xs leading-relaxed text-subtle">{openInv.purpose}</p>
              ) : null;
            })()}
            <div className="mt-3 space-y-3">
              {openDocument.blocks.map((block) => {
                if (block.evidencePattern === null) {
                  return (
                    <p key={block.blockId} className="text-sm leading-relaxed text-muted">
                      <GlossaryTermText text={block.text} />
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
            <p className="mt-2 text-sm text-subtle">질문 횟수를 모두 사용했어요. 지금까지 확인한 내용과 서류를 바탕으로 판단해보세요.</p>
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

        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={() => setPhase("briefing")}
            className={outlineButtonClass}
          >
            이전
          </button>
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
      {!confirmed && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleBackToInvestigating}
            className={outlineButtonClass}
          >
            이전
          </button>
        </div>
      )}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-sm font-medium text-muted">이제 판단을 내려주세요.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        {(
          [
            ["SAFE_TO_PROCEED", "계약을 진행한다"],
            ["NEED_MORE_VERIFICATION", "추가로 확인한 뒤 결정한다"],
            ["STOP_CONTRACT", "계약을 중단한다"],
          ] as const
        ).map(([decision, label]) => (
          <button
            key={decision}
            type="button"
            onClick={() => handleDecision(decision)}
            disabled={confirmed}
            className={
              selectedDecision === decision
                ? primaryButtonClass
                : outlineButtonClass
            }
          >
            {label}
            {selectedDecision === decision && (
              <span className="ml-1" aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>

      {pendingResult && (
        <NextStepButton onClick={handleNextStep} message="판단을 등록했습니다." />
      )}
    </div>
  );
}
