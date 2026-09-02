import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(function AnthropicMock() {
      return { messages: { create: createMock } };
    }),
  };
});

import { POST } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/npc-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  npcDisplayName: "공인중개사 김중개",
  options: [{ statementId: "S01", topic: "보증보험 가입할 수 있나요?" }],
  userInput: "보증보험 되나요?",
};

describe("POST /api/npc-chat", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    createMock.mockReset();
  });

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("ANTHROPIC_API_KEY가 없으면 handled:false를 반환하고 LLM을 호출하지 않는다", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(data).toEqual({ statementId: null, handled: false });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("잘못된 요청 본문은 400과 handled:false를 반환한다", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const response = await POST(makeRequest({ npcDisplayName: "김중개" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ statementId: null, handled: false });
  });

  it("LLM이 정상 매칭된 statementId를 반환하면 그대로 전달한다", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", input: { statementId: "S01" } }],
    });

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(data).toEqual({ statementId: "S01", handled: true });
  });

  it("LLM이 NONE을 반환하면 statementId는 null이지만 handled는 true다", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", input: { statementId: "NONE" } }],
    });

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(data).toEqual({ statementId: null, handled: true });
  });

  it("LLM이 candidateIds에 없는 값을 반환해도(환각) 서버가 걸러내고 null로 응답한다", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", input: { statementId: "존재하지_않는_ID" } }],
    });

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(data).toEqual({ statementId: null, handled: true });
  });

  it("Anthropic 호출이 실패하면 handled:false로 응답한다", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    createMock.mockRejectedValue(new Error("network error"));

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(data).toEqual({ statementId: null, handled: false });
  });
});
