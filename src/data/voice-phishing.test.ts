import { describe, expect, it } from "vitest";
import { VOICE_PHISHING_SCENARIOS } from "./voice-phishing";

describe("VOICE_PHISHING_SCENARIOS", () => {
  it("사기 시나리오 1개 이상, 정상 시나리오 1개 이상을 포함한다", () => {
    expect(
      VOICE_PHISHING_SCENARIOS.some((scenario) => !scenario.isNormalCase)
    ).toBe(true);
    expect(
      VOICE_PHISHING_SCENARIOS.some((scenario) => scenario.isNormalCase)
    ).toBe(true);
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
