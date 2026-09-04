import type { ExperienceTypeId } from "@/types/experience";

// 결과 페이지(/result) 전용 한글 라벨. 체험 진행 중·랜딩 화면에는 절대 사용하지 말 것
// (CLAUDE.md: 체험 유형 목록 사전 비노출 원칙, ADR-004/ADR-016).
export const EXPERIENCE_TYPE_LABELS: Record<ExperienceTypeId, string> = {
  "voice-phishing": "보이스피싱",
  "case-investigation": "케이스 조사",
  jeonse: "전세매물",
  "fraud-judgment": "사기 판별 카드",
};
