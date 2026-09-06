"use client";

import { useRef, useState } from "react";
import type {
  FraudJudgmentAnswer,
  FraudJudgmentCard,
  MissedSignal,
  ModuleResult,
  ReviewItem,
} from "@/types/experience";
import { computeGrade } from "@/lib/scoring";
import { NextStepButton } from "@/components/ui/NextStepButton";
import { GlossaryTermText } from "@/components/ui/GlossaryTermText";
import { IntroDialog } from "@/components/ui/IntroDialog";
import { EXPERIENCE_FORMAT } from "@/data/experience-format";
import { EXPERIENCE_INTRO } from "@/data/experience-intro";

interface FraudJudgmentExperienceProps {
  content: FraudJudgmentCard[];
  onComplete: (result: ModuleResult) => void;
}

function buildExplanation(isCorrect: boolean): string {
  return isCorrect
    ? "제시된 사기 판별 카드를 모두 정확히 판정했습니다."
    : "일부 카드를 잘못 판정했습니다. 놓친 위험 신호를 확인하세요.";
}

function buildReviewItems(
  content: FraudJudgmentCard[],
  answers: Record<number, FraudJudgmentAnswer>,
): ReviewItem[] {
  return content.map((card, i) => ({
    label: `${i + 1}번 — ${card.title}`,
    userVerdict: answers[i] === "fraud" ? "사기" : "정상",
    correctVerdict: card.answer === "fraud" ? "사기" : "정상",
    isCorrect: answers[i] === card.answer,
  }));
}

function buildMissedSignals(
  content: FraudJudgmentCard[],
  answers: Record<number, FraudJudgmentAnswer>,
): MissedSignal[] {
  return content
    .filter((card, i) => answers[i] !== card.answer)
    .map((card) => ({
      title: card.title,
      description: card.explanation,
      source: card.source,
    }));
}

function buildMistakeTag(content: FraudJudgmentCard[], answers: Record<number, FraudJudgmentAnswer>): string {
  const missedScam = content.some((card, i) => card.answer === "fraud" && answers[i] !== card.answer);
  return missedScam ? "missed-scam-signal" : "false-alarmed-safe-case";
}

export function FraudJudgmentExperience({ content, onComplete }: FraudJudgmentExperienceProps) {
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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
      explanation: buildExplanation(isCorrect),
      mistakeTag: isCorrect ? undefined : buildMistakeTag(content, next),
      reviewItems: buildReviewItems(content, next),
      missedSignals: isCorrect ? undefined : buildMissedSignals(content, next),
    });
  };

  const handleNextStep = () => {
    if (!pendingResult || nextStepSubmittedRef.current) return;
    nextStepSubmittedRef.current = true;
    onComplete(pendingResult);
  };

  if (!started) {
    return (
      <IntroDialog
        mode="gate"
        format={EXPERIENCE_FORMAT["fraud-judgment"]}
        intro={EXPERIENCE_INTRO["fraud-judgment"]}
        confirmLabel="판정 시작"
        onConfirm={() => setStarted(true)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-subtle">
          {currentIndex + 1} / {content.length}
        </p>
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
          format={EXPERIENCE_FORMAT["fraud-judgment"]}
          intro={EXPERIENCE_INTRO["fraud-judgment"]}
          confirmLabel="판정 시작"
          onDismiss={() => setShowHelp(false)}
          onConfirm={() => setShowHelp(false)}
        />
      )}

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-medium text-muted">{currentCard.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          <GlossaryTermText text={currentCard.content} />
        </p>
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

      {pendingResult && (
        <NextStepButton onClick={handleNextStep} message="모든 카드 판정을 완료했습니다." />
      )}
    </div>
  );
}
