"use client";

import { useState } from "react";
import type { ListingPair, ListingSide, ModuleResult } from "@/types/experience";
import { computeGrade } from "@/lib/scoring";

type Side = "normal" | "scam";

function buildExplanation(isCorrect: boolean): string {
  return isCorrect
    ? "제시된 두 매물 중 위험 신호가 없는 쪽을 정확히 짚어냈습니다."
    : "실제로는 위험 신호가 있는 매물을 정상으로 판단했습니다. 과도한 근저당, 소유자와 계약 상대방 명의 불일치, 대리인 계좌 입금 요구 등은 대표적인 위험 신호입니다.";
}

interface JeonseExperienceProps {
  content: ListingPair;
  onComplete: (result: ModuleResult) => void;
}

export function JeonseExperience({
  content,
  onComplete,
}: JeonseExperienceProps) {
  const [selectedSide, setSelectedSide] = useState<Side | null>(null);

  const handleNext = () => {
    if (!selectedSide) return;

    const isCorrect = selectedSide === content.correctSide;
    const score = isCorrect ? 100 : 0;

    onComplete({
      typeId: "jeonse",
      contentId: content.id,
      score,
      grade: computeGrade(score),
      userChoice:
        selectedSide === "normal"
          ? content.normalListing.title
          : content.scamListing.title,
      correctChoice:
        content.correctSide === "normal"
          ? content.normalListing.title
          : content.scamListing.title,
      isCorrect,
      explanation: buildExplanation(isCorrect),
      mistakeTag: isCorrect ? undefined : "missed-lease-fraud-signal",
    });
  };

  const renderCard = (side: Side, listing: ListingSide) => (
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
      <p className="text-sm font-medium text-neutral-400">{listing.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-300">
        {listing.details}
      </p>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row">
        {renderCard("normal", content.normalListing)}
        {renderCard("scam", content.scamListing)}
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
