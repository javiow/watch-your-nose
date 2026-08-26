"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { EXPERIENCE_MODULES } from "@/lib/registry";
import { GRADE_LABELS, aggregateResults } from "@/lib/scoring";
import { getRemediation } from "@/data/remediation";
import type { Grade } from "@/types/experience";

const GRADE_TEXT_COLOR: Record<Grade, string> = {
  safe: "text-safe",
  caution: "text-subtle",
  danger: "text-danger",
};

export default function ResultPage() {
  const router = useRouter();
  const { results, resetSession } = useSession();

  const isComplete = results.length === EXPERIENCE_MODULES.length;
  // "다시 체험하기" 클릭 시 resetSession()이 results를 비워 isComplete가 false로
  // 바뀌는데, 이 컴포넌트가 아직 마운트된 채로 그 상태를 보고 아래 useEffect가
  // /로 리다이렉트해버리면 곧이어 호출한 router.push("/session")과 경쟁해 언제나
  // 리다이렉트가 이긴다. 의도된 재시작 중에는 이 가드를 건너뛰기 위한 플래그.
  const isRetryingRef = useRef(false);

  useEffect(() => {
    if (!isComplete && !isRetryingRef.current) {
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
    isRetryingRef.current = true;
    resetSession();
    router.push("/session");
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-8">
      <h1 className="text-4xl font-semibold text-foreground">결과</h1>

      <section className="space-y-1 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-medium text-muted">종합 정답률</p>
        <p className="text-4xl font-semibold text-foreground">
          {roundedAverage}%{" "}
          <span className={GRADE_TEXT_COLOR[grade]}>{GRADE_LABELS[grade]}</span>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted">문항별 리뷰</h2>
        <ul className="flex flex-col gap-3">
          {results.map((result, index) => (
            <li
              key={`${result.typeId}-${result.contentId}`}
              className="space-y-2 rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm text-subtle">{index + 1}번</p>
                <p
                  className={`text-sm font-medium ${
                    result.isCorrect ? "text-safe" : "text-danger"
                  }`}
                >
                  {result.isCorrect ? "정답" : "오답"}
                </p>
              </div>
              <p className="text-sm text-muted">
                내 선택: {result.userChoice}
              </p>
              <p className="text-sm text-muted">
                정답: {result.correctChoice}
              </p>
              <p className="text-sm leading-relaxed text-muted">
                {result.explanation}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {incorrectResults.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted">대응 방안</h2>
          <ul className="flex flex-col gap-3">
            {incorrectResults.map((result, index) => (
              <li
                key={`${result.typeId}-remediation-${index}`}
                className="rounded-xl border border-border bg-surface p-4 shadow-sm"
              >
                <p className="text-sm leading-relaxed text-muted">
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
          className="min-h-11 rounded-xl bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          다시 체험하기
        </button>
      </div>
    </main>
  );
}
