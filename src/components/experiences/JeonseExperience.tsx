"use client";

import { useRef, useState } from "react";
import type {
  JeonseHouse,
  MissedSignal,
  ModuleResult,
  ReviewItem,
} from "@/types/experience";
import { computeGrade } from "@/lib/scoring";
import { NextStepButton } from "@/components/ui/NextStepButton";
import { IntroDialog } from "@/components/ui/IntroDialog";
import { EXPERIENCE_FORMAT } from "@/data/experience-format";
import { EXPERIENCE_INTRO } from "@/data/experience-intro";
import { MapBoard } from "./jeonse/MapBoard";

interface JeonseExperienceProps {
  content: JeonseHouse[];
  onComplete: (result: ModuleResult) => void;
}

// 매물 수 = 난이도 신호. 쉬움(3채)=힌트3, 중간(4채)=2, 어려움(5채)=1.
const HINT_BUDGET_BY_LISTING_COUNT: Record<number, number> = { 3: 3, 4: 2, 5: 1 };

function buildExplanation(isCorrect: boolean): string {
  return isCorrect
    ? "제시된 매물의 위험 신호를 모두 정확히 판정했습니다."
    : "일부 매물을 잘못 판정했습니다. 놓친 위험 신호를 확인하세요.";
}

function verdictLabel(risky: boolean): string {
  return risky ? "O (위험 있음)" : "X (위험 없음)";
}

function buildReviewItems(
  content: JeonseHouse[],
  answers: Record<number, boolean>
): ReviewItem[] {
  return content.map((house, i) => ({
    label: house.short,
    userVerdict: verdictLabel(answers[i]),
    correctVerdict: verdictLabel(house.risky),
    isCorrect: answers[i] === house.risky,
  }));
}

function buildMissedSignals(
  content: JeonseHouse[],
  answers: Record<number, boolean>
): MissedSignal[] {
  return content
    .filter((house, i) => answers[i] !== house.risky)
    .map((house) => ({ title: house.short, description: house.reason }));
}

export function JeonseExperience({ content, onComplete }: JeonseExperienceProps) {
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hintedIndexes, setHintedIndexes] = useState<Set<number>>(() => new Set());
  const [pendingResult, setPendingResult] = useState<ModuleResult | null>(null);
  const nextStepSubmittedRef = useRef(false);

  const hintBudget = HINT_BUDGET_BY_LISTING_COUNT[content.length] ?? 1;
  const hintsRemaining = hintBudget - hintedIndexes.size;

  const handleUseHint = (index: number) => {
    setHintedIndexes((prev) => {
      if (prev.has(index) || prev.size >= hintBudget) return prev;
      return new Set(prev).add(index);
    });
  };

  const handleAnswer = (index: number, risky: boolean) => {
    if (isTransitioning || answers[index] !== undefined) return;

    const next = { ...answers, [index]: risky };
    setAnswers(next);

    if (Object.keys(next).length === content.length) {
      setIsTransitioning(true);
      const correctCount = content.filter((house, i) => next[i] === house.risky).length;
      const score = (correctCount / content.length) * 100;
      const grade = computeGrade(score);
      const isCorrect = grade === "safe";

      setPendingResult({
        typeId: "jeonse",
        contentId: content
          .map((house) => house.id)
          .sort()
          .join("-"),
        score,
        grade,
        userChoice: `${content.length}채 중 ${correctCount}채 정답 판정`,
        correctChoice: `${content.length}채 모두 정확히 판정`,
        isCorrect,
        explanation: buildExplanation(isCorrect),
        mistakeTag: isCorrect ? undefined : "missed-lease-fraud-signal",
        reviewItems: buildReviewItems(content, next),
        missedSignals: isCorrect ? undefined : buildMissedSignals(content, next),
      });
    }
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
        format={EXPERIENCE_FORMAT.jeonse}
        intro={EXPERIENCE_INTRO.jeonse}
        confirmLabel="점검 시작"
        onConfirm={() => setStarted(true)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
          format={EXPERIENCE_FORMAT.jeonse}
          intro={EXPERIENCE_INTRO.jeonse}
          confirmLabel="점검 시작"
          onDismiss={() => setShowHelp(false)}
          onConfirm={() => setShowHelp(false)}
        />
      )}

      <MapBoard
        houses={content}
        answers={answers}
        onAnswer={handleAnswer}
        hintedIndexes={hintedIndexes}
        hintsRemaining={hintsRemaining}
        hintBudget={hintBudget}
        onUseHint={handleUseHint}
      />

      {pendingResult && (
        <NextStepButton onClick={handleNextStep} message="모든 매물 판정을 완료했습니다." />
      )}
    </div>
  );
}
