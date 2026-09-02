import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

interface ClassifyRequestBody {
  npcDisplayName: string;
  options: { statementId: string; topic: string }[];
  userInput: string;
}

function isClassifyRequestBody(value: unknown): value is ClassifyRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body.npcDisplayName === "string" &&
    typeof body.userInput === "string" &&
    Array.isArray(body.options) &&
    body.options.every(
      (o) =>
        typeof o === "object" &&
        o !== null &&
        typeof (o as Record<string, unknown>).statementId === "string" &&
        typeof (o as Record<string, unknown>).topic === "string"
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ statementId: null, handled: false }, { status: 400 });
  }

  if (!isClassifyRequestBody(body) || body.options.length === 0 || !body.userInput.trim()) {
    return NextResponse.json({ statementId: null, handled: false }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ statementId: null, handled: false });
  }

  const candidateIds = body.options.map((o) => o.statementId);

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system:
        `당신은 "${body.npcDisplayName}"에게 사용자가 던진 자유 입력 질문이 아래 주제 목록 중 ` +
        `무엇과 가장 관련 있는지 판단하는 분류기입니다. 반드시 classify_question 도구를 정확히 한 번 호출하세요. ` +
        `관련된 주제가 없으면 statementId를 "NONE"으로 답하세요.`,
      tools: [
        {
          name: "classify_question",
          description: "사용자의 자유 입력 질문을 주어진 주제 목록 중 하나로 분류한다.",
          input_schema: {
            type: "object",
            properties: {
              statementId: {
                type: "string",
                enum: [...candidateIds, "NONE"],
                description: "가장 관련 있는 주제의 id. 관련된 주제가 없으면 NONE.",
              },
            },
            required: ["statementId"],
            additionalProperties: false,
          },
          strict: true,
        },
      ],
      tool_choice: { type: "tool", name: "classify_question" },
      messages: [
        {
          role: "user",
          content:
            "주제 목록:\n" +
            body.options.map((o) => `- ${o.statementId}: ${o.topic}`).join("\n") +
            `\n\n사용자 질문: ${body.userInput}`,
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    const rawStatementId =
      toolUse && typeof toolUse.input === "object" && toolUse.input !== null
        ? (toolUse.input as { statementId?: unknown }).statementId
        : null;

    // 서버 측 검증 — LLM 출력이 스키마를 벗어나도 실제 candidateIds에 없는 값은 절대 신뢰하지 않는다.
    const statementId =
      typeof rawStatementId === "string" && candidateIds.includes(rawStatementId)
        ? rawStatementId
        : null;

    return NextResponse.json({ statementId, handled: true });
  } catch {
    return NextResponse.json({ statementId: null, handled: false });
  }
}
