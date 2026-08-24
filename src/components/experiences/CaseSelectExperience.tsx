"use client";

import { useState } from "react";
import type { ModuleResult, ScamCasePair, ScamCaseSide } from "@/types/experience";
import { computeGrade } from "@/lib/scoring";

type Side = "scam" | "normal";

function buildExplanation(isCorrect: boolean): string {
  return isCorrect
    ? "제시된 두 사례 중 사기 정황이 있는 쪽을 정확히 짚어냈습니다."
    : "실제로는 사기 정황이 있는 사례를 정상으로 판단했습니다. 예치금 요구, 개인정보·보안카드 전체 입력 요구 등은 대표적인 위험 신호입니다.";
}

interface CaseSelectExperienceProps {
  content: ScamCasePair;
  onComplete: (result: ModuleResult) => void;
}

export function CaseSelectExperience({
  content,
  onComplete,
}: CaseSelectExperienceProps) {
  const [selectedSide, setSelectedSide] = useState<Side | null>(null);

  const handleNext = () => {
    if (!selectedSide) return;

    const isCorrect = selectedSide === content.correctSide;
    const score = isCorrect ? 100 : 0;

    onComplete({
      typeId: "case-select",
      contentId: content.id,
      score,
      grade: computeGrade(score),
      userChoice: selectedSide === "scam" ? content.scamCase.title : content.normalCase.title,
      correctChoice:
        content.correctSide === "scam"
          ? content.scamCase.title
          : content.normalCase.title,
      isCorrect,
      explanation: buildExplanation(isCorrect),
      mistakeTag: isCorrect ? undefined : "missed-scam-signal",
    });
  };

  const renderCard = (side: Side, caseSide: ScamCaseSide) => (
    <button
      key={side}
      type="button"
      onClick={() => setSelectedSide(side)}
      className={`min-h-11 flex-1 rounded-lg border p-4 text-left transition-colors ${
        selectedSide === side
          ? "border-blue-500 bg-blue-500/10"
          : "border-neutral-800 bg-[#141414]"
      }`}
    >
      <p className="text-sm font-medium text-neutral-400">{caseSide.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-300">
        {caseSide.body}
      </p>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row">
        {renderCard("scam", content.scamCase)}
        {renderCard("normal", content.normalCase)}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedSide}
          className="min-h-11 rounded-lg bg-blue-500 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          다음
        </button>
      </div>
    </div>
  );
}
