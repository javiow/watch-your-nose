import { describe, expect, it } from "vitest";
import { FRAUD_JUDGMENT_CARDS } from "./fraud-judgment";
import type { FraudJudgmentCategory } from "@/types/experience";

const ALL_CATEGORIES: FraudJudgmentCategory[] = [
  "중고거래_사기",
  "투자리딩방_사기",
  "로맨스스캠",
  "스미싱",
  "대환작업대출_사기",
  "몸캠피싱",
  "가짜쇼핑몰",
  "대리입금",
  "지인사칭_메신저피싱",
  "취업사기",
  "전세사기",
  "택배기사_사칭피싱",
  "중고차_사기",
  "반려동물_분양사기",
  "티켓_되팔이_사기",
  "가상자산_사기",
  "파밍_사기",
  "보험사기",
  "명의도용_사기",
];

describe("FRAUD_JUDGMENT_CARDS", () => {
  it("최소 1개 이상의 카드를 포함한다", () => {
    expect(FRAUD_JUDGMENT_CARDS.length).toBeGreaterThan(0);
  });

  it("모든 카드의 id는 고유하다", () => {
    const ids = FRAUD_JUDGMENT_CARDS.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 카드는 title/content/explanation/source를 비어있지 않은 문자열로 가진다", () => {
    for (const card of FRAUD_JUDGMENT_CARDS) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.content.length).toBeGreaterThan(0);
      expect(card.explanation.length).toBeGreaterThan(0);
      expect(card.source.length).toBeGreaterThan(0);
    }
  });

  it("answer는 fraud 또는 safe만 존재한다", () => {
    for (const card of FRAUD_JUDGMENT_CARDS) {
      expect(["fraud", "safe"]).toContain(card.answer);
    }
  });

  it("19개 카테고리 각각 최소 1개 이상의 카드가 존재한다", () => {
    const categories = new Set(FRAUD_JUDGMENT_CARDS.map((card) => card.category));
    for (const category of ALL_CATEGORIES) {
      expect(categories.has(category)).toBe(true);
    }
  });

  it("fraud 정답과 safe 정답이 모두 최소 1개 이상 존재한다", () => {
    expect(FRAUD_JUDGMENT_CARDS.some((card) => card.answer === "fraud")).toBe(true);
    expect(FRAUD_JUDGMENT_CARDS.some((card) => card.answer === "safe")).toBe(true);
  });
});
