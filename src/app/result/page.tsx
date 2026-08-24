"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { EXPERIENCE_MODULES } from "@/lib/registry";
import { GRADE_LABELS, aggregateResults } from "@/lib/scoring";
import { getRemediation } from "@/data/remediation";
import type { Grade } from "@/types/experience";

const GRADE_TEXT_COLOR: Record<Grade, string> = {
  safe: "text-[#22c55e]",
  caution: "text-neutral-400",
  danger: "text-[#ef4444]",
};

export default function ResultPage() {
  const router = useRouter();
  const { results, resetSession } = useSession();

  const isComplete = results.length === EXPERIENCE_MODULES.length;

  useEffect(() => {
    if (!isComplete) {
      router.replace("/");
    }
  }, [isComplete, router]);

  if (!isComplete) {
    return null;
  }

  const { average, grade } = aggregateResults(results);
  const roundedAverage = Math.round(average);
  const incorrectResults = results.filter((result) => !result.isCorrect);

  const handleRetry = () => {
    resetSession();
    router.push("/session");
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-8">
      <h1 className="text-4xl font-semibold text-white">결과</h1>

      <section className="space-y-1 rounded-lg border border-neutral-800 bg-[#141414] p-6">
        <p className="text-sm font-medium text-neutral-400">종합 정답률</p>
        <p className="text-4xl font-semibold text-white">
          {roundedAverage}%{" "}
          <span className={GRADE_TEXT_COLOR[grade]}>{GRADE_LABELS[grade]}</span>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-400">문항별 리뷰</h2>
        <ul className="flex flex-col gap-3">
          {results.map((result, index) => (
            <li
              key={`${result.typeId}-${result.contentId}`}
              className="space-y-2 rounded-lg border border-neutral-800 bg-[#141414] p-4"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm text-neutral-500">{index + 1}번</p>
                <p
                  className={`text-sm font-medium ${
                    result.isCorrect ? "text-[#22c55e]" : "text-[#ef4444]"
                  }`}
                >
                  {result.isCorrect ? "정답" : "오답"}
                </p>
              </div>
              <p className="text-sm text-neutral-300">
                내 선택: {result.userChoice}
              </p>
              <p className="text-sm text-neutral-300">
                정답: {result.correctChoice}
              </p>
              <p className="text-sm leading-relaxed text-neutral-400">
                {result.explanation}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {incorrectResults.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-400">대응 방안</h2>
          <ul className="flex flex-col gap-3">
            {incorrectResults.map((result, index) => (
              <li
                key={`${result.typeId}-remediation-${index}`}
                className="rounded-lg border border-neutral-800 bg-[#141414] p-4"
              >
                <p className="text-sm leading-relaxed text-neutral-300">
                  {getRemediation(result.mistakeTag)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRetry}
          className="min-h-11 rounded-lg bg-blue-500 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-400"
        >
          다시 체험하기
        </button>
      </div>
    </main>
  );
}
