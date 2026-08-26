import type { VoicePhishingScenario } from "@/types/experience";

export const VOICE_PHISHING_SCENARIOS: VoicePhishingScenario[] = [
  {
    id: "normal-overseas-payment-alert",
    isNormalCase: true,
    category: "정상금융확인형",
    startNodeId: "n1",
    nodes: [
      {
        id: "n1",
        speaker: "OO은행 이상거래탐지팀",
        line: "고객님, 방금 해외 가맹점에서 235,000원 결제 시도가 있어 자동으로 차단했습니다. 본인이 시도하신 결제가 맞을까요?",
        choices: [
          { id: "confirm-not-me", text: "아니요, 저는 시도한 적 없어요", next: "n2" },
          { id: "refuse-hangup", text: "모르는 번호라 미심쩍어 바로 끊는다" },
        ],
      },
      {
        id: "n2",
        speaker: "OO은행 이상거래탐지팀",
        line: "확인 감사합니다. 저희 쪽에서 이미 차단 처리했고 별도로 알려주실 정보는 없습니다. 다만 카드 재발급이 필요하시면 카드 뒷면의 대표번호로 직접 연락해 신청해 주세요.",
        choices: [
          { id: "end-call-politely", text: "알겠다고 답하고 통화를 마친다" },
          { id: "refuse-still-suspicious", text: "그래도 미심쩍어 전화를 끊는다" },
        ],
      },
    ],
  },
  {
    id: "normal-delivery-address-confirm",
    isNormalCase: true,
    category: "정상생활안내형",
    startNodeId: "n1",
    nodes: [
      {
        id: "n1",
        speaker: "CJ○○ 택배 고객센터",
        line: "고객님 앞으로 온 택배가 부재중으로 반송 처리 예정입니다. 오늘 중 재배송하지 않으면 물류센터로 회수됩니다. 배송지 다시 확인 도와드릴까요?",
        choices: [
          { id: "confirm-address", text: "네, 배송지를 다시 알려준다", next: "n2" },
          { id: "refuse-hangup", text: "보이스피싱 같아 바로 끊는다" },
        ],
      },
      {
        id: "n2",
        speaker: "CJ○○ 택배 고객센터",
        line: "확인 감사합니다. 결제나 배송비 관련해서는 요구드릴 내용이 없고, 오늘 중 다시 배송해드리겠습니다.",
        choices: [
          { id: "end-call-politely", text: "알겠다고 답하고 통화를 마친다" },
          { id: "refuse-still-suspicious", text: "그래도 의심스러워 전화를 끊는다" },
        ],
      },
    ],
  },
  {
    id: "scam-refund-remote-app",
    isNormalCase: false,
    category: "환불결제사칭형",
    startNodeId: "s1",
    nodes: [
      {
        id: "s1",
        speaker: "OO쇼핑 고객만족센터",
        line: "안녕하세요 고객님, 지난달 주문하신 상품이 품절되어 환불 처리를 도와드리려고 연락드렸습니다. 잠시 시간 괜찮으실까요?",
        choices: [
          { id: "listen-more", text: "네, 말씀하세요", next: "s2" },
          { id: "refuse-hangup", text: "주문한 적 없어서 바로 끊는다" },
        ],
      },
      {
        id: "s2",
        speaker: "OO쇼핑 고객만족센터",
        line: "환불 처리를 위해 원격지원 앱을 하나 설치해주시면 저희 상담원이 화면을 보면서 계좌로 바로 환불해드릴 수 있어요. 어렵지 않으니 안내해드릴게요.",
        choices: [
          { id: "comply-install-app", text: "안내에 따라 원격지원 앱을 설치한다" },
          { id: "refuse-suspicious", text: "이상해서 설치를 거부하고 전화를 끊는다" },
        ],
      },
    ],
  },
  {
    id: "scam-government-loan-program",
    isNormalCase: false,
    category: "대출빙자형",
    startNodeId: "s1",
    nodes: [
      {
        id: "s1",
        speaker: "서민금융지원센터",
        line: "안녕하세요 고객님, 정부 지원 저금리 대환대출 대상자로 안내드리려 연락드렸습니다. 기존 대출을 더 낮은 금리로 바꿔드릴 수 있어요.",
        choices: [
          { id: "listen-more", text: "어떤 조건인지 들어본다", next: "s2" },
          { id: "refuse-hangup", text: "필요 없다며 바로 끊는다" },
        ],
      },
      {
        id: "s2",
        speaker: "서민금융지원센터",
        line: "심사를 위해 성함, 주민등록번호, 그리고 신분 확인용으로 계좌 비밀번호 앞 두 자리만 확인 부탁드립니다. 절차대로 진행되는 거니 걱정 안 하셔도 돼요.",
        choices: [
          { id: "comply-provide-info", text: "안심하고 요청한 정보를 알려준다" },
          { id: "refuse-suspicious", text: "비밀번호까지 요구하는게 이상해 전화를 끊는다" },
        ],
      },
    ],
  },
  {
    id: "normal-sim-reissue-alert",
    isNormalCase: true,
    category: "정상생활안내형",
    startNodeId: "n1",
    nodes: [
      {
        id: "n1",
        speaker: "OO텔레콤 보안센터",
        line: "고객님, 방금 다른 기기에서 고객님 명의로 유심 재발급 시도가 있어 저희 쪽에서 자동으로 차단했습니다. 본인이 시도하신 게 맞을까요?",
        choices: [
          { id: "confirm-not-me", text: "아니요, 저는 시도한 적 없어요", next: "n2" },
          { id: "refuse-hangup", text: "모르는 번호라 미심쩍어 바로 끊는다" },
        ],
      },
      {
        id: "n2",
        speaker: "OO텔레콤 보안센터",
        line: "확인 감사합니다. 시도는 이미 차단됐고 별도로 알려주실 정보는 없습니다. 유심 재발급이 필요하시면 대리점 방문이나 공식 앱에서 본인 인증 후 진행해 주세요.",
        choices: [
          { id: "end-call-politely", text: "알겠다고 답하고 통화를 마친다" },
          { id: "refuse-still-suspicious", text: "그래도 미심쩍어 전화를 끊는다" },
        ],
      },
    ],
  },
  {
    id: "scam-fake-prosecutor-safe-account",
    isNormalCase: false,
    category: "기관사칭형",
    startNodeId: "s1",
    nodes: [
      {
        id: "s1",
        speaker: "OO지방검찰청 수사관",
        line: "고객님 명의 계좌가 대포통장 개설 및 자금세탁 사건에 연루된 정황이 확인되어 연락드렸습니다. 본인 명의 계좌가 맞으신가요?",
        choices: [
          { id: "listen-more", text: "무슨 일인지 자세히 들어본다", next: "s2" },
          { id: "refuse-hangup", text: "검찰이 전화로 연락할 리 없다며 바로 끊는다" },
        ],
      },
      {
        id: "s2",
        speaker: "OO지방검찰청 수사관",
        line: "수사 협조 차원에서 계좌 자금을 저희가 안내하는 안전계좌로 임시 이체해주셔야 합니다. 혐의 없음이 확인되면 수사 종료 후 바로 돌려드립니다.",
        choices: [
          { id: "comply-transfer-funds", text: "혐의를 벗으려 안내에 따라 이체한다" },
          { id: "refuse-suspicious", text: "공공기관은 이체를 요구하지 않는다는 걸 알고 있어 전화를 끊는다" },
        ],
      },
    ],
  },
];
