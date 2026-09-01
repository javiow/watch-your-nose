import type { CaseNpcPersona, CaseNpcStatement } from "@/types/experience";
import { matchNpcStatement } from "./npc-chat";

interface ClassifyResponseBody {
  statementId: string | null;
  handled: boolean; // false면 LLM 호출이 실패/미구성된 것 — 로컬 키워드 매칭으로 폴백한다.
}

export async function classifyQuestion(
  npc: CaseNpcPersona,
  input: string
): Promise<CaseNpcStatement | null> {
  try {
    const response = await fetch("/api/npc-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        npcDisplayName: npc.displayName,
        options: npc.questions.map((q) => ({
          statementId: q.statementId,
          topic: q.prompt,
        })),
        userInput: input,
      }),
    });

    if (!response.ok) {
      return matchNpcStatement(npc, input);
    }

    const data = (await response.json()) as ClassifyResponseBody;
    if (!data.handled) {
      return matchNpcStatement(npc, input);
    }
    if (!data.statementId) {
      return null;
    }
    return npc.statements.find((s) => s.statementId === data.statementId) ?? null;
  } catch {
    return matchNpcStatement(npc, input);
  }
}
