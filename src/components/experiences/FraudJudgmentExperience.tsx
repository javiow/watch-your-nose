"use client";

import { useRef, useState } from "react";
import type { FraudJudgmentAnswer, FraudJudgmentCard, ModuleResult } from "@/types/experience";
import { computeGrade } from "@/lib/scoring";
import { NextStepButton } from "@/components/ui/NextStepButton";

interface FraudJudgmentExperienceProps {
  content: FraudJudgmentCard[];
  onComplete: (result: ModuleResult) => void;
}

function buildExplanation(content: FraudJudgmentCard[], answers: Record<number, FraudJudgmentAnswer>, isCorrect: boolean): string {
  if (isCorrect) {
    return `제시된 사기 판별 카드 ${content.length}장 모두 정확히 판정했습니다.`;
  }
  const missed = content
    .filter((card, i) => answers[i] !== card.answer)
    .slice(0, 3)
    .map((card) => `${card.title}: ${card.explanation} (출처: ${card.source})`);
  return `놓친 위험 신호가 있습니다 — ${missed.join("; ")}`;
}

function buildMistakeTag(content: FraudJudgmentCard[], answers: Record<number, FraudJudgmentAnswer>): string {
  const missedScam = content.some((card, i) => card.answer === "fraud" && answers[i] !== card.answer);
  return missedScam ? "missed-scam-signal" : "false-alarmed-safe-case";
}

export function FraudJudgmentExperience({ content, onComplete }: FraudJudgmentExperienceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, FraudJudgmentAnswer>>({});
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);
  const [pendingResult, setPendingResult] = useState<ModuleResult | null>(null);
  const nextStepSubmittedRef = useRef(false);

  const currentCard = content[currentIndex];

  const handleAnswer = (userAnswer: FraudJudgmentAnswer) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);

    const next = { ...answers, [currentIndex]: userAnswer };
    setAnswers(next);

    if (currentIndex + 1 < content.length) {
      setCurrentIndex(currentIndex + 1);
      lockedRef.current = false;
      setLocked(false);
      return;
    }

    const correctCount = content.filter((card, i) => next[i] === card.answer).length;
    const score = (correctCount / content.length) * 100;
    const grade = computeGrade(score);
    const isCorrect = grade === "safe";

    setPendingResult({
      typeId: "fraud-judgment",
      contentId: content
        .map((card) => card.id)
        .sort()
        .join("-"),
      score,
      grade,
      userChoice: `${content.length}장 중 ${correctCount}장 정답 판정`,
      correctChoice: `${content.length}장 모두 정확히 판정`,
      isCorrect,
      explanation: buildExplanation(content, next, isCorrect),
      mistakeTag: isCorrect ? undefined : buildMistakeTag(content, next),
    });
  };

  const handleNextStep = () => {
    if (!pendingResult || nextStepSubmittedRef.current) return;
    nextStepSubmittedRef.current = true;
    onComplete(pendingResult);
  };

  return (
    <div className="space-y-6">
      <p className="text-xs font-medium text-subtle">
        {currentIndex + 1} / {content.length}
      </p>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-medium text-muted">{currentCard.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{currentCard.content}</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          onClick={() => handleAnswer("fraud")}
          disabled={locked}
          className="min-h-11 flex-1 rounded-xl bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-subtle"
        >
          사기예요
        </button>
        <button
          type="button"
          onClick={() => handleAnswer("safe")}
          disabled={locked}
          className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-6 text-sm font-medium text-muted transition-colors hover:border-accent disabled:cursor-not-allowed"
        >
          정상이에요
        </button>
      </div>

      {pendingResult && <NextStepButton onClick={handleNextStep} />}
    </div>
  );
}
