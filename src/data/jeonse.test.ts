import { describe, expect, it } from "vitest";
import { JEONSE_HOUSES, JEONSE_HOUSE_SETS, JEONSE_LISTING_PAIRS } from "./jeonse";

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
