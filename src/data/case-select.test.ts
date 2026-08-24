import { describe, expect, it } from "vitest";
import { CASE_SELECT_PAIRS } from "./case-select";

describe("CASE_SELECT_PAIRS", () => {
  it("최소 2개의 사례 쌍을 포함한다", () => {
    expect(CASE_SELECT_PAIRS.length).toBeGreaterThanOrEqual(2);
  });

  it("각 쌍은 scamCase와 normalCase의 title/body를 모두 가진다", () => {
    for (const pair of CASE_SELECT_PAIRS) {
      expect(pair.scamCase.title.length).toBeGreaterThan(0);
      expect(pair.scamCase.body.length).toBeGreaterThan(0);
      expect(pair.normalCase.title.length).toBeGreaterThan(0);
      expect(pair.normalCase.body.length).toBeGreaterThan(0);
    }
  });

  it("correctSide는 항상 scam이다", () => {
    for (const pair of CASE_SELECT_PAIRS) {
      expect(pair.correctSide).toBe("scam");
    }
  });

  it("각 쌍의 id는 고유하다", () => {
    const ids = CASE_SELECT_PAIRS.map((pair) => pair.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
