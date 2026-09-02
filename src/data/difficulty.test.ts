import { describe, expect, it } from "vitest";
import { DIFFICULTY_OPTIONS } from "./difficulty";

describe("DIFFICULTY_OPTIONS", () => {
  it("id가 easy → medium → hard 순서로 정확히 일치한다", () => {
    expect(DIFFICULTY_OPTIONS.map((o) => o.id)).toEqual(["easy", "medium", "hard"]);
  });

  it("모든 옵션의 label과 description이 비어있지 않다", () => {
    for (const option of DIFFICULTY_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.description.length).toBeGreaterThan(0);
    }
  });

  it("label·description 어디에도 체험 유형을 암시하는 단어가 없다", () => {
    const forbidden = ["전세", "매물", "보이스피싱", "피싱", "통화", "사례", "카드", "등기", "임대"];
    for (const option of DIFFICULTY_OPTIONS) {
      const text = `${option.label} ${option.description}`;
      for (const word of forbidden) {
        expect(text).not.toContain(word);
      }
    }
  });

  it("id 값 집합의 크기가 3이다 (중복 없음)", () => {
    expect(new Set(DIFFICULTY_OPTIONS.map((o) => o.id)).size).toBe(3);
  });
});
