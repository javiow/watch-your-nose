import { describe, expect, it } from "vitest";
import { JEONSE_LISTING_PAIRS } from "./jeonse";

describe("JEONSE_LISTING_PAIRS", () => {
  it("최소 2개의 매물 쌍을 포함한다", () => {
    expect(JEONSE_LISTING_PAIRS.length).toBeGreaterThanOrEqual(2);
  });

  it("각 쌍은 normalListing과 scamListing의 title/details를 모두 가진다", () => {
    for (const pair of JEONSE_LISTING_PAIRS) {
      expect(pair.normalListing.title.length).toBeGreaterThan(0);
      expect(pair.normalListing.details.length).toBeGreaterThan(0);
      expect(pair.scamListing.title.length).toBeGreaterThan(0);
      expect(pair.scamListing.details.length).toBeGreaterThan(0);
    }
  });

  it("correctSide는 항상 normal이다", () => {
    for (const pair of JEONSE_LISTING_PAIRS) {
      expect(pair.correctSide).toBe("normal");
    }
  });

  it("각 쌍의 id는 고유하다", () => {
    const ids = JEONSE_LISTING_PAIRS.map((pair) => pair.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
