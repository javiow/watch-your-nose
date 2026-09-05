import { describe, expect, it } from "vitest";
import { CASE_INVESTIGATION_CASES } from "./case-investigation";
import type { CaseFinalDecision } from "@/types/experience";

const ALL_DECISIONS: CaseFinalDecision[] = [
  "SAFE_TO_PROCEED",
  "NEED_MORE_VERIFICATION",
  "STOP_CONTRACT",
];

describe("CASE_INVESTIGATION_CASES", () => {
  it("배열 길이가 정확히 6이고 caseId가 전부 고유하다", () => {
    expect(CASE_INVESTIGATION_CASES.length).toBe(6);
    const ids = CASE_INVESTIGATION_CASES.map((c) => c.caseId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hiddenTruth.riskPatterns의 모든 pattern이 evidenceDefinitions에 존재한다", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      const patterns = new Set(c.evidenceDefinitions.map((e) => e.pattern));
      for (const rp of c.hiddenTruth.riskPatterns) {
        expect(patterns.has(rp)).toBe(true);
      }
    }
  });

  it("모든 documents[].blocks[].evidencePattern(null 제외)이 evidenceDefinitions에 존재한다", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      const patterns = new Set(c.evidenceDefinitions.map((e) => e.pattern));
      for (const doc of c.documents) {
        for (const block of doc.blocks) {
          if (block.evidencePattern !== null) {
            expect(patterns.has(block.evidencePattern)).toBe(true);
          }
        }
      }
    }
  });

  it("endingOptions.length === 3이고 decision이 3종 각 정확히 1개씩이다", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      expect(c.endingOptions.length).toBe(3);
      const decisions = c.endingOptions.map((o) => o.decision);
      for (const d of ALL_DECISIONS) {
        expect(decisions.filter((x) => x === d).length).toBe(1);
      }
    }
  });

  it("각 케이스의 endingOptions 중 최고점이 유일하다(동점 없음)", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      const scores = c.endingOptions.map((o) => o.score);
      const max = Math.max(...scores);
      expect(scores.filter((s) => s === max).length).toBe(1);
    }
  });

  it("investigations[].unlockCondition이 evidence/investigation 참조를 올바르게 가리킨다", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      const evidencePatterns = new Set(c.evidenceDefinitions.map((e) => e.pattern));
      const investigationIds = new Set(c.investigations.map((i) => i.investigationId));
      for (const inv of c.investigations) {
        if (inv.unlockCondition?.kind === "evidence") {
          expect(evidencePatterns.has(inv.unlockCondition.pattern)).toBe(true);
        }
        if (inv.unlockCondition?.kind === "investigation") {
          expect(investigationIds.has(inv.unlockCondition.investigationId)).toBe(true);
        }
      }
    }
  });

  it("investigations[].documentId가 documents[].documentId에 존재한다", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      const documentIds = new Set(c.documents.map((d) => d.documentId));
      for (const inv of c.investigations) {
        expect(documentIds.has(inv.documentId)).toBe(true);
      }
    }
  });

  it("contradictions[].statementId가 npc.statements[]에, evidencePattern이 evidenceDefinitions에 존재한다", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      const statementIds = new Set(c.npc.statements.map((s) => s.statementId));
      const evidencePatterns = new Set(c.evidenceDefinitions.map((e) => e.pattern));
      for (const contradiction of c.contradictions) {
        expect(statementIds.has(contradiction.statementId)).toBe(true);
        expect(evidencePatterns.has(contradiction.evidencePattern)).toBe(true);
      }
    }
  });

  it("npc.questions.length === npc.statements.length이고 모든 statementId가 정확히 하나의 질문과 매핑된다", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      expect(c.npc.questions.length).toBe(c.npc.statements.length);
      for (const statement of c.npc.statements) {
        const matches = c.npc.questions.filter((q) => q.statementId === statement.statementId);
        expect(matches.length).toBe(1);
      }
    }
  });

  it("NPC 질문 매핑표와 정확히 일치한다", () => {
    const expected: Record<string, Record<string, string>> = {
      JEONSE_001: { S01: "주변 시세는 어느 정도인가요?" },
      JEONSE_002: {
        S01: "집주인은 어떤 분인가요?",
        S02: "전세금이 시세에 맞나요?",
      },
      JEONSE_003: {
        S01: "집주인이 직접 계약하는 건가요?",
        S02: "보증보험 가입할 수 있나요?",
      },
      CHEONGYAK_004: { S01: "정말 제가 당첨된 게 맞나요?" },
      BUNYANG_005: {
        S01: "수익보장은 언제까지 되나요?",
        S02: "인허가랑 분양보증은 문제없나요?",
      },
      FINAL_001: { S01: "중개사가 뭐라고 했어?" },
    };

    for (const c of CASE_INVESTIGATION_CASES) {
      const caseExpected = expected[c.caseId];
      expect(caseExpected).toBeDefined();
      for (const q of c.npc.questions) {
        expect(q.prompt).toBe(caseExpected[q.statementId]);
      }
    }
  });

  it("npc.greeting과 npc.fallbackLine이 모든 케이스에 비어있지 않게 설정되어 있다", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      expect(c.npc.greeting.trim().length).toBeGreaterThan(0);
      expect(c.npc.fallbackLine.trim().length).toBeGreaterThan(0);
    }
  });

  it("모든 statement의 matchKeywords가 비어있지 않다", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      for (const statement of c.npc.statements) {
        expect(statement.matchKeywords.length).toBeGreaterThan(0);
        for (const keyword of statement.matchKeywords) {
          expect(keyword.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("추천 질문 칩의 prompt는 클릭 시 자기 자신의 statement로 실제 매칭된다(다른 statement로 새지 않는다)", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      for (const question of c.npc.questions) {
        const matched = c.npc.statements.find((statement) =>
          statement.matchKeywords.some((keyword) => question.prompt.includes(keyword))
        );
        expect(matched?.statementId).toBe(question.statementId);
      }
    }
  });

  it("JEONSE_001 스모크 테스트: investigations 2개, evidenceDefinitions 2개", () => {
    const jeonse001 = CASE_INVESTIGATION_CASES.find((c) => c.caseId === "JEONSE_001");
    expect(jeonse001).toBeDefined();
    expect(jeonse001?.investigations.length).toBe(2);
    expect(jeonse001?.evidenceDefinitions.length).toBe(2);
  });

  it("모든 investigation에 비어있지 않은 purpose가 있다 (60자 이내)", () => {
    for (const c of CASE_INVESTIGATION_CASES) {
      for (const inv of c.investigations) {
        expect(inv.purpose.trim().length).toBeGreaterThan(0);
        expect(inv.purpose.length).toBeLessThanOrEqual(60);
      }
    }
  });

  it("purpose는 케이스 제목·사기 유형·정답 암시어를 포함하지 않는다 (ADR-004)", () => {
    const banned = /사기|위험|보이스피싱|전세사기|깡통전세/;
    for (const c of CASE_INVESTIGATION_CASES) {
      for (const inv of c.investigations) {
        expect(inv.purpose.includes(c.title)).toBe(false);
        expect(banned.test(inv.purpose)).toBe(false);
      }
    }
  });
});
