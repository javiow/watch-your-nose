import { describe, expect, it } from "vitest";
import type { CaseNpcPersona } from "@/types/experience";
import { MIN_QUESTION_LENGTH, isMeaningfulQuestion, matchNpcStatement } from "./npc-chat";

const npc: CaseNpcPersona = {
  npcId: "NPC_TEST",
  displayName: "테스트 NPC",
  greeting: "안녕하세요",
  fallbackLine: "그건 잘 모르겠네요",
  statements: [
    { statementId: "S01", text: "시세는 정상입니다", matchKeywords: ["시세", "가격"] },
    { statementId: "S02", text: "집주인은 믿을 만합니다", matchKeywords: ["집주인", "임대인"] },
  ],
  questions: [
    { questionId: "S01-q", prompt: "시세가 어떻게 되나요?", statementId: "S01" },
    { questionId: "S02-q", prompt: "집주인은 어떤 분인가요?", statementId: "S02" },
  ],
};

describe("isMeaningfulQuestion", () => {
  it(`trim 후 길이가 ${MIN_QUESTION_LENGTH} 미만이면 false를 반환한다`, () => {
    expect(isMeaningfulQuestion("네?")).toBe(false);
    expect(isMeaningfulQuestion("   ")).toBe(false);
  });

  it(`trim 후 길이가 ${MIN_QUESTION_LENGTH} 이상이면 true를 반환한다`, () => {
    expect(isMeaningfulQuestion("시세가 어떻게 되나요?")).toBe(true);
  });

  it("경계값(정확히 최소 길이)에서 true를 반환한다", () => {
    expect(isMeaningfulQuestion("가".repeat(MIN_QUESTION_LENGTH))).toBe(true);
    expect(isMeaningfulQuestion("가".repeat(MIN_QUESTION_LENGTH - 1))).toBe(false);
  });
});

describe("matchNpcStatement", () => {
  it("입력에 매칭되는 키워드를 포함한 statement를 반환한다", () => {
    expect(matchNpcStatement(npc, "시세가 어떻게 되나요?")?.statementId).toBe("S01");
    expect(matchNpcStatement(npc, "집주인은 어떤 분인가요?")?.statementId).toBe("S02");
  });

  it("어떤 statement의 키워드와도 매칭되지 않으면 null을 반환한다", () => {
    expect(matchNpcStatement(npc, "오늘 날씨 어때요?")).toBeNull();
  });

  it("statements 배열 순서상 먼저 나오는 statement가 우선한다", () => {
    const ambiguousNpc: CaseNpcPersona = {
      ...npc,
      statements: [
        { statementId: "FIRST", text: "첫 번째", matchKeywords: ["공통"] },
        { statementId: "SECOND", text: "두 번째", matchKeywords: ["공통"] },
      ],
    };
    expect(matchNpcStatement(ambiguousNpc, "공통 키워드 질문")?.statementId).toBe("FIRST");
  });
});
