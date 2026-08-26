"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { EXPERIENCE_MODULES } from "@/lib/registry";
import type { ModuleResult } from "@/types/experience";

export default function SessionPage() {
  const router = useRouter();
  const { sessionPlan, addResult, playerInfo } = useSession();
  const [step, setStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentPlanItem = sessionPlan[step];
  const currentModule = currentPlanItem
    ? EXPERIENCE_MODULES.find((mod) => mod.typeId === currentPlanItem.typeId)
    : undefined;

  const content = useMemo(
    () => currentModule?.pickRandomContent(),
    [currentModule]
  );

  useEffect(() => {
    if (sessionPlan.length === 0 || playerInfo === null) {
      router.replace("/");
    }
  }, [sessionPlan, playerInfo, router]);

  if (
    sessionPlan.length === 0 ||
    playerInfo === null ||
    !currentModule ||
    content === undefined
  ) {
    return null;
  }

  const handleComplete = (result: ModuleResult) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    addResult(result);

    if (step + 1 >= sessionPlan.length) {
      router.push("/result");
      return;
    }

    setStep((s) => s + 1);
    setIsTransitioning(false);
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
