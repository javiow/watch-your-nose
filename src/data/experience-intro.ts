import type { ExperienceTypeId } from "@/types/experience";

// 체험 시작 전 모달(IntroDialog)에 채우는 "지금 어떤 상황이고 무엇을 해야 하는지" 카피.
// EXPERIENCE_FORMAT(짧은 형식 힌트)과 별개의 관심사라 파일을 분리한다.
// CRITICAL: situation·task 어디에도 사기 유형명이나 EXPERIENCE_TYPE_LABELS 값,
// 정답을 암시하는 표현을 쓰지 않는다 (ADR-004: 사전 비노출, ADR-005: 피해자 관점).
export interface ExperienceIntroMeta {
  /** 지금 놓인 상황. \n\n로 구분된 2개 정도의 짧은 문단. */
  situation: string;
  /** 이번 체험에서 사용자가 할 일. 명령형 3~4개. */
  task: string[];
}

export const EXPERIENCE_INTRO: Record<ExperienceTypeId, ExperienceIntroMeta> = {
  "voice-phishing": {
    situation:
      "모르는 번호로 전화가 걸려 옵니다. 상대는 공공기관이나 금융회사 직원이라고 자신을 소개합니다.\n\n통화는 자동으로 이어집니다. 상대의 말을 듣고 매 순간 어떻게 반응할지 고르세요.",
    task: [
      "상대의 말을 끝까지 들어본다",
      "개인정보·계좌·앱 설치를 요구하는지 살핀다",
      "각 순간에 할 대답을 고른다",
    ],
  },
  "case-investigation": {
    situation:
      "계약을 앞둔 매물 하나가 있습니다. 계약 전에 이 건을 조사할 수 있습니다.\n\n조사에는 예산(포인트)이 있습니다. 서류를 열람하거나 관계자에게 질문할 때마다 포인트가 듭니다. 조사를 많이 할수록 단서는 늘지만 예산이 줄고, 너무 아끼면 핵심 단서를 놓칩니다.",
    task: [
      "예산 안에서 필요한 서류를 골라 열람한다",
      "서류에서 이상한 부분을 눌러 증거로 등록한다",
      "관계자에게 질문해 말과 서류가 맞는지 본다",
      "조사한 내용을 근거로 계약 여부를 판단한다",
    ],
  },
  jeonse: {
    situation:
      "골목에 매물 다섯 곳이 있습니다. 각 집의 서류를 확인하고 계약해도 될지 판정합니다.\n\n매물을 클릭하면 바로 들어갑니다. 원하면 방향키로 걸어가 붉은 문 앞에 서도 됩니다.",
    task: [
      "매물을 클릭해 서류를 연다",
      "보증금·시세·등기 등 서류를 읽는다",
      "위험 신호가 있으면 O, 없으면 X로 판정한다",
      "다섯 곳을 모두 판정한다",
    ],
  },
  "fraud-judgment": {
    situation:
      "짧은 상황 카드가 연달아 나옵니다. 문자, 메신저 대화, 안내문 같은 장면입니다.\n\n각 카드를 보고 곧바로 판정합니다.",
    task: [
      "카드의 상황을 읽는다",
      "사기인지 정상인지 바로 고른다",
      "다음 카드로 넘어간다",
    ],
  },
};
