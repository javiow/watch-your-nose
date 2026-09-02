import { describe, expect, it } from "vitest";
import { VOICE_PHISHING_SCENARIOS } from "./voice-phishing";
import type {
  DialogueChoice,
  VoicePhishingCategory,
  VoicePhishingScenario,
} from "@/types/experience";

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

// startNodeId에서 next를 따라가는 최장 경로의 노드 개수(= 최대 턴 수)를 계산한다.
function longestChainLength(scenario: VoicePhishingScenario): number {
  const nodeMap = new Map(scenario.nodes.map((node) => [node.id, node]));
  function dfs(nodeId: string): number {
    const node = nodeMap.get(nodeId);
    if (!node) return 0;
    let maxNext = 0;
    for (const choice of node.choices) {
      if (choice.next) maxNext = Math.max(maxNext, dfs(choice.next));
    }
    return 1 + maxNext;
  }
  return dfs(scenario.startNodeId);
}

// startNodeId에서 도달 가능한 모든 선택지를 수집한다(그래프 순회, 노드 재방문 방지).
function collectReachableChoices(
  scenario: VoicePhishingScenario
): DialogueChoice[] {
  const nodeMap = new Map(scenario.nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const choices: DialogueChoice[] = [];
  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node) return;
    for (const choice of node.choices) {
      choices.push(choice);
      if (choice.next) visit(choice.next);
    }
  }
  visit(scenario.startNodeId);
  return choices;
}

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

  it("정확히 9개 시나리오(정상 3개 + 사기 6개)로 구성된다", () => {
    expect(VOICE_PHISHING_SCENARIOS).toHaveLength(9);
    expect(
      VOICE_PHISHING_SCENARIOS.filter((scenario) => scenario.isNormalCase)
    ).toHaveLength(3);
    expect(
      VOICE_PHISHING_SCENARIOS.filter((scenario) => !scenario.isNormalCase)
    ).toHaveLength(6);
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

  it("각 시나리오의 최장 대화 체인은 3~5개 노드(턴)다", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS) {
      const length = longestChainLength(scenario);
      expect(length).toBeGreaterThanOrEqual(3);
      expect(length).toBeLessThanOrEqual(5);
    }
  });

  it("risk가 caution인 선택지는 항상 next를 가진다(시나리오를 즉시 종료시키지 않는다)", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS) {
      for (const node of scenario.nodes) {
        for (const choice of node.choices) {
          if (choice.risk === "caution") {
            expect(choice.next).toBeDefined();
          }
        }
      }
    }
  });

  it("risk가 danger인 선택지는 항상 next가 없다(항상 시나리오를 종료시킨다)", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS) {
      for (const node of scenario.nodes) {
        for (const choice of node.choices) {
          if (choice.risk === "danger") {
            expect(choice.next).toBeUndefined();
          }
        }
      }
    }
  });

  it("각 시나리오는 safe 종료와 danger 종료 결말에 모두 도달할 수 있다", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS) {
      const reachable = collectReachableChoices(scenario);
      const hasSafeTerminal = reachable.some(
        (choice) => choice.risk === "safe" && !choice.next
      );
      const hasDangerTerminal = reachable.some(
        (choice) => choice.risk === "danger" && !choice.next
      );
      expect(hasSafeTerminal).toBe(true);
      expect(hasDangerTerminal).toBe(true);
    }
  });

  it("사기 시나리오는 시작 노드에 safe-terminal 선택지가 있다(즉시 거절이 언제나 안전한 선택)", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS.filter(
      (s) => !s.isNormalCase
    )) {
      const startNode = scenario.nodes.find(
        (node) => node.id === scenario.startNodeId
      );
      const hasSafeTerminal = startNode?.choices.some(
        (choice) => choice.risk === "safe" && !choice.next
      );
      expect(hasSafeTerminal).toBe(true);
    }
  });

  it("정상 시나리오는 시작 노드에 danger-terminal 선택지가 있다(반사적 거부는 첫 턴부터 오답)", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS.filter(
      (s) => s.isNormalCase
    )) {
      const startNode = scenario.nodes.find(
        (node) => node.id === scenario.startNodeId
      );
      const hasDangerTerminal = startNode?.choices.some(
        (choice) => choice.risk === "danger" && !choice.next
      );
      expect(hasDangerTerminal).toBe(true);
    }
  });
});

describe("VOICE_PHISHING_SCENARIOS 난이도 태깅", () => {
  it("모든 시나리오는 difficulty가 easy|medium|hard 중 하나로 태깅되어 있다", () => {
    for (const scenario of VOICE_PHISHING_SCENARIOS) {
      expect(["easy", "medium", "hard"]).toContain(scenario.difficulty);
    }
  });

  it("easy·medium·hard 각각 최소 1개 시나리오가 있다", () => {
    for (const level of ["easy", "medium", "hard"] as const) {
      expect(
        VOICE_PHISHING_SCENARIOS.some((scenario) => scenario.difficulty === level)
      ).toBe(true);
    }
  });
});
