import { afterEach, describe, expect, it, vi } from "vitest";
import type { CaseNpcPersona } from "@/types/experience";
import { classifyQuestion } from "./npc-chat-client";

const npc: CaseNpcPersona = {
  npcId: "NPC_TEST",
  displayName: "테스트 NPC",
  greeting: "안녕하세요",
  fallbackLine: "그건 잘 모르겠네요",
  statements: [{ statementId: "S01", text: "시세는 정상입니다", matchKeywords: ["시세"] }],
  questions: [{ questionId: "S01-q", prompt: "시세가 어떻게 되나요?", statementId: "S01" }],
};

describe("classifyQuestion", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("서버가 handled:true와 statementId를 반환하면 해당 statement를 반환한다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ statementId: "S01", handled: true }),
    }) as unknown as typeof fetch;

    const result = await classifyQuestion(npc, "가격이 궁금해요");
    expect(result?.statementId).toBe("S01");
  });

  it("서버가 handled:true와 statementId:null을 반환하면(LLM이 진짜 매칭 없음을 판단) null을 반환하고 로컬 매칭으로 재시도하지 않는다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ statementId: null, handled: true }),
    }) as unknown as typeof fetch;

    const result = await classifyQuestion(npc, "시세 얘기지만 LLM이 아니라고 판단");
    expect(result).toBeNull();
  });

  it("서버가 handled:false를 반환하면(API 키 미구성 등) 로컬 키워드 매칭으로 폴백한다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ statementId: null, handled: false }),
    }) as unknown as typeof fetch;

    const result = await classifyQuestion(npc, "시세 알려줘");
    expect(result?.statementId).toBe("S01");
  });

  it("네트워크 요청이 실패하면 로컬 키워드 매칭으로 폴백한다", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const result = await classifyQuestion(npc, "시세 알려줘");
    expect(result?.statementId).toBe("S01");
  });

  it("응답이 ok가 아니면 로컬 키워드 매칭으로 폴백한다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const result = await classifyQuestion(npc, "시세 알려줘");
    expect(result?.statementId).toBe("S01");
  });
});
