"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { EXPERIENCE_MODULES } from "@/lib/registry";
import type { ModuleResult } from "@/types/experience";

export default function SessionPage() {
  const router = useRouter();
  const { sessionPlan, results, addResult, playerInfo, difficulty } = useSession();
  const [step, setStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentPlanItem = sessionPlan[step];
  const currentModule = currentPlanItem
    ? EXPERIENCE_MODULES.find((mod) => mod.typeId === currentPlanItem.typeId)
    : undefined;

  const content = useMemo(
    () => currentModule?.pickRandomContent(difficulty ?? undefined),
    [currentModule, difficulty]
  );

  useEffect(() => {
    if (
      sessionPlan.length === 0 ||
      playerInfo === null ||
      difficulty === null
    ) {
      router.replace("/");
    }
  }, [sessionPlan, playerInfo, difficulty, router]);

  // 세션 마지막 유형까지 마치면 /result로 이동한다. handleComplete 안에서
  // router.push를 바로 부르면 addResult가 예약한 SessionProvider의 results
  // 갱신이 실제로 커밋되기 전에 내비게이션이 먼저 끝나버릴 수 있고, 그러면
  // /result가 마운트 시점에 옛 results(길이 미달)를 보고 "미완료"로 오판해
  // "/"로 리다이렉트해버린다(가끔 결과 대신 첫 화면으로 튕기는 버그의 원인).
  // results.length를 관찰하는 이 effect는 리렌더 커밋 이후에만 실행되므로
  // 이 시점의 results는 항상 최신 값이고, 그 이후에 이동해야 안전하다.
  useEffect(() => {
    if (sessionPlan.length > 0 && results.length >= sessionPlan.length) {
      router.push("/result");
    }
  }, [results.length, sessionPlan.length, router]);

  if (
    sessionPlan.length === 0 ||
    playerInfo === null ||
    difficulty === null ||
    !currentModule ||
    content === undefined
  ) {
    return null;
  }

  const handleComplete = (result: ModuleResult) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    addResult(result);

    // 마지막 유형이 아니면 다음 단계로 넘어간다. 마지막 유형이면 여기서
    // 아무것도 하지 않고, 위 useEffect가 results 갱신을 관찰해 /result로
    // 이동시킨다.
    if (step + 1 < sessionPlan.length) {
      setStep((s) => s + 1);
      setIsTransitioning(false);
    }
  };

  const Component = currentModule.Component;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-8">
      <div className="space-y-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${((step + 1) / sessionPlan.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-subtle">
          {step + 1}/{sessionPlan.length}
        </p>
      </div>

      <Component
        key={currentModule.typeId}
        content={content}
        onComplete={handleComplete}
      />
    </main>
  );
}
