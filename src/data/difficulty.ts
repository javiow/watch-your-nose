import type { Difficulty } from "@/types/experience";

export interface DifficultyOption {
  id: Difficulty;
  label: string;
  description: string;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { id: "easy",   label: "쉬움",   description: "위험 신호가 뚜렷해 비교적 알아채기 쉬운 편이에요." },
  { id: "medium", label: "중간",   description: "여러 정보를 함께 따져봐야 판단할 수 있어요." },
  { id: "hard",   label: "어려움", description: "겉으로 보이는 것과 실제가 달라 헷갈리기 쉬워요." },
];
