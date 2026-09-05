import type { ExperienceTypeId } from "@/types/experience";

export interface ExperienceFormatMeta {
  /** 이모지 아이콘 하나 */
  icon: string;
  /**
   * 체험 중 화면에 보여줄 "상호작용 형식". 사기 유형명이 아니다.
   * EXPERIENCE_TYPE_LABELS(결과 페이지 전용 유형명)와 문자열이 겹치면 안 된다
   * (ADR-004: 체험 중 유형명 비노출).
   */
  formatLabel: string;
  /** 5~10자 내외 초단문 안내 */
  hint: string;
  /** 결과 막대그래프 캡션용, 6자 내외 명사구 (문장이 아니다) */
  learningPhrase: string;
}

export const EXPERIENCE_FORMAT: Record<ExperienceTypeId, ExperienceFormatMeta> = {
  "voice-phishing": {
    icon: "📞",
    formatLabel: "전화 통화",
    hint: "듣고 바로 답해보세요",
    learningPhrase: "전화 판단력",
  },
  "case-investigation": {
    icon: "🔍",
    formatLabel: "현장 조사",
    hint: "서류를 확인해보세요",
    learningPhrase: "서류 비교력",
  },
  jeonse: {
    icon: "🏠",
    formatLabel: "매물 확인",
    hint: "매물 서류를 확인해보세요",
    learningPhrase: "계약 전 확인력",
  },
  "fraud-judgment": {
    icon: "⚡",
    formatLabel: "빠른 판별",
    hint: "바로바로 판단해보세요",
    learningPhrase: "즉시 판단력",
  },
};
