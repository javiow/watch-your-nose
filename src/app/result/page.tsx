"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { EXPERIENCE_MODULES } from "@/lib/registry";
import { GRADE_LABELS, aggregateResults } from "@/lib/scoring";
import { getRemediation } from "@/data/remediation";
import { EXPERIENCE_TYPE_LABELS } from "@/data/experience-types";
import { Mascot } from "@/components/ui/Mascot";
import { GRADE_EXPRESSION } from "@/lib/mascot-frames";
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

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Mascot
            expression={GRADE_EXPRESSION[grade]}
            className="h-24 w-24 shrink-0"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted">종합 정답률</p>
            <p className="text-4xl font-semibold text-foreground">
              {roundedAverage}%{" "}
              <span className={GRADE_TEXT_COLOR[grade]}>
                {GRADE_LABELS[grade]}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted">문항별 리뷰</h2>
        <ul className="flex flex-col gap-3">
          {results.map((result, index) => (
            <li
              key={`${result.typeId}-${result.contentId}`}
              className={`space-y-2 rounded-xl border p-4 shadow-sm ${
                result.isCorrect
                  ? "border-border bg-surface"
                  : "border-danger/30 bg-danger/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="text-sm text-subtle">
                  {index + 1}번 · {EXPERIENCE_TYPE_LABELS[result.typeId]}
                </p>
                {result.isCorrect ? (
                  <p className="text-sm font-medium text-safe">정답</p>
                ) : (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                    오답
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">
                내 선택: {result.userChoice}
              </p>
              <p
                className={`text-sm ${
                  result.isCorrect
                    ? "text-muted"
                    : "font-semibold text-foreground"
                }`}
              >
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
          <h2 className="text-sm font-semibold text-foreground">대응 방안</h2>
          <ul className="flex flex-col gap-3">
            {incorrectResults.map((result, index) => (
              <li
                key={`${result.typeId}-remediation-${index}`}
                className="space-y-2 rounded-xl border border-accent/30 bg-accent-soft p-4 shadow-sm"
              >
                <p className="text-xs font-semibold text-accent">
                  {EXPERIENCE_TYPE_LABELS[result.typeId]}
                </p>
                <p className="text-sm font-medium leading-relaxed text-foreground">
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
