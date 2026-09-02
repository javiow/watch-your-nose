import { describe, expect, it } from "vitest";
import type {
  Difficulty,
  ExperienceModule,
  ExperienceTypeId,
} from "@/types/experience";
import {
  EXPERIENCE_MODULES,
  pickByDifficulty,
  pickSessionPlan,
} from "./registry";

function makeModule(
  typeId: ExperienceTypeId,
  contentPool: unknown[] = ["content"]
): ExperienceModule {
  return {
    typeId,
    contentPool,
    pickRandomContent: () => contentPool[0],
    Component: () => null,
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

  it("fraud-judgment 유형이 등록되어 있고 contentPool이 비어있지 않다", () => {
    const fraudJudgment = EXPERIENCE_MODULES.find(
      (mod) => mod.typeId === "fraud-judgment"
    );
    expect(fraudJudgment).toBeDefined();
    expect(fraudJudgment?.contentPool.length).toBeGreaterThan(0);
  });
});

describe("pickByDifficulty", () => {
  it("태그가 있는 풀에서 요청한 난이도의 항목만 반환한다", () => {
    const pool = [
      { difficulty: "easy" as Difficulty, v: 1 },
      { difficulty: "easy" as Difficulty, v: 2 },
      { difficulty: "hard" as Difficulty, v: 3 },
    ];
    for (let i = 0; i < 30; i += 1) {
      expect(pickByDifficulty(pool, "easy").difficulty).toBe("easy");
    }
  });

  it("요청한 난이도와 일치하는 항목이 없으면 전체 풀에서 반환한다", () => {
    const pool = [
      { difficulty: "easy" as Difficulty, v: 1 },
      { difficulty: "easy" as Difficulty, v: 2 },
      { difficulty: "hard" as Difficulty, v: 3 },
    ];
    for (let i = 0; i < 30; i += 1) {
      expect(pool).toContain(pickByDifficulty(pool, "medium"));
    }
  });

  it("difficulty 인자가 undefined면 전체 풀에서 반환한다", () => {
    const pool = [
      { difficulty: "easy" as Difficulty, v: 1 },
      { difficulty: "hard" as Difficulty, v: 3 },
    ];
    for (let i = 0; i < 30; i += 1) {
      expect(pool).toContain(pickByDifficulty(pool));
    }
  });

  it("난이도 태그가 전혀 없는 풀은 난이도를 무시하고 전체 풀에서 반환한다", () => {
    const pool: { v: number; difficulty?: Difficulty }[] = [{ v: 1 }, { v: 2 }];
    for (let i = 0; i < 30; i += 1) {
      expect(pool).toContain(pickByDifficulty(pool, "easy"));
    }
  });
});

describe("EXPERIENCE_MODULES 난이도 선택", () => {
  const difficulties: (Difficulty | undefined)[] = [
    "easy",
    "medium",
    "hard",
    undefined,
  ];

  it("모든 모듈은 각 난이도에 대해 undefined 아닌 값을 반환한다", () => {
    for (const mod of EXPERIENCE_MODULES) {
      for (const d of difficulties) {
        expect(mod.pickRandomContent(d)).toBeDefined();
      }
    }
  });

  it("jeonse 모듈은 각 난이도에 대해 그 난이도의 5채 배열을 반환한다", () => {
    const jeonse = EXPERIENCE_MODULES.find((mod) => mod.typeId === "jeonse");
    expect(jeonse).toBeDefined();
    for (const d of ["easy", "medium", "hard"] as Difficulty[]) {
      for (let i = 0; i < 10; i += 1) {
        const houses = jeonse!.pickRandomContent(d) as { difficulty: Difficulty }[];
        expect(houses).toHaveLength(5);
        expect(houses.every((h) => h.difficulty === d)).toBe(true);
      }
    }
  });

  it("jeonse 모듈을 인자 없이 호출하면 길이 5 배열을 반환한다", () => {
    const jeonse = EXPERIENCE_MODULES.find((mod) => mod.typeId === "jeonse");
    expect(jeonse).toBeDefined();
    for (let i = 0; i < 10; i += 1) {
      expect(jeonse!.pickRandomContent() as unknown[]).toHaveLength(5);
    }
  });
});

describe("pickSessionPlan", () => {
  it("등록된 유형 각각을 정확히 1회씩만 포함한다", () => {
    const modules = [
      makeModule("voice-phishing"),
      makeModule("case-investigation"),
      makeModule("jeonse"),
      makeModule("fraud-judgment"),
    ];
    const plan = pickSessionPlan(modules);
    const typeIds = plan.map((p) => p.typeId);
    expect(typeIds).toHaveLength(4);
    expect(new Set(typeIds).size).toBe(4);
    expect([...typeIds].sort()).toEqual(
      ["case-investigation", "fraud-judgment", "jeonse", "voice-phishing"].sort()
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
