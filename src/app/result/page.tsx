"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { aggregateResults, describeGradeThresholds } from "@/lib/scoring";
import { getRemediationEntry } from "@/data/remediation";
import { EXPERIENCE_TYPE_LABELS } from "@/data/experience-types";
import { Mascot } from "@/components/ui/Mascot";
import { Prose } from "@/components/ui/Prose";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ScoreBarChart } from "@/components/ui/ScoreBarChart";
import { ReviewBreakdownTable } from "@/components/ui/ReviewBreakdownTable";
import { MissedSignalList } from "@/components/ui/MissedSignalList";
import { GRADE_EXPRESSION } from "@/lib/mascot-frames";

export default function ResultPage() {
  const router = useRouter();
  const { results, resetSession } = useSession();

  // 세션을 하나도 안 거치고 /result에 직접 들어온 경우에만 홈으로 돌려보낸다.
  // 예전에는 "results.length === 전체 유형 수"로 완료를 판정했는데, /session이
  // 마지막 addResult 직후 push("/result")를 하는 흐름에서 /result가 마운트되는
  // 찰나에 Context가 아직 마지막 결과를 반영하지 못하면(동시성 렌더/StrictMode
  // 재마운트 등) 완료된 세션인데도 "미완료"로 오판해 홈으로 튕겼고, 한 번 튕기면
  // 결과가 채워져도 이미 언마운트돼 복구되지 않았다. 결과가 1건이라도 있으면
  // 렌더하고, 뒤늦게 도착하는 결과는 리렌더로 자연히 채운다.
  const hasSession = results.length > 0;
  // "다시 체험하기" 클릭 시 resetSession()이 results를 비우는데, 이 컴포넌트가 아직
  // 마운트된 채로 그 빈 상태를 보고 아래 useEffect가 /로 리다이렉트해버리면 곧이어
  // 호출한 router.push("/session")과 경쟁해 리다이렉트가 이긴다. 의도된 재시작
  // 중에는 이 가드를 건너뛰기 위한 플래그.
  const isRetryingRef = useRef(false);

  useEffect(() => {
    if (!hasSession && !isRetryingRef.current) {
      router.replace("/");
    }
  }, [hasSession, router]);

  if (!hasSession) {
    return null;
  }

  const { average, grade } = aggregateResults(results);
  const roundedAverage = Math.round(average);

  const handleRetry = () => {
    isRetryingRef.current = true;
    resetSession();
    router.push("/session");
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-8">
      <h1 className="text-4xl font-semibold text-foreground">결과 📊</h1>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-medium text-muted">종합 정답률 🎯</p>
        <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Mascot
            expression={GRADE_EXPRESSION[grade]}
            className="h-20 w-20 shrink-0"
          />
          <div className="flex flex-col items-center gap-1">
            <ScoreGauge percent={roundedAverage} grade={grade} />
            <p className="text-xs text-subtle">{describeGradeThresholds()}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted">유형별 점수 📈</h2>
        <ScoreBarChart results={results} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted">문항별 리뷰 📝</h2>
        <ul className="flex flex-col gap-3">
          {results.map((result, index) => {
            const remediation = result.isCorrect
              ? null
              : getRemediationEntry(result.mistakeTag);
            return (
              <li
                key={`${result.typeId}-${result.contentId}`}
                className="space-y-2 rounded-xl border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className={result.isCorrect ? "text-safe" : "text-danger"}
                  >
                    {result.isCorrect ? "✓" : "✗"}
                  </span>
                  <span className="sr-only">
                    {result.isCorrect ? "정답" : "오답"}
                  </span>
                  <span className="text-subtle">
                    {index + 1}번 · {EXPERIENCE_TYPE_LABELS[result.typeId]}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  내 선택 {result.userChoice} · 정답 {result.correctChoice}
                </p>
                <Prose text={result.explanation} size="sm" />

                {result.reviewItems && (
                  <ReviewBreakdownTable items={result.reviewItems} />
                )}

                {result.missedSignals && result.missedSignals.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-danger">놓친 위험 신호 🚩</p>
                    <MissedSignalList signals={result.missedSignals} />
                  </div>
                )}
                {!result.missedSignals &&
                  result.reviewItems?.some(
                    (item) => !item.isCorrect && item.detail
                  ) && (
                    <Prose
                      size="sm"
                      text={
                        result.reviewItems.find(
                          (item) => !item.isCorrect && item.detail
                        )!.detail!
                      }
                    />
                  )}

                {remediation && (
                  <div className="space-y-2 rounded-lg border border-border bg-surface-muted p-3">
                    <p className="text-xs font-medium text-accent">이렇게 대응하세요 🛡️</p>
                    <Prose text={remediation.message} size="sm" />
                    <ul className="flex flex-col gap-1.5">
                      {remediation.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-2 text-sm leading-relaxed text-muted"
                        >
                          <span aria-hidden="true" className="text-accent">
                            ·
                          </span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    {remediation.links && remediation.links.length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {remediation.links.map((link) => (
                          <li key={link.url}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent"
                            >
                              {link.label} ↗
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRetry}
          className="min-h-11 rounded-xl bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          다시 체험하기 🔄
        </button>
      </div>
    </main>
  );
}
