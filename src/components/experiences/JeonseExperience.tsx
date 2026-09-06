"use client";

import { useRef, useState } from "react";
import type { JeonseHouse, ModuleResult } from "@/types/experience";
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

function buildExplanation(
  content: JeonseHouse[],
  answers: Record<number, boolean>,
  isCorrect: boolean
): string {
  if (isCorrect) {
    return "제시된 매물 모두 위험 신호를 정확히 판정했습니다.";
  }
  const missed = content
    .filter((house, i) => answers[i] !== house.risky)
    .slice(0, 3)
    .map((house) => `${house.short}: ${house.reason}`);
  return `놓친 위험 신호가 있습니다 — **${missed.join("; ")}**`;
}

export function JeonseExperience({ content, onComplete }: JeonseExperienceProps) {
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hintUsedIndex, setHintUsedIndex] = useState<number | null>(null);
  const [pendingResult, setPendingResult] = useState<ModuleResult | null>(null);
  const nextStepSubmittedRef = useRef(false);

  const handleUseHint = (index: number) => {
    setHintUsedIndex((prev) => (prev === null ? index : prev));
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
        explanation: buildExplanation(content, next, isCorrect),
        mistakeTag: isCorrect ? undefined : "missed-lease-fraud-signal",
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
        hintUsedIndex={hintUsedIndex}
        onUseHint={handleUseHint}
      />

      {pendingResult && (
        <NextStepButton onClick={handleNextStep} message="모든 매물 판정을 완료했습니다." />
      )}
    </div>
  );
}
