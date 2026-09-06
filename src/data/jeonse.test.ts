import { describe, expect, it } from "vitest";
import { JEONSE_HOUSES, JEONSE_HOUSE_SETS } from "./jeonse";

describe("JEONSE_HOUSES", () => {
  it("40채 이상을 포함한다", () => {
    expect(JEONSE_HOUSES.length).toBeGreaterThanOrEqual(40);
  });

  it("각 매물은 필수 필드를 비어있지 않게 가지고 fields는 8개다", () => {
    for (const house of JEONSE_HOUSES) {
      expect(house.id.length).toBeGreaterThan(0);
      expect(house.short.length).toBeGreaterThan(0);
      expect(house.name.length).toBeGreaterThan(0);
      expect(house.addr.length).toBeGreaterThan(0);
      expect(house.deposit.length).toBeGreaterThan(0);
      expect(house.market.length).toBeGreaterThan(0);
      expect(house.ratio.length).toBeGreaterThan(0);
      expect(house.explain.length).toBeGreaterThan(0);
      expect(house.lesson.length).toBeGreaterThan(0);
      expect(house.reason.length).toBeGreaterThan(0);
      expect(house.fields.length).toBe(8);
    }
  });

  it("id는 전부 고유하다", () => {
    const ids = JEONSE_HOUSES.map((house) => house.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 매물은 difficulty를 easy/medium/hard 중 하나로 가진다", () => {
    for (const house of JEONSE_HOUSES) {
      expect(["easy", "medium", "hard"]).toContain(house.difficulty);
    }
  });

  it("easy/medium/hard 난이도가 각각 최소 1개 이상 존재한다", () => {
    const difficulties = new Set(JEONSE_HOUSES.map((house) => house.difficulty));
    expect(difficulties.has("easy")).toBe(true);
    expect(difficulties.has("medium")).toBe(true);
    expect(difficulties.has("hard")).toBe(true);
  });

  it("easy/medium/hard 난이도가 각각 5채 이상 존재한다", () => {
    // step3의 전세매물 즉석 5채 세트 구성이 fallback 없이 동작하기 위한 전제.
    for (const level of ["easy", "medium", "hard"] as const) {
      const count = JEONSE_HOUSES.filter((h) => h.difficulty === level).length;
      expect(count).toBeGreaterThanOrEqual(5);
    }
  });

  it("explain/lesson 본문이 짧게 유지된다 (explain ≤ 260, lesson ≤ 140)", () => {
    for (const h of JEONSE_HOUSES) {
      expect(h.explain.length, `house ${h.id} explain`).toBeLessThanOrEqual(260);
      expect(h.lesson.length, `house ${h.id} lesson`).toBeLessThanOrEqual(140);
      expect(h.explain.startsWith("\n")).toBe(false);
      expect(h.explain.endsWith("\n")).toBe(false);
    }
  });
});

describe("JEONSE_HOUSE_SETS", () => {
  it("최소 1개 이상의 세트를 포함한다", () => {
    expect(JEONSE_HOUSE_SETS.length).toBeGreaterThanOrEqual(1);
  });

  it("모든 세트는 정확히 5개의 매물을 가진다", () => {
    for (const set of JEONSE_HOUSE_SETS) {
      expect(set.length).toBe(5);
    }
  });

  it("세트에 등장하는 모든 id는 JEONSE_HOUSES에 실제로 존재한다", () => {
    const validIds = new Set(JEONSE_HOUSES.map((house) => house.id));
    for (const set of JEONSE_HOUSE_SETS) {
      for (const house of set) {
        expect(validIds.has(house.id)).toBe(true);
      }
    }
  });
});
