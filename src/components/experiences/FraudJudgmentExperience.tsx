"use client";

import { useRef, useState } from "react";
import type { FraudJudgmentAnswer, FraudJudgmentCard, ModuleResult } from "@/types/experience";
import { computeGrade } from "@/lib/scoring";

interface FraudJudgmentExperienceProps {
  content: FraudJudgmentCard;
  onComplete: (result: ModuleResult) => void;
}

export function FraudJudgmentExperience({
  content,
  onComplete,
}: FraudJudgmentExperienceProps) {
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);

  const handleAnswer = (userAnswer: FraudJudgmentAnswer) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);

    const isCorrect = userAnswer === content.answer;
    const score = isCorrect ? 100 : 0;
    const mistakeTag = isCorrect
      ? undefined
      : content.answer === "fraud"
        ? "missed-scam-signal"
        : "false-alarmed-safe-case";

    onComplete({
      typeId: "fraud-judgment",
      contentId: content.id,
      score,
      grade: computeGrade(score),
      userChoice: userAnswer === "fraud" ? "사기라고 판단" : "정상이라고 판단",
      correctChoice: content.answer === "fraud" ? "실제로는 사기" : "실제로는 정상",
      isCorrect,
      explanation: `${content.explanation} (출처: ${content.source})`,
      mistakeTag,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-800 bg-[#141414] p-4">
        <p className="text-sm font-medium text-neutral-400">{content.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-300">
          {content.content}
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          onClick={() => handleAnswer("fraud")}
          disabled={locked}
          className="min-h-11 flex-1 rounded-lg bg-blue-500 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          사기예요
        </button>
        <button
          type="button"
          onClick={() => handleAnswer("safe")}
          disabled={locked}
          className="min-h-11 flex-1 rounded-lg border border-neutral-800 bg-[#141414] px-6 text-sm font-medium text-neutral-300 transition-colors hover:border-blue-500 disabled:cursor-not-allowed"
        >
          정상이에요
        </button>
      </div>
    </div>
  );
}
