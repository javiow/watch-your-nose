import { describe, expect, it } from "vitest";
import type { ExperienceModule, ExperienceTypeId } from "@/types/experience";
import { EXPERIENCE_MODULES, pickSessionPlan } from "./registry";

function makeModule(
  typeId: ExperienceTypeId,
  contentPool: unknown[] = ["content"]
): ExperienceModule {
  return {
    typeId,
    contentPool,
    pickRandomContent: () => contentPool[0],
  };
}

describe("EXPERIENCE_MODULES", () => {
  it("voice-phishing 유형이 등록되어 있고 contentPool이 비어있지 않다", () => {
    const voicePhishing = EXPERIENCE_MODULES.find(
      (mod) => mod.typeId === "voice-phishing"
    );
    expect(voicePhishing).toBeDefined();
    expect(voicePhishing?.contentPool.length).toBeGreaterThan(0);
  });
});

describe("pickSessionPlan", () => {
  it("등록된 유형 각각을 정확히 1회씩만 포함한다", () => {
    const modules = [
      makeModule("voice-phishing"),
      makeModule("case-select"),
      makeModule("jeonse"),
    ];
    const plan = pickSessionPlan(modules);
    const typeIds = plan.map((p) => p.typeId);
    expect(typeIds).toHaveLength(3);
    expect(new Set(typeIds).size).toBe(3);
    expect([...typeIds].sort()).toEqual(
      ["case-select", "jeonse", "voice-phishing"].sort()
    );
  });

  it("contentPool이 빈 모듈이 있으면 에러를 던진다", () => {
    const modules = [makeModule("voice-phishing", [])];
    expect(() => pickSessionPlan(modules)).toThrow();
  });

  it("등록된 모듈이 없으면 빈 계획을 반환한다", () => {
    expect(pickSessionPlan([])).toEqual([]);
  });
});
