import type { VoicePhishingScenario } from "@/types/experience";

export const VOICE_PHISHING_SCENARIOS: VoicePhishingScenario[] = [
  {
    id: "scam-loan-consolidation",
    isNormalCase: false,
    startNodeId: "scam-1",
    nodes: [
      {
        id: "scam-1",
        speaker: "발신번호 알 수 없음",
        line: "안녕하세요, 고객님. △△저축은행 대출 상담팀입니다. 기존 대출을 더 낮은 금리로 갈아타실 수 있는 특별 상품이 있어 연락드렸습니다.",
        choices: [
          { id: "listen-more", text: "어떤 상품인지 좀 더 들어본다", next: "scam-2" },
          { id: "refuse-hangup", text: "필요 없다고 말하고 전화를 끊는다" },
        ],
      },
      {
        id: "scam-2",
        speaker: "발신번호 알 수 없음",
        line: "대환 심사를 도와드리려면 본인 확인이 필요합니다. 지금 문자로 보내드리는 앱을 설치하시고, 주민등록번호와 계좌 비밀번호를 입력해 주세요.",
        choices: [
          { id: "comply-provide-info", text: "안내에 따라 앱을 설치하고 정보를 입력한다" },
          { id: "refuse-suspicious", text: "수상하다는 생각이 들어 전화를 끊는다" },
        ],
      },
    ],
  },
  {
    id: "normal-card-confirm",
    isNormalCase: true,
    startNodeId: "normal-1",
    nodes: [
      {
        id: "normal-1",
        speaker: "카드사 대표번호",
        line: "고객님, 방금 편의점에서 32,000원 결제가 있었는데 본인이 이용하신 것이 맞을까요? 확인 차 전화드렸습니다.",
        choices: [
          { id: "confirm-purchase", text: "본인이 결제한 것이 맞다고 답한다", next: "normal-2" },
          { id: "refuse-hangup", text: "모르는 번호라 바로 전화를 끊는다" },
        ],
      },
      {
        id: "normal-2",
        speaker: "카드사 대표번호",
        line: "확인 감사합니다. 별도로 요청드릴 정보는 없으며, 이상 결제가 의심되면 카드 뒷면의 공식 번호로 다시 연락해 주세요.",
        choices: [
          { id: "end-call-politely", text: "알겠다고 답하고 통화를 마친다" },
          { id: "refuse-still-suspicious", text: "그래도 미심쩍어 전화를 끊는다" },
        ],
      },
    ],
  },
];
