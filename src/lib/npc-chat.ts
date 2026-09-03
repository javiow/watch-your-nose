import type { CaseNpcPersona, CaseNpcStatement } from "@/types/experience";

export const MIN_QUESTION_LENGTH = 4;
export const MAX_NPC_QUESTIONS = 3;

export function isMeaningfulQuestion(input: string): boolean {
  return input.trim().length >= MIN_QUESTION_LENGTH;
}

export function matchNpcStatement(
  npc: CaseNpcPersona,
  input: string
): CaseNpcStatement | null {
  const normalized = input.trim();
  return (
    npc.statements.find((statement) =>
      statement.matchKeywords.some((keyword) => normalized.includes(keyword))
    ) ?? null
  );
}
