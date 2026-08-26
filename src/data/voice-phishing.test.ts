import { describe, expect, it } from "vitest";
import { VOICE_PHISHING_SCENARIOS } from "./voice-phishing";
import type { VoicePhishingCategory } from "@/types/experience";

const ALL_CATEGORIES: VoicePhishingCategory[] = [
  "기관사칭형",
  "대출빙자형",
  "납치협박형",
  "메신저피싱형",
  "환불결제사칭형",
  "택배배송사칭형",
  "정상금융확인형",
  "정상생활안내형",
];

describe("VOICE_PHISHING_SCENARIOS", () => {
  it("모든 시나리오의 id는 고유하다", () => {
    const ids = VOICE_PHISHING_SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 시나리오의 category는 정의된 카테고리 중 하나다", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS) {
      expect(ALL_CATEGORIES).toContain(scenario.category);
    }
  });

  it("사기 시나리오 1개 이상, 정상 시나리오 1개 이상을 포함한다", () => {
    expect(
      VOICE_PHISHING_SCENARIOS.some((scenario) => !scenario.isNormalCase)
    ).toBe(true);
    expect(
      VOICE_PHISHING_SCENARIOS.some((scenario) => scenario.isNormalCase)
    ).toBe(true);
  });

  it("정확히 6개 시나리오(정상 3개 + 사기 3개)로 구성된다", () => {
    expect(VOICE_PHISHING_SCENARIOS).toHaveLength(6);
    expect(
      VOICE_PHISHING_SCENARIOS.filter((scenario) => scenario.isNormalCase)
    ).toHaveLength(3);
    expect(
      VOICE_PHISHING_SCENARIOS.filter((scenario) => !scenario.isNormalCase)
    ).toHaveLength(3);
  });

  it("각 시나리오의 startNodeId는 nodes 안에 실제로 존재한다", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS) {
      const nodeIds = scenario.nodes.map((node) => node.id);
      expect(nodeIds).toContain(scenario.startNodeId);
    }
  });

  it("각 시나리오는 모든 노드에 1개 이상의 선택지를 가진다", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS) {
      for (const node of scenario.nodes) {
        expect(node.choices.length).toBeGreaterThan(0);
      }
    }
  });
});
